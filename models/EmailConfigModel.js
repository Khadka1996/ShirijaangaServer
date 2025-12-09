const mongoose = require('mongoose');

const EmailConfigSchema = new mongoose.Schema({
  service: {
    type: String,
    default: 'gmail'
  },
  email: {
    type: String,
    required: true
  },
  appPassword: {
    type: String,
    required: true
  },
  fromName: {
    type: String,
    default: 'EduConnect Consultancy'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Daily Limits & Usage
  dailyLimit: {
    type: Number,
    default: 500
  },
  emailsSentToday: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  
  // Monthly Tracking
  monthlyEmailsSent: {
    type: Number,
    default: 0
  },
  currentMonth: {
    type: String, // Format: "2024-01"
    default: function() {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
  },
  
  // Performance Metrics
  totalEmailsSent: {
    type: Number,
    default: 0
  },
  totalEmailsFailed: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0 // Percentage
  },
  
  // Error Tracking
  errorCount: {
    type: Number,
    default: 0
  },
  lastErrorMessage: {
    type: String,
    default: ''
  },
  lastErrorAt: {
    type: Date
  },
  
  // Reliability Metrics
  consecutiveFailures: {
    type: Number,
    default: 0
  },
  lastSuccessfulSend: {
    type: Date
  },
  averageSendTime: {
    type: Number, // milliseconds
    default: 0
  },
  
  // Security & Monitoring
  lastUsedIP: {
    type: String
  },
  suspiciousActivityCount: {
    type: Number,
    default: 0
  },
  lastSuspiciousActivity: {
    type: Date
  },
  
  // Configuration Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Reset daily counter if it's a new day
EmailConfigSchema.methods.resetDailyCounterIfNeeded = function() {
  const today = new Date().toDateString();
  const lastReset = new Date(this.lastResetDate).toDateString();
  
  if (today !== lastReset) {
    this.emailsSentToday = 0;
    this.lastResetDate = new Date();
  }
  
  // Reset monthly counter if it's a new month
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  if (this.currentMonth !== currentMonth) {
    this.monthlyEmailsSent = 0;
    this.currentMonth = currentMonth;
  }
  
  return this.save();
};

// Update success rate
EmailConfigSchema.methods.updateSuccessRate = function() {
  const totalAttempts = this.totalEmailsSent + this.totalEmailsFailed;
  this.successRate = totalAttempts > 0 ? 
    Math.round((this.totalEmailsSent / totalAttempts) * 100) : 0;
  return this.save();
};

// Record successful send
EmailConfigSchema.methods.recordSuccessfulSend = function(sendTime) {
  this.totalEmailsSent++;
  this.emailsSentToday++;
  this.monthlyEmailsSent++;
  this.lastSuccessfulSend = new Date();
  this.consecutiveFailures = 0;
  
  // Update average send time
  if (sendTime) {
    const totalSends = this.totalEmailsSent + this.totalEmailsFailed;
    this.averageSendTime = Math.round(
      ((this.averageSendTime * (totalSends - 1)) + sendTime) / totalSends
    );
  }
  
  return this.updateSuccessRate();
};

// Record failed send
EmailConfigSchema.methods.recordFailedSend = function(errorMessage) {
  this.totalEmailsFailed++;
  this.errorCount++;
  this.consecutiveFailures++;
  this.lastErrorMessage = errorMessage;
  this.lastErrorAt = new Date();
  return this.updateSuccessRate();
};

// Record suspicious activity
EmailConfigSchema.methods.recordSuspiciousActivity = function(ipAddress) {
  this.suspiciousActivityCount++;
  this.lastSuspiciousActivity = new Date();
  this.lastUsedIP = ipAddress;
  return this.save();
};

module.exports = mongoose.model('EmailConfig', EmailConfigSchema);