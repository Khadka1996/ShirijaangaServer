const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  websiteLink: { 
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  imagePath: { 
    type: String, 
    required: true 
  },
  position: {
    type: String,
    enum: [
      "top_banner",
      "sidebar_top",
      "sidebar_bottom",
      "footer",
      "popup_ad",
      "homepage_top",
      "homepage_bottom",
      "article_sidebar",
      "article_footer",
      "mobile_popup",
    ],
    required: true,
    index: true
  },
  // Stats tracking
  stats: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    lastDisplayed: { type: Date }
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true 
  },
  uploadDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for performance
advertisementSchema.index({ position: 1, isActive: 1 });

// Method to record impression
advertisementSchema.methods.recordImpression = function() {
  this.stats.impressions += 1;
  this.stats.lastDisplayed = new Date();
  return this.save();
};

// Method to record click
advertisementSchema.methods.recordClick = function() {
  this.stats.clicks += 1;
  return this.save();
};

// Virtual for CTR (Click-Through Rate)
advertisementSchema.virtual('ctr').get(function() {
  return this.stats.impressions > 0 
    ? (this.stats.clicks / this.stats.impressions) * 100 
    : 0;
});

// Pre-save middleware
advertisementSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model("Advertisement", advertisementSchema);