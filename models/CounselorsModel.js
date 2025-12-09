const mongoose = require('mongoose');
const { logger } = require('../utils/logger.util');

const counselorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Counselor name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  role: {
    type: String,
    required: [true, 'Counselor role is required'],
    trim: true,
    maxlength: [100, 'Role cannot exceed 100 characters']
  },
  expertise: {
    type: String,
    required: [true, 'Expertise field is required'],
    trim: true,
    maxlength: [100, 'Expertise cannot exceed 100 characters']
  },
  image: {
    type: String,
    required: [true, 'Image path is required']
  },
  bio: {
    type: String,
    required: [true, 'Bio is required'],
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  certifications: {
    type: [String],
    required: [true, 'At least one certification is required'],
    validate: {
      validator: function(certs) {
        return certs && certs.length > 0 && certs.every(cert => cert.trim().length > 0);
      },
      message: 'At least one valid certification is required'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
counselorSchema.index({ name: 1 });
counselorSchema.index({ expertise: 1 });
counselorSchema.index({ createdAt: -1 });



// Pre-save hook for logging
counselorSchema.pre('save', function(next) {
  logger.info(`Saving counselor: ${this.name}`);
  next();
});

const Counselor = mongoose.model('Counselor', counselorSchema);
module.exports = Counselor;