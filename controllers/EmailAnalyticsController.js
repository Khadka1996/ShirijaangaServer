const EmailAnalytics = require('../models/EmailAnalyticsModel');
const PromotionalEmail = require('../models/PromotionalEmailModel');
const EmailService = require('../utils/email.util');
const { logger } = require('../utils/logger.util');

// Get comprehensive email analytics
exports.getEmailAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y
    
    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get analytics data
    const analytics = await EmailAnalytics.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Get campaign statistics
    const campaigns = await PromotionalEmail.find({
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    // Calculate trends
    const trends = calculateTrends(analytics, campaigns);
    const systemHealth = await EmailService.getSystemHealth();

    res.status(200).json({
      success: true,
      data: {
        period: `${days} days`,
        dateRange: {
          start: startDate,
          end: new Date()
        },
        systemHealth,
        trends,
        campaigns: campaigns.slice(0, 10), // Last 10 campaigns
        summary: generateSummary(analytics, campaigns)
      }
    });

  } catch (err) {
    logger.error('Error getting email analytics:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get email analytics'
    });
  }
};

// Get performance dashboard
exports.getPerformanceDashboard = async (req, res) => {
  try {
    const [currentStats, health, recentCampaigns, trends] = await Promise.all([
      EmailService.getEmailStats(),
      EmailService.getSystemHealth(),
      PromotionalEmail.find().sort({ createdAt: -1 }).limit(5),
      EmailService.getPerformanceTrends(7)
    ]);

    res.status(200).json({
      success: true,
      data: {
        currentStats,
        systemHealth: health,
        recentCampaigns,
        weeklyTrends: trends,
        recommendations: generateRecommendations(currentStats, health)
      }
    });

  } catch (err) {
    logger.error('Error getting performance dashboard:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance dashboard'
    });
  }
};

// Helper functions
function calculateTrends(analytics, campaigns) {
  if (analytics.length === 0) return {};
  
  const first = analytics[0];
  const last = analytics[analytics.length - 1];
  
  return {
    emailsSent: {
      current: last.emailsSent,
      previous: first.emailsSent,
      trend: last.emailsSent - first.emailsSent,
      trendPercentage: ((last.emailsSent - first.emailsSent) / first.emailsSent * 100) || 0
    },
    successRate: {
      current: last.successRate,
      previous: first.successRate,
      trend: last.successRate - first.successRate
    },
    averageSendTime: {
      current: last.averageSendTime,
      previous: first.averageSendTime,
      trend: last.averageSendTime - first.averageSendTime
    }
  };
}

function generateSummary(analytics, campaigns) {
  const totalEmails = analytics.reduce((sum, day) => sum + day.emailsSent, 0);
  const totalCampaigns = campaigns.length;
  const averageCampaignSize = totalCampaigns > 0 ? Math.round(totalEmails / totalCampaigns) : 0;
  const averageSuccessRate = analytics.length > 0 ? 
    analytics.reduce((sum, day) => sum + day.successRate, 0) / analytics.length : 0;

  return {
    totalEmailsSent: totalEmails,
    totalCampaigns: totalCampaigns,
    averageCampaignSize: averageCampaignSize,
    averageSuccessRate: Math.round(averageSuccessRate),
    bestDay: analytics.length > 0 ? 
      analytics.reduce((best, day) => day.emailsSent > best.emailsSent ? day : best) : null,
    mostSuccessfulCampaign: campaigns.length > 0 ?
      campaigns.reduce((best, campaign) => campaign.successRate > best.successRate ? campaign : best) : null
  };
}

function generateRecommendations(stats, health) {
  const recommendations = [];

  if (stats.successRate < 90) {
    recommendations.push({
      type: 'warning',
      message: 'Email success rate is below 90%. Check your email configuration and SMTP settings.',
      priority: 'high'
    });
  }

  if (stats.remainingToday < 100) {
    recommendations.push({
      type: 'info',
      message: `Only ${stats.remainingToday} emails remaining today. Consider upgrading your email plan.`,
      priority: 'medium'
    });
  }

  if (stats.consecutiveFailures > 3) {
    recommendations.push({
      type: 'error',
      message: `High consecutive failures (${stats.consecutiveFailures}). Email service may be degraded.`,
      priority: 'high'
    });
  }

  if (stats.averageSendTime > 5000) {
    recommendations.push({
      type: 'warning',
      message: 'Slow email sending detected. Check your network connection and SMTP server.',
      priority: 'medium'
    });
  }

  return recommendations;
}