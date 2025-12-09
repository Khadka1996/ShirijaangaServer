const Student = require('../models/studentModel');
const Notification = require('../models/notificationModel');
const PDFDocument = require('pdfkit');

// Create a new student
exports.createStudent = async (req, res) => {
  try {
    const studentData = {
      ...req.body,
      mobile: req.body.mobile.startsWith('+977') ? req.body.mobile : `+977${req.body.mobile}`
    };

    const newStudent = await Student.create(studentData);

    // Create simple notification
    await Notification.create({
      message: `${newStudent.firstName} ${newStudent.lastName} has registered as a new student`,
      studentId: newStudent._id
    });

    res.status(201).json({
      success: true,
      message: 'Student consultation created successfully',
      data: newStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create student consultation',
      error: error.message
    });
  }
};

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

// Get a single student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student',
      error: error.message
    });
  }
};

// Update a student
exports.updateStudent = async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error.message
    });
  }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
      data: deletedStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message
    });
  }
};

// Generate student report
exports.generateStudentReport = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `Student_Report_${student.firstName}_${student.lastName}.pdf`;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${filename}`);
    
    // Handle stream errors
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to generate PDF'
        });
      }
    });

    // Pipe the PDF to response
    doc.pipe(res);

    // ========== HEADER WITH LOGO ==========
    
    // Logo dimensions and positioning
    const logoWidth = 80;
    const logoHeight = 40;
    const logoX = 50; // Left margin
    const logoY = 40; // Top margin
    
    // Option 1: Add logo image (if you have a logo file)
    try {
      // Replace with your actual logo path
      doc.image('public/images/logo.png', logoX, logoY, { 
        width: logoWidth, 
        height: logoHeight 
      });
      
      // Company name positioned next to logo
      doc.fillColor('#1252a1')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('SHIRIJANGA EDUCATION CONSULTANCY', logoX + logoWidth + 15, logoY + 10);
    } catch (imageError) {
      console.warn('Logo image not found, using text-only header');
      // Fallback: Text-only header if logo is not found
      doc.fillColor('#1252a1')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('SHIRIJANGA EDUCATION CONSULTANCY', logoX, logoY + 10);
    }

    // Report title and date
    doc.fillColor('#555555')
       .fontSize(10)
       .text('Student Consultation Report', 50, logoY + logoHeight + 10);

    // Generation date
    doc.fillColor('#777777')
       .fontSize(9)
       .text(`Generated: ${new Date().toLocaleString()}`, 50, logoY + logoHeight + 20, { align: 'right' });

    // Header divider
    const headerBottomY = logoY + logoHeight + 35;
    doc.moveTo(50, headerBottomY)
       .lineTo(550, headerBottomY)
       .lineWidth(1)
       .strokeColor('#eaeaea')
       .stroke();

    // Adjust all content positions based on new header height
    const contentStartY = headerBottomY + 25;

    // Student Information Section
    doc.fillColor('#333333')
       .fontSize(16)
       .text('1. Student Information', 50, contentStartY)
       .moveDown(0.5);

    doc.fontSize(10)
       .text(`Name:`, 50, contentStartY + 30, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${student.firstName} ${student.lastName}`)
       .font('Helvetica')
       .text(`Email:`, 50, contentStartY + 45, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${student.email}`)
       .font('Helvetica')
       .text(`Phone:`, 50, contentStartY + 60, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${student.mobile}`)
       .font('Helvetica')
       .text(`Nearest Office:`, 50, contentStartY + 75, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${student.office}`)
       .moveDown();

    // Consultation Details Section
    doc.fillColor('#333333')
       .fontSize(16)
       .text('2. Consultation Details', 50, contentStartY + 105)
       .moveDown(0.5);

    doc.fontSize(10)
       .text(`Topics of Interest:`, 50, contentStartY + 130, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${student.topics}`)
       .font('Helvetica')
       .text(`Preferred Destination:`, 50, contentStartY + 145, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${student.destinations}`);

    if (student.otherDestination) {
      doc.font('Helvetica')
         .text(`Other Destination:`, 50, contentStartY + 160, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${student.otherDestination}`);
    }

    // Academic Information Section
    doc.fillColor('#333333')
       .fontSize(16)
       .text('3. Academic Information', 50, contentStartY + 190)
       .moveDown(0.5);

    doc.fontSize(10)
       .text(`SLC Percentage/CGPA:`, 50, contentStartY + 215, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${student.slc}`)
       .font('Helvetica')
       .text(`+2 Percentage/CGPA:`, 50, contentStartY + 230, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${student.plusTwo}`)
       .font('Helvetica')
       .text(`Bachelor's Percentage/CGPA:`, 50, contentStartY + 245, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${student.bachelor}`)
       .moveDown();

    // Additional Information Section
    doc.fillColor('#333333')
       .fontSize(16)
       .text('4. Additional Information', 50, contentStartY + 275)
       .moveDown(0.5);

    doc.fontSize(10)
       .text(`Health Issues:`, 50, contentStartY + 300, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${student.healthIssues}`)
       .font('Helvetica')
       .text(`Additional Notes:`, 50, contentStartY + 330)
       .moveDown(0.5)
       .font('Helvetica')
       .text(`${student.additionalInfo}`, { width: 500, align: 'justify' });

    // Footer
    const footerY = 750;
    doc.fontSize(8)
       .fillColor('#777777')
       .text(`Confidential - For internal use only`, 50, footerY, { align: 'center' })
       .text(`Page ${doc.pageNumber}`, 50, footerY, { align: 'right' });

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Report generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error.message
      });
    }
  }
};