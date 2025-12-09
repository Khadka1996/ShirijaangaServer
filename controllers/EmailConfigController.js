const EmailConfig = require('../models/EmailConfigModel');
const EmailService = require('../utils/email.util');
const { logger } = require('../utils/logger.util');

// Create or update email configuration
exports.setEmailConfig = async (req, res) => {
  try {
    const { email, appPassword, fromName, dailyLimit } = req.body;

    // Validate required fields
    if (!email || !appPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and app password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate app password format (Gmail app passwords are 16 characters without spaces)
    const cleanAppPassword = appPassword.replace(/\s/g, '');
    if (cleanAppPassword.length !== 16) {
      return res.status(400).json({
        success: false,
        message: 'App password must be 16 characters long'
      });
    }

    // Deactivate all other configs
    await EmailConfig.updateMany({}, { isActive: false });

    // Create new active config
    const emailConfig = await EmailConfig.create({
      email: email.trim().toLowerCase(),
      appPassword: cleanAppPassword,
      fromName: fromName?.trim() || 'EduConnect Consultancy',
      dailyLimit: dailyLimit || 500,
      isActive: true
    });

    // Reinitialize email service with new config
    const clientIP = req.ip || req.connection.remoteAddress;
    await EmailService.initializeTransporter(clientIP);

    logger.info(`New email configuration set: ${email}`);
    
    res.status(200).json({
      success: true,
      message: 'Email configuration updated successfully',
      data: {
        id: emailConfig._id,
        email: emailConfig.email,
        fromName: emailConfig.fromName,
        dailyLimit: emailConfig.dailyLimit,
        isActive: emailConfig.isActive
      }
    });

  } catch (err) {
    logger.error('Error setting email config:', err);
    
    // Handle duplicate active configuration error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An active email configuration already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to set email configuration'
    });
  }
};

// Get current email configuration
exports.getEmailConfig = async (req, res) => {
  try {
    const config = await EmailConfig.findOne({ isActive: true });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'No email configuration found'
      });
    }

    // Don't send app password in response
    const configData = {
      id: config._id,
      email: config.email,
      fromName: config.fromName,
      dailyLimit: config.dailyLimit,
      emailsSentToday: config.emailsSentToday,
      monthlyEmailsSent: config.monthlyEmailsSent,
      lastResetDate: config.lastResetDate,
      currentMonth: config.currentMonth,
      isActive: config.isActive,
      totalEmailsSent: config.totalEmailsSent,
      successRate: config.successRate,
      averageSendTime: config.averageSendTime
    };

    res.status(200).json({
      success: true,
      data: configData
    });

  } catch (err) {
    logger.error('Error getting email config:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get email configuration'
    });
  }
};

// Test email configuration
exports.testEmailConfig = async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }

    // Validate test email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid test email address'
      });
    }

    const testContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Test Email from EduConnect</h2>
        <p>This is a test email to verify your email configuration.</p>
        <p>If you received this email, your configuration is working correctly!</p>
        <div style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Service:</strong> Gmail SMTP</p>
          <p><strong>Status:</strong> ✅ Working</p>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          This is an automated test message from EduConnect Consultancy system.
        </p>
      </div>
    `;

    const clientIP = req.ip || req.connection.remoteAddress;
    const result = await EmailService.sendEmail(testEmail, 'Test Email - EduConnect Configuration', testContent, clientIP);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          sendTime: result.sendTime,
          messageId: result.messageId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }

  } catch (err) {
    logger.error('Error testing email config:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to test email configuration'
    });
  }
};

// Get email statistics
exports.getEmailStats = async (req, res) => {
  try {
    const stats = await EmailService.getEmailStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (err) {
    logger.error('Error getting email stats:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get email statistics'
    });
  }
};

// Delete email configuration
exports.deleteEmailConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await EmailConfig.findById(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Email configuration not found'
      });
    }

    await EmailConfig.findByIdAndDelete(id);

    // Reset email service
    EmailService.transporter = null;
    EmailService.currentConfig = null;

    logger.info(`Email configuration deleted: ${config.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Email configuration deleted successfully'
    });

  } catch (err) {
    logger.error('Error deleting email config:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email configuration'
    });
  }
};