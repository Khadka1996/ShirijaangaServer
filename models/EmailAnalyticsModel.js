const mongoose = require('mongoose');

const EmailAnalyticsSchema = new mongoose.Schema({
  // Date tracking
  date: {
    type: Date,
    required: true,
    index: true
  },
  period: {
    type: String, // 'daily', 'weekly', 'monthly'
    required: true
  },
  
  // Volume Metrics
  emailsSent: {
    type: Number,
    default: 0
  },
  emailsFailed: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  },
  
  // Performance Metrics
  averageSendTime: {
    type: Number,
    default: 0
  },
  peakSendingHour: {
    type: Number // 0-23
  },
  sendingPattern: {
    type: Map,
    of: Number // Hour -> Count
  },
  
  // Campaign Performance
  campaignsRun: {
    type: Number,
    default: 0
  },
  averageCampaignSize: {
    type: Number,
    default: 0
  },
  largestCampaign: {
    type: Number,
    default: 0
  },
  
  // Reliability Metrics
  consecutiveFailures: {
    type: Number,
    default: 0
  },
  maxConsecutiveFailures: {
    type: Number,
    default: 0
  },
  downtimeMinutes: {
    type: Number,
    default: 0
  },
  
  // Error Analysis
  commonErrors: [{
    error: String,
    count: Number,
    percentage: Number
  }],
  
  // Recipient Engagement (if tracking available)
  estimatedOpens: {
    type: Number,
    default: 0
  },
  estimatedClicks: {
    type: Number,
    default: 0
  },
  
  // System Performance
  systemUptime: {
    type: Number, // Percentage
    default: 100
  },
  apiCalls: {
    type: Number,
    default: 0
  },
  apiErrors: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
EmailAnalyticsSchema.index({ date: 1, period: 1 });

module.exports = mongoose.model('EmailAnalytics', EmailAnalyticsSchema);