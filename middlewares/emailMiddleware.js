const EmailService = require('../utils/email.util');
const { logger } = require('../utils/logger.util');

// Middleware to check if email service is configured
const checkEmailConfig = async (req, res, next) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    await EmailService.initializeTransporter(clientIP);
    next();
  } catch (error) {
    logger.error('Email configuration check failed:', error);
    return res.status(400).json({
      success: false,
      message: 'Email service not configured. Please set up email configuration first.'
    });
  }
};

// Middleware to check daily email limit
const checkEmailLimit = async (req, res, next) => {
  try {
    const stats = await EmailService.getEmailStats();
    
    if (stats.remainingToday <= 0) {
      return res.status(400).json({
        success: false,
        message: `Daily email limit reached (${stats.dailyLimit}). Please try again tomorrow.`
      });
    }
    
    req.emailStats = stats;
    next();
  } catch (error) {
    logger.error('Email limit check failed:', error);
    return res.status(400).json({
      success: false,
      message: 'Unable to check email limits'
    });
  }
};

// Middleware to validate promotional email data
const validatePromotionalEmail = (req, res, next) => {
  const { title, content, buttonLink, contactEmail, contactPhone } = req.body;

  const errors = [];

  if (!title || title.trim().length < 5) {
    errors.push('Title is required and must be at least 5 characters long');
  }

  if (!content || content.trim().length < 10) {
    errors.push('Content is required and must be at least 10 characters long');
  }

  if (!buttonLink || !isValidUrl(buttonLink)) {
    errors.push('Valid button link is required');
  }

  if (!contactEmail || !isValidEmail(contactEmail)) {
    errors.push('Valid contact email is required');
  }

  if (!contactPhone || contactPhone.trim().length < 5) {
    errors.push('Contact phone is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

// Helper functions
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  checkEmailConfig,
  checkEmailLimit,
  validatePromotionalEmail
};