const multer = require('multer');
const path = require('path');
const { logger } = require('../utils/logger.util');
const { promisify } = require('util');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);
const { body, validationResult } = require('express-validator');

// Configure storage for advertisement images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/ads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `ad-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('adImage');

// Middleware to handle advertisement image upload
const uploadAdImage = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      logger.error('Advertisement image upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 5MB limit'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to upload advertisement image'
      });
    }
    next();
  });
};

// Middleware to clean up uploaded file if request fails
const cleanupAdImage = async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 400 && req.file) {
      try {
        await unlinkAsync(req.file.path);
        logger.info(`Cleaned up advertisement image: ${req.file.path}`);
      } catch (cleanupErr) {
        logger.error('Advertisement image cleanup error:', cleanupErr);
      }
    }
  });
  next();
};

// Middleware for validating advertisement data
const validateAdvertisement = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('websiteLink')
    .optional()
    .isURL()
    .withMessage('Valid website link is required'),
  body('position')
    .isIn([
      'top_banner',
      'sidebar_top',
      'sidebar_bottom',
      'footer',
      'popup_ad',
      'homepage_top',
      'homepage_bottom',
      'article_sidebar',
      'article_footer',
      'mobile_popup',
    ])
    .withMessage('Invalid advertisement position'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        unlinkAsync(req.file.path).catch(cleanupErr => {
          logger.error('Advertisement image cleanup error during validation:', cleanupErr);
        });
      }
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  uploadAdImage,
  cleanupAdImage,
  validateAdvertisement
};