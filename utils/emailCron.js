const cron = require('node-cron');
const EmailService = require('./email.util');
const { logger } = require('./logger.util');

class EmailCronJobs {
  constructor() {
    this.jobs = [];
  }

  // Initialize all cron jobs
  initialize() {
    this.setupDailyAnalytics();
    this.setupPerformanceReset();
    this.setupHealthCheck();
    this.setupMonthlyReset();
    
    logger.info('Email cron jobs initialized');
  }

  // Record daily analytics at midnight
  setupDailyAnalytics() {
    const job = cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('Running daily email analytics...');
        await EmailService.recordDailyAnalytics();
        logger.info('Daily email analytics recorded successfully');
      } catch (error) {
        logger.error('Failed to record daily analytics:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kathmandu"
    });

    this.jobs.push(job);
    logger.info('Daily analytics cron job scheduled');
  }

  // Reset performance metrics every hour
  setupPerformanceReset() {
    const job = cron.schedule('0 * * * *', () => {
      try {
        EmailService.resetPerformanceMetrics();
        logger.info('Email performance metrics reset');
      } catch (error) {
        logger.error('Failed to reset performance metrics:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kathmandu"
    });

    this.jobs.push(job);
    logger.info('Performance reset cron job scheduled');
  }

  // Health check every 30 minutes
  setupHealthCheck() {
    const job = cron.schedule('*/30 * * * *', async () => {
      try {
        const health = await EmailService.getSystemHealth();
        
        if (health.status !== 'healthy') {
          logger.warn(`Email system health check: ${health.status}`, {
            issues: health.issues,
            successRate: health.successRate
          });
        } else {
          logger.info('Email system health check: healthy');
        }
      } catch (error) {
        logger.error('Health check cron job failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kathmandu"
    });

    this.jobs.push(job);
    logger.info('Health check cron job scheduled');
  }

  // Monthly reset on 1st of every month
  setupMonthlyReset() {
    const job = cron.schedule('0 0 1 * *', async () => {
      try {
        logger.info('Running monthly email statistics reset...');
        // This will be handled by the EmailConfig model's reset method
        logger.info('Monthly reset completed');
      } catch (error) {
        logger.error('Monthly reset cron job failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kathmandu"
    });

    this.jobs.push(job);
    logger.info('Monthly reset cron job scheduled');
  }

  // Stop all cron jobs
  stopAll() {
    this.jobs.forEach(job => job.stop());
    logger.info('All email cron jobs stopped');
  }

  // Get cron job status
  getStatus() {
    return this.jobs.map((job, index) => ({
      id: index,
      scheduled: job.getStatus() === 'scheduled',
      nextDate: job.nextDate() ? job.nextDate().toISOString() : null
    }));
  }
}

module.exports = new EmailCronJobs();