const Student = require('../models/studentModel');

// Middleware to validate student data
exports.validateStudentData = (req, res, next) => {
  const requiredFields = [
    'firstName', 'lastName', 'email', 'mobile', 
    'office', 'topics', 'destinations', 'slc', 'plusTwo'
  ];
  
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  if (!/^\+977\d{10}$/.test(req.body.mobile)) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number must be in format +977XXXXXXXXXX'
    });
  }

  next();
};

// Middleware to check if student already exists
exports.checkDuplicateStudent = async (req, res, next) => {
  try {
    const existingStudent = await Student.findOne({
      $or: [
        { email: req.body.email },
        { mobile: req.body.mobile }
      ]
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student with this email or mobile number already exists'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while checking for duplicate student',
      error: error.message
    });
  }
};