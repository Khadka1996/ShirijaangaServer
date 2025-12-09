const Student = require('../models/studentModel');
const PromotionalEmail = require('../models/PromotionalEmailModel');
const EmailConfig = require('../models/EmailConfigModel');
const EmailService = require('../utils/email.util');
const { logger } = require('../utils/logger.util');

// Send promotional email to all students
exports.sendPromotionalEmail = async (req, res) => {
  let promotionalEmail;
  
  try {
    const { title, content, buttonText, buttonLink, contactEmail, contactPhone } = req.body;

    // Validate required fields
    if (!title || !content || !buttonLink || !contactEmail || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, button link, contact email and phone are required'
      });
    }

    // Get active email config
    const emailConfig = await EmailConfig.findOne({ isActive: true });
    if (!emailConfig) {
      return res.status(400).json({
        success: false,
        message: 'No active email configuration found. Please set up email first.'
      });
    }

    // Get all students with emails
    const students = await Student.find({ 
      email: { 
        $exists: true, 
        $ne: '', 
        $regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
      } 
    });
    
    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No students with valid email addresses found'
      });
    }

    // Check daily limit
    await emailConfig.resetDailyCounterIfNeeded();
    const remainingEmails = emailConfig.dailyLimit - emailConfig.emailsSentToday;
    
    if (remainingEmails < students.length) {
      return res.status(400).json({
        success: false,
        message: `Daily email limit exceeded. ${remainingEmails} emails remaining, but ${students.length} students to email.`
      });
    }

    // Create promotional email record
    promotionalEmail = await PromotionalEmail.create({
      title: title.trim(),
      content: content.trim(),
      buttonText: (buttonText || 'Book Now').trim(),
      buttonLink: buttonLink.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      configUsed: emailConfig._id,
      status: 'sending',
      totalRecipients: students.length,
      startTime: new Date()
    });

    // Send response immediately (non-blocking)
    res.status(200).json({
      success: true,
      message: `Started sending promotional email to ${students.length} students`,
      data: {
        campaignId: promotionalEmail._id,
        totalStudents: students.length,
        status: 'sending',
        estimatedTime: Math.ceil(students.length * 2 / 60) // Rough estimate in minutes
      }
    });

    // Send emails in background
    sendEmailsInBackground(students, promotionalEmail, emailConfig, req.ip);

  } catch (err) {
    logger.error('Error sending promotional email:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send promotional email'
    });
  }
};

// Background email sending function
async function sendEmailsInBackground(students, promotionalEmail, emailConfig, clientIP) {
  let sentCount = 0;
  let failedCount = 0;
  const startTime = Date.now();
  const batchSize = 10; // Send in batches to avoid overwhelming the email service
  const delayBetweenBatches = 2000; // 2 seconds between batches

  try {
    logger.info(`Starting email campaign: ${promotionalEmail.title} to ${students.length} students`);

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      let batchSent = 0;
      let batchFailed = 0;
      const batchStartTime = Date.now();

      // Process batch concurrently
      const batchPromises = batch.map(async (student) => {
        try {
          const emailContent = generateEmailContent(student, promotionalEmail);
          const result = await EmailService.sendEmail(
            student.email, 
            promotionalEmail.title, 
            emailContent, 
            clientIP
          );

          if (result.success) {
            sentCount++;
            batchSent++;
            logger.debug(`✅ Email sent to: ${student.email}`);
          } else {
            failedCount++;
            batchFailed++;
            await promotionalEmail.addError(student.email, result.error);
            logger.warn(`❌ Failed to send to ${student.email}: ${result.error}`);
          }

          return result;
        } catch (error) {
          failedCount++;
          batchFailed++;
          await promotionalEmail.addError(student.email, error.message);
          logger.error(`❌ Error sending to ${student.email}:`, error);
          return { success: false, error: error.message };
        }
      });

      await Promise.all(batchPromises);

      const batchTime = Date.now() - batchStartTime;
      const averageTime = batchSent > 0 ? Math.round(batchTime / batchSent) : 0;

      // Update campaign progress
      promotionalEmail.sentCount = sentCount;
      promotionalEmail.failedCount = failedCount;
      promotionalEmail.progress = Math.round((sentCount / students.length) * 100);
      await promotionalEmail.addPerformanceLog(batchNumber, batchSent, batchFailed, averageTime);
      await promotionalEmail.updateStats();

      logger.info(`Batch ${batchNumber} completed: ${batchSent} sent, ${batchFailed} failed, ${promotionalEmail.progress}% complete`);

      // Delay between batches to avoid rate limiting
      if (i + batchSize < students.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    // Campaign completed
    const totalTime = Date.now() - startTime;
    promotionalEmail.status = 'completed';
    promotionalEmail.endTime = new Date();
    promotionalEmail.duration = totalTime;
    promotionalEmail.averageSendTime = sentCount > 0 ? Math.round(totalTime / sentCount) : 0;
    await promotionalEmail.save();

    logger.info(`🎉 Email campaign completed: ${sentCount} sent, ${failedCount} failed, Total time: ${Math.round(totalTime / 1000)}s`);

  } catch (error) {
    logger.error('Error in background email sending:', error);
    
    if (promotionalEmail) {
      promotionalEmail.status = 'failed';
      promotionalEmail.endTime = new Date();
      await promotionalEmail.addError('SYSTEM', error.message);
      await promotionalEmail.save();
    }
  }
}

// Generate email content for a student
function generateEmailContent(student, promotionalEmail) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${promotionalEmail.title}</title>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
          background-color: #f9f9f9;
        }
        .container { 
          background: white; 
          padding: 30px; 
          border-radius: 10px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        .header h1 { 
          color: #007bff; 
          margin: 0;
          font-size: 24px;
        }
        .content { 
          margin-bottom: 30px;
        }
        .button { 
          display: inline-block; 
          background: #007bff; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 5px; 
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
        }
        .contact-info { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 5px; 
          margin-top: 30px;
          border-left: 4px solid #007bff;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        .student-name {
          color: #007bff;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${promotionalEmail.title}</h1>
        </div>
        
        <div class="content">
          <p>Dear <span class="student-name">${student.firstName} ${student.lastName}</span>,</p>
          <p>${promotionalEmail.content}</p>
          
          <div style="text-align: center;">
            <a href="${promotionalEmail.buttonLink}" class="button">
              ${promotionalEmail.buttonText}
            </a>
          </div>
        </div>
        
        <div class="contact-info">
          <h3 style="margin-top: 0; color: #007bff;">Contact Us</h3>
          <p><strong>📧 Email:</strong> ${promotionalEmail.contactEmail}</p>
          <p><strong>📞 Phone:</strong> ${promotionalEmail.contactPhone}</p>
          <p><em>We're here to help you with your study abroad journey!</em></p>
        </div>
        
        <div class="footer">
          <p>This email was sent to you because you registered with EduConnect Consultancy.</p>
          <p>EduConnect Consultancy &copy; ${new Date().getFullYear()}. All rights reserved.</p>
          <p><a href="${promotionalEmail.buttonLink}?unsubscribe=true" style="color: #666; text-decoration: none;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Get promotional email history
exports.getPromotionalEmails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const emails = await PromotionalEmail.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('configUsed', 'email fromName')
      .select('-errors -performanceLog'); // Exclude large fields

    const total = await PromotionalEmail.countDocuments();

    res.status(200).json({
      success: true,
      data: emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (err) {
    logger.error('Error getting promotional emails:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get promotional email history'
    });
  }
};

// Get specific promotional email details
exports.getPromotionalEmailById = async (req, res) => {
  try {
    const email = await PromotionalEmail.findById(req.params.id)
      .populate('configUsed', 'email fromName');

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Promotional email not found'
      });
    }

    res.status(200).json({
      success: true,
      data: email
    });

  } catch (err) {
    logger.error('Error getting promotional email:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get promotional email'
    });
  }
};

// Cancel ongoing promotional email campaign
exports.cancelPromotionalEmail = async (req, res) => {
  try {
    const email = await PromotionalEmail.findById(req.params.id);

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Promotional email not found'
      });
    }

    if (email.status !== 'sending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel campaign that is not in sending status'
      });
    }

    email.status = 'cancelled';
    email.endTime = new Date();
    await email.save();

    logger.info(`Promotional email campaign cancelled: ${email.title}`);

    res.status(200).json({
      success: true,
      message: 'Email campaign cancelled successfully',
      data: {
        id: email._id,
        sentCount: email.sentCount,
        failedCount: email.failedCount,
        progress: email.progress
      }
    });

  } catch (err) {
    logger.error('Error cancelling promotional email:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel promotional email'
    });
  }
};