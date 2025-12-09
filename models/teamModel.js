const mongoose = require('mongoose');
const { logger } = require('../utils/logger.util');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
    maxlength: [100, 'Role cannot exceed 100 characters']
  },
  image: {
    type: String,
    required: [true, 'Image path is required'],
    trim: true
  },
  displayOrder: {
    type: Number,
    default: -1 // -1 means hidden, 0+ means visible with order
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for isActive (computed property)
teamSchema.virtual('isActive').get(function() {
  return this.displayOrder >= 0;
});

// Indexes
teamSchema.index({ name: 1 });
teamSchema.index({ role: 1 });
teamSchema.index({ displayOrder: 1 }); // Most important index

// Pre-save hook
teamSchema.pre('save', function(next) {
  logger.info(`Saving team member: ${this.name} (order: ${this.displayOrder})`);
  next();
});

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;