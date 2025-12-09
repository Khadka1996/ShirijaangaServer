const multer = require('multer');
const path = require('path');
const { logger } = require('../utils/logger.util');
const { promisify } = require('util');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);

// Configure storage for team member images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/team');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `team-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('image');

// Middleware to handle team image upload
const uploadTeamImage = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      logger.error('Team image upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 5MB limit'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to upload image'
      });
    }
    next();
  });
};

// Middleware to clean up uploaded file if request fails
const cleanupTeamImage = async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 400 && req.file) {
      try {
        await unlinkAsync(req.file.path);
        logger.info(`Cleaned up team image: ${req.file.path}`);
      } catch (cleanupErr) {
        logger.error('Team image cleanup error:', cleanupErr);
      }
    }
  });
  next();
};

module.exports = {
  uploadTeamImage,
  cleanupTeamImage
};