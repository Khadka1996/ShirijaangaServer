const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    match: [/^[a-zA-Z\s]+$/, 'Name should only contain letters and spaces'],
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    index: true,
  },
  quote: {
    type: String,
    required: [true, 'Testimonial quote is required'],
    trim: true,
    minlength: [20, 'Quote must be at least 20 characters'],
    maxlength: [500, 'Quote cannot exceed 500 characters'],
  },
  image: {
    type: String,
    required: [true, 'Image is required'], 
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

testimonialSchema.index({ name: 'text', quote: 'text' });

module.exports = mongoose.model('Testimonial', testimonialSchema);