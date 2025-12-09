const mongoose = require('mongoose');

const PromotionalEmailSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    default: 'Book Now'
  },
  buttonLink: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  sentCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['sending', 'completed', 'failed'],
    default: 'sending'
  },
  configUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailConfig',
    required: true
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('PromotionalEmail', PromotionalEmailSchema);