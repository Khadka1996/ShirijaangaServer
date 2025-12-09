const nodemailer = require('nodemailer');
const EmailConfig = require('../models/EmailConfigModel');
const EmailAnalytics = require('../models/EmailAnalyticsModel');
const { logger } = require('./logger.util');

class EmailService {
  constructor() {
    this.transporter = null;
    this.currentConfig = null;
    this.performanceMetrics = {
      sendTimes: [],
      errorCount: 0,
      successCount: 0
    };
  }

  // Initialize or update email transporter
  async initializeTransporter(ipAddress = 'unknown') {
    try {
      const config = await EmailConfig.findOne({ isActive: true });
      if (!config) {
        throw new Error('No active email configuration found');
      }

      await config.resetDailyCounterIfNeeded();

      // Check for suspicious activity
      if (ipAddress && config.lastUsedIP && config.lastUsedIP !== ipAddress) {
        await config.recordSuspiciousActivity(ipAddress);
        logger.warn(`Suspicious IP change detected: ${config.lastUsedIP} -> ${ipAddress}`);
      } else {
        config.lastUsedIP = ipAddress;
        await config.save();
      }

      // Check daily limit
      if (config.emailsSentToday >= config.dailyLimit) {
        throw new Error(`Daily email limit reached (${config.dailyLimit})`);
      }

      this.transporter = nodemailer.createTransport({
        service: config.service,
        auth: {
          user: config.email,
          pass: config.appPassword
        },
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 100
      });

      this.currentConfig = config;
      logger.info(`Email transporter initialized for: ${config.email}`);
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  // Send single email with performance tracking
  async sendEmail(to, subject, html, ipAddress = 'unknown') {
    const startTime = Date.now();
    
    if (!this.transporter) {
      await this.initializeTransporter(ipAddress);
    }

    try {
      const result = await this.transporter.sendMail({
        from: `"${this.currentConfig.fromName}" <${this.currentConfig.email}>`,
        to: to,
        subject: subject,
        html: html
      });

      const sendTime = Date.now() - startTime;
      
      // Update performance metrics
      this.performanceMetrics.sendTimes.push(sendTime);
      this.performanceMetrics.successCount++;
      
      // Update config statistics
      await this.currentConfig.recordSuccessfulSend(sendTime);

      logger.info(`✅ Email sent to: ${to} (${sendTime}ms)`);
      return { 
        success: true, 
        messageId: result.messageId,
        sendTime: sendTime
      };
      
    } catch (error) {
      const sendTime = Date.now() - startTime;
      
      // Update performance metrics
      this.performanceMetrics.errorCount++;
      
      // Update config statistics
      await this.currentConfig.recordFailedSend(error.message);

      logger.error(`❌ Failed to send email to ${to}:`, error.message);
      return { 
        success: false, 
        error: error.message,
        sendTime: sendTime
      };
    }
  }

  // Get comprehensive email statistics
  async getEmailStats() {
    if (!this.currentConfig) {
      await this.initializeTransporter();
    }

    const stats = {
      // Basic Info
      email: this.currentConfig.email,
      fromName: this.currentConfig.fromName,
      isActive: this.currentConfig.isActive,
      
      // Daily Usage
      dailyLimit: this.currentConfig.dailyLimit,
      sentToday: this.currentConfig.emailsSentToday,
      remainingToday: this.currentConfig.dailyLimit - this.currentConfig.emailsSentToday,
      lastReset: this.currentConfig.lastResetDate,
      
      // Monthly Usage
      monthlySent: this.currentConfig.monthlyEmailsSent,
      currentMonth: this.currentConfig.currentMonth,
      
      // Lifetime Statistics
      totalSent: this.currentConfig.totalEmailsSent,
      totalFailed: this.currentConfig.totalEmailsFailed,
      successRate: this.currentConfig.successRate,
      
      // Performance Metrics
      averageSendTime: this.currentConfig.averageSendTime,
      consecutiveFailures: this.currentConfig.consecutiveFailures,
      lastSuccessfulSend: this.currentConfig.lastSuccessfulSend,
      lastError: this.currentConfig.lastErrorMessage,
      lastErrorAt: this.currentConfig.lastErrorAt,
      
      // Reliability & Security
      errorCount: this.currentConfig.errorCount,
      suspiciousActivityCount: this.currentConfig.suspiciousActivityCount,
      lastSuspiciousActivity: this.currentConfig.lastSuspiciousActivity,
      lastUsedIP: this.currentConfig.lastUsedIP,
      
      // Current Session Performance
      currentSession: {
        totalSends: this.performanceMetrics.successCount + this.performanceMetrics.errorCount,
        successCount: this.performanceMetrics.successCount,
        errorCount: this.performanceMetrics.errorCount,
        averageSendTime: this.performanceMetrics.sendTimes.length > 0 ?
          Math.round(this.performanceMetrics.sendTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.sendTimes.length) : 0
      }
    };

    return stats;
  }

  // Get performance trends
  async getPerformanceTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await EmailAnalytics.find({
      date: { $gte: startDate },
      period: 'daily'
    }).sort({ date: 1 });

    return analytics;
  }

  // Record daily analytics
  async recordDailyAnalytics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = await this.getEmailStats();
      
      const sendingPattern = new Map();
      const currentHour = today.getHours();
      sendingPattern.set(currentHour, stats.sentToday);

      await EmailAnalytics.findOneAndUpdate(
        { date: today, period: 'daily' },
        {
          date: today,
          period: 'daily',
          emailsSent: stats.sentToday,
          emailsFailed: stats.currentSession.errorCount,
          successRate: stats.successRate,
          averageSendTime: stats.averageSendTime,
          peakSendingHour: currentHour,
          sendingPattern: sendingPattern,
          campaignsRun: 1, // This would need to be calculated from campaigns
          consecutiveFailures: stats.consecutiveFailures,
          systemUptime: stats.consecutiveFailures > 10 ? 90 : 100 // Simplified
        },
        { upsert: true, new: true }
      );

      logger.info('Daily email analytics recorded');
    } catch (error) {
      logger.error('Failed to record daily analytics:', error);
    }
  }

  // Get system health status
  async getSystemHealth() {
    const stats = await this.getEmailStats();
    
    let status = 'healthy';
    let issues = [];

    if (stats.consecutiveFailures > 5) {
      status = 'degraded';
      issues.push(`High consecutive failures: ${stats.consecutiveFailures}`);
    }

    if (stats.successRate < 80) {
      status = 'degraded';
      issues.push(`Low success rate: ${stats.successRate}%`);
    }

    if (stats.remainingToday < 50) {
      issues.push(`Low daily quota remaining: ${stats.remainingToday}`);
    }

    if (stats.suspiciousActivityCount > 0) {
      issues.push(`Suspicious activity detected: ${stats.suspiciousActivityCount} incidents`);
    }

    return {
      status,
      issues,
      lastChecked: new Date(),
      ...stats
    };
  }

  // Reset performance metrics (for new session)
  resetPerformanceMetrics() {
    this.performanceMetrics = {
      sendTimes: [],
      errorCount: 0,
      successCount: 0
    };
  }
}

module.exports = new EmailService();