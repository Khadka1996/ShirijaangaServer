const mongoose = require('mongoose');

const CountrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  info: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,   
    required: true,  
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now, 
  },
  updatedAt: {
    type: Date,
    default: Date.now, 
  },
}, { timestamps: true });

// Use pre('validate') instead of pre('save') to run before validation
CountrySchema.pre('validate', function (next) {
  // Auto-generate slug from name
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  }
  
  // Auto-generate title if not provided
  if (this.name && !this.title) {
    this.title = `Study at ${this.name}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

CountrySchema.index({ name: 1 });
CountrySchema.index({ slug: 1 });
CountrySchema.index({ isActive: 1 });

const Country = mongoose.model('Country', CountrySchema);

module.exports = Country;