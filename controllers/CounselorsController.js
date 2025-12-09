const Counselor = require('../models/CounselorsModel');
const { logger } = require('../utils/logger.util');
const { promisify } = require('util');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);
const path = require('path');

// Get all counselors with pagination and filtering
exports.getAllCounselors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.expertise) {
      filter.expertise = new RegExp(req.query.expertise, 'i');
    }
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { role: new RegExp(req.query.search, 'i') }
      ];
    }

    // Get total count for pagination
    const total = await Counselor.countDocuments(filter);
    
    // Get paginated results
    const counselors = await Counselor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    logger.info(`Fetched ${counselors.length} counselors`);
    
    res.status(200).json({
      success: true,
      count: counselors.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      data: counselors
    });
  } catch (err) {
    logger.error('Error fetching counselors:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch counselors'
    });
  }
};

// Get active counselors for frontend display
exports.getActiveCounselors = async (req, res) => {
  try {
    const counselors = await Counselor.find()
      .sort({ createdAt: -1 })
      .select('name role expertise image bio certifications');

    logger.info(`Fetched ${counselors.length} counselors for frontend`);
    
    res.status(200).json({
      success: true,
      count: counselors.length,
      data: counselors
    });
  } catch (err) {
    logger.error('Error fetching counselors:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch counselors'
    });
  }
};

// Get a single counselor by ID
exports.getCounselor = async (req, res) => {
  try {
    const counselor = await Counselor.findById(req.params.id);

    if (!counselor) {
      logger.warn(`Counselor not found with id: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Counselor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: counselor
    });
  } catch (err) {
    logger.error('Error fetching counselor:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch counselor'
    });
  }
};

// Create a new counselor
exports.createCounselor = async (req, res) => {
  try {
    const { name, role, expertise, bio, certifications } = req.body;
    
    // Validate required fields
    if (!name || !role || !expertise || !bio || !certifications) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, role, expertise, bio, certifications'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Counselor image is required'
      });
    }

    // Process certifications - convert string to array if needed
    let certificationsArray;
    if (typeof certifications === 'string') {
      certificationsArray = certifications.split(',').map(cert => cert.trim()).filter(cert => cert.length > 0);
    } else if (Array.isArray(certifications)) {
      certificationsArray = certifications.filter(cert => cert && cert.trim().length > 0);
    } else {
      certificationsArray = [];
    }

    if (certificationsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one certification is required'
      });
    }

    const imagePath = `/uploads/counselors/${req.file.filename}`;

    const newCounselor = await Counselor.create({
      name: name.trim(),
      role: role.trim(),
      expertise: expertise.trim(),
      bio: bio.trim(),
      certifications: certificationsArray,
      image: imagePath
    });

    logger.info(`Created new counselor: ${newCounselor.name}`);
    res.status(201).json({
      success: true,
      data: newCounselor
    });
  } catch (err) {
    logger.error('Error creating counselor:', err);
    
    // Cleanup uploaded file if creation fails
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (cleanupErr) {
        logger.error('Failed to cleanup counselor image:', cleanupErr);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create counselor'
    });
  }
};

// Update a counselor
exports.updateCounselor = async (req, res) => {
  try {
    const { name, role, expertise, bio, certifications } = req.body;
    const updateData = { name, role, expertise, bio };
    
    // Process certifications if provided
    if (certifications) {
      let certificationsArray;
      if (typeof certifications === 'string') {
        certificationsArray = certifications.split(',').map(cert => cert.trim()).filter(cert => cert.length > 0);
      } else if (Array.isArray(certifications)) {
        certificationsArray = certifications.filter(cert => cert && cert.trim().length > 0);
      } else {
        certificationsArray = [];
      }

      if (certificationsArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one certification is required'
        });
      }
      updateData.certifications = certificationsArray;
    }
    
    // Handle image update
    if (req.file) {
      updateData.image = `/uploads/counselors/${req.file.filename}`;
      
      // Delete old image
      const existingCounselor = await Counselor.findById(req.params.id);
      if (existingCounselor && existingCounselor.image) {
        const oldImagePath = path.join(__dirname, '../', existingCounselor.image);
        try {
          await unlinkAsync(oldImagePath);
        } catch (cleanupErr) {
          logger.error('Failed to delete old counselor image:', cleanupErr);
        }
      }
    }

    const updatedCounselor = await Counselor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCounselor) {
      logger.warn(`Counselor not found with id: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Counselor not found'
      });
    }

    logger.info(`Updated counselor: ${updatedCounselor.name}`);
    res.status(200).json({
      success: true,
      data: updatedCounselor
    });
  } catch (err) {
    logger.error('Error updating counselor:', err);
    
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (cleanupErr) {
        logger.error('Failed to cleanup counselor image:', cleanupErr);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update counselor'
    });
  }
};

// Delete a counselor (HARD DELETE - PERMANENT)
exports.deleteCounselor = async (req, res) => {
  try {
    const counselor = await Counselor.findById(req.params.id);

    if (!counselor) {
      logger.warn(`Counselor not found with id: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Counselor not found'
      });
    }

    // Delete associated image file
    if (counselor.image) {
      const imagePath = path.join(__dirname, '../', counselor.image);
      try {
        await unlinkAsync(imagePath);
        logger.info(`Deleted counselor image: ${counselor.image}`);
      } catch (cleanupErr) {
        logger.error('Failed to delete counselor image:', cleanupErr);
      }
    }

    // PERMANENTLY delete from database
    await Counselor.findByIdAndDelete(req.params.id);

    logger.info(`Permanently deleted counselor: ${counselor.name}`);
    res.status(200).json({
      success: true,
      message: 'Counselor deleted successfully',
      data: {
        counselorId: req.params.id,
        name: counselor.name
      }
    });
  } catch (err) {
    logger.error('Error deleting counselor:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete counselor'
    });
  }
};

