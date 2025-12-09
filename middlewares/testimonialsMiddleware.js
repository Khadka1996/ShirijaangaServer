const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const Testimonial = require('../models/testimonialsModel');
const asyncHandler = require('express-async-handler');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = 'uploads/testimonials/';
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `testimonial-${Date.now()}${ext}`);
  },
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, or WebP images are allowed'), false);
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Middleware for image upload
const uploadTestimonialImage = upload.single('image');

// Handle upload errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// Validate testimonial data
const validateTestimonialData = asyncHandler(async (req, res, next) => {
  const { name, country, quote, rating } = req.body;
  const errors = [];

  if (!name) errors.push('Name is required');
  if (!country) errors.push('Country is required');
  if (!quote) errors.push('Quote is required');
  else if (quote.length < 20 || quote.length > 500) {
    errors.push('Quote must be between 20-500 characters');
  }
  if (!rating) errors.push('Rating is required');
  else if (isNaN(rating) || rating < 1 || rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }
  // Require file for new testimonials, optional for updates
  if (!req.file && !req.body.image && req.method === 'POST') {
    errors.push('Image file is required');
  }

  if (errors.length > 0) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  next();
});

// Validate testimonial ID
const validateTestimonialId = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid testimonial ID format');
  }
  next();
});

// Check for duplicate testimonials
const checkDuplicateTestimonial = asyncHandler(async (req, res, next) => {
  const { name, quote } = req.body;
  const existing = await Testimonial.findOne({ name, quote }).lean();
  if (existing) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(409);
    throw new Error('Similar testimonial already exists');
  }
  next();
});

module.exports = {
  uploadTestimonialImage,
  handleUploadErrors,
  validateTestimonialData,
  validateTestimonialId,
  checkDuplicateTestimonial,
};