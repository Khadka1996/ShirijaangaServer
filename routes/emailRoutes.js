const express = require('express');
const router = express.Router();
const emailConfigController = require('../controllers/EmailConfigController');
const promotionalEmailController = require('../controllers/PromotionalEmailController');
const emailAnalyticsController = require('../controllers/EmailAnalyticsController');
const { checkEmailConfig, checkEmailLimit } = require('../middlewares/emailMiddleware');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');
const EmailService = require('../utils/email.util');
const emailCron = require('../utils/emailCron');

/**
 * @swagger
 * tags:
 *   - name: Email
 *     description: Email management and analytics endpoints
 *   - name: Email Configuration
 *     description: Email service configuration management
 *   - name: Email Analytics
 *     description: Email performance and analytics endpoints
 *   - name: Email Cron Jobs
 *     description: Email cron job management endpoints
 */

// =============================================
// EMAIL CONFIGURATION ROUTES
// =============================================

/**
 * @swagger
 * /api/email/config:
 *   post:
 *     summary: Set email configuration (Admin only)
 *     tags: [Email Configuration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - appPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "your-email@gmail.com"
 *                 description: Gmail address for sending emails
 *               appPassword:
 *                 type: string
 *                 example: "abcd efgh ijkl mnop"
 *                 description: Gmail app password (16 characters)
 *               fromName:
 *                 type: string
 *                 example: "EduConnect Consultancy"
 *                 description: Display name for sent emails
 *               dailyLimit:
 *                 type: integer
 *                 example: 500
 *                 description: Daily email sending limit
 *     responses:
 *       200:
 *         description: Email configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email configuration updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     email:
 *                       type: string
 *                       example: "your-email@gmail.com"
 *                     fromName:
 *                       type: string
 *                       example: "EduConnect Consultancy"
 *                     dailyLimit:
 *                       type: integer
 *                       example: 500
 *       400:
 *         description: Validation error or missing required fields
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/config', 
  authMiddleware, 
  authorizeRoles('admin'), 
  emailConfigController.setEmailConfig
);

/**
 * @swagger
 * /api/email/config:
 *   get:
 *     summary: Get current email configuration (Admin/Moderator)
 *     tags: [Email Configuration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     email:
 *                       type: string
 *                       example: "your-email@gmail.com"
 *                     fromName:
 *                       type: string
 *                       example: "EduConnect Consultancy"
 *                     dailyLimit:
 *                       type: integer
 *                       example: 500
 *                     emailsSentToday:
 *                       type: integer
 *                       example: 45
 *                     lastResetDate:
 *                       type: string
 *                       format: date-time
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       404:
 *         description: No email configuration found
 *       500:
 *         description: Internal server error
 */
router.get('/config', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  emailConfigController.getEmailConfig
);

/**
 * @swagger
 * /api/email/config/test:
 *   post:
 *     summary: Test email configuration (Admin/Moderator)
 *     tags: [Email Configuration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testEmail
 *             properties:
 *               testEmail:
 *                 type: string
 *                 format: email
 *                 example: "test@example.com"
 *                 description: Email address to send test email to
 *     responses:
 *       200:
 *         description: Test email sent successfully
 *       400:
 *         description: Invalid test email or email configuration not set
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.post('/config/test', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  checkEmailConfig,
  emailConfigController.testEmailConfig
);

/**
 * @swagger
 * /api/email/config/stats:
 *   get:
 *     summary: Get email statistics (Admin/Moderator)
 *     tags: [Email Configuration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "your-email@gmail.com"
 *                     dailyLimit:
 *                       type: integer
 *                       example: 500
 *                     sentToday:
 *                       type: integer
 *                       example: 45
 *                     remainingToday:
 *                       type: integer
 *                       example: 455
 *                     monthlySent:
 *                       type: integer
 *                       example: 1245
 *                     totalSent:
 *                       type: integer
 *                       example: 12500
 *                     successRate:
 *                       type: number
 *                       format: float
 *                       example: 98.5
 *                     averageSendTime:
 *                       type: integer
 *                       example: 1200
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.get('/config/stats', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  checkEmailConfig,
  emailConfigController.getEmailStats
);

// =============================================
// PROMOTIONAL EMAIL ROUTES
// =============================================

/**
 * @swagger
 * /api/email/promotional/send:
 *   post:
 *     summary: Send promotional email to all students (Admin/Moderator)
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - buttonLink
 *               - contactEmail
 *               - contactPhone
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Free Study Abroad Consultation"
 *                 description: Email subject and title
 *               content:
 *                 type: string
 *                 example: "Get free consultation for studying in USA, Canada, Australia. Limited spots available!"
 *                 description: Email content body
 *               buttonText:
 *                 type: string
 *                 example: "Book Now"
 *                 description: Text for the call-to-action button
 *               buttonLink:
 *                 type: string
 *                 format: uri
 *                 example: "https://educonnect.com/consultation"
 *                 description: URL for the call-to-action button
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 example: "info@educonnect.com"
 *                 description: Contact email displayed in the email
 *               contactPhone:
 *                 type: string
 *                 example: "+977-1-1234567"
 *                 description: Contact phone number displayed in the email
 *     responses:
 *       200:
 *         description: Promotional email sending started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Started sending promotional email to 150 students"
 *                 data:
 *                   type: object
 *                   properties:
 *                     campaignId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439012"
 *                     totalStudents:
 *                       type: integer
 *                       example: 150
 *                     status:
 *                       type: string
 *                       example: "sending"
 *       400:
 *         description: Missing required fields or daily limit exceeded
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.post('/promotional/send', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  checkEmailConfig,
  checkEmailLimit,
  promotionalEmailController.sendPromotionalEmail
);

/**
 * @swagger
 * /api/email/promotional:
 *   get:
 *     summary: Get promotional email history (Admin/Moderator)
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of emails per page
 *     responses:
 *       200:
 *         description: Promotional emails retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439012"
 *                       title:
 *                         type: string
 *                         example: "Free Study Abroad Consultation"
 *                       sentCount:
 *                         type: integer
 *                         example: 150
 *                       failedCount:
 *                         type: integer
 *                         example: 5
 *                       successRate:
 *                         type: number
 *                         format: float
 *                         example: 96.7
 *                       status:
 *                         type: string
 *                         example: "completed"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.get('/promotional', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  promotionalEmailController.getPromotionalEmails
);

/**
 * @swagger
 * /api/email/promotional/{id}:
 *   get:
 *     summary: Get specific promotional email details (Admin/Moderator)
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Promotional email ID
 *     responses:
 *       200:
 *         description: Promotional email details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PromotionalEmail'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       404:
 *         description: Promotional email not found
 *       500:
 *         description: Internal server error
 */
router.get('/promotional/:id', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  promotionalEmailController.getPromotionalEmailById
);

// =============================================
// EMAIL ANALYTICS ROUTES
// =============================================

/**
 * @swagger
 * /api/email/analytics:
 *   get:
 *     summary: Get comprehensive email analytics (Admin/Moderator)
 *     tags: [Email Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Analytics period
 *     responses:
 *       200:
 *         description: Email analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                       example: "30 days"
 *                     systemHealth:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         issues:
 *                           type: array
 *                           items:
 *                             type: string
 *                     trends:
 *                       type: object
 *                       properties:
 *                         emailsSent:
 *                           type: object
 *                           properties:
 *                             current:
 *                               type: integer
 *                               example: 1500
 *                             trend:
 *                               type: integer
 *                               example: 150
 *                             trendPercentage:
 *                               type: number
 *                               format: float
 *                               example: 10.5
 *                     campaigns:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PromotionalEmail'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  emailAnalyticsController.getEmailAnalytics
);

/**
 * @swagger
 * /api/email/analytics/dashboard:
 *   get:
 *     summary: Get performance dashboard (Admin/Moderator)
 *     tags: [Email Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance dashboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentStats:
 *                       type: object
 *                     systemHealth:
 *                       type: object
 *                     recentCampaigns:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PromotionalEmail'
 *                     weeklyTrends:
 *                       type: array
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [info, warning, error]
 *                           message:
 *                             type: string
 *                           priority:
 *                             type: string
 *                             enum: [low, medium, high]
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.get('/analytics/dashboard', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  emailAnalyticsController.getPerformanceDashboard
);

/**
 * @swagger
 * /api/email/analytics/health:
 *   get:
 *     summary: Get system health status (Admin/Moderator)
 *     tags: [Email Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, critical]
 *                       example: "healthy"
 *                     issues:
 *                       type: array
 *                       items:
 *                         type: string
 *                     lastChecked:
 *                       type: string
 *                       format: date-time
 *                     successRate:
 *                       type: number
 *                       format: float
 *                       example: 98.5
 *                     consecutiveFailures:
 *                       type: integer
 *                       example: 0
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.get('/analytics/health', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  async (req, res) => {
    try {
      const health = await EmailService.getSystemHealth();
      res.status(200).json({
        success: true,
        data: health
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to get system health'
      });
    }
  }
);

/**
 * @swagger
 * /api/email/analytics/record-daily:
 *   post:
 *     summary: Manual trigger for daily analytics (Admin only - for testing)
 *     tags: [Email Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily analytics recorded manually
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Daily analytics recorded manually"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/analytics/record-daily', 
  authMiddleware, 
  authorizeRoles('admin'), 
  async (req, res) => {
    try {
      await EmailService.recordDailyAnalytics();
      
      res.status(200).json({
        success: true,
        message: 'Daily analytics recorded manually'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to record daily analytics'
      });
    }
  }
);

// =============================================
// CRON JOB MANAGEMENT ROUTES (ADMIN ONLY)
// =============================================

/**
 * @swagger
 * /api/email/cron/status:
 *   get:
 *     summary: Get cron job status (Admin only)
 *     tags: [Email Cron Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cron job status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 0
 *                       scheduled:
 *                         type: boolean
 *                         example: true
 *                       nextDate:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/cron/status', 
  authMiddleware, 
  authorizeRoles('admin'), 
  (req, res) => {
    try {
      const status = emailCron.getStatus();
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to get cron status'
      });
    }
  }
);

/**
 * @swagger
 * /api/email/cron/start:
 *   post:
 *     summary: Start all cron jobs (Admin only)
 *     tags: [Email Cron Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cron jobs started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email cron jobs started successfully"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/cron/start', 
  authMiddleware, 
  authorizeRoles('admin'), 
  (req, res) => {
    try {
      emailCron.initialize();
      res.status(200).json({
        success: true,
        message: 'Email cron jobs started successfully'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to start cron jobs'
      });
    }
  }
);

/**
 * @swagger
 * /api/email/cron/stop:
 *   post:
 *     summary: Stop all cron jobs (Admin only)
 *     tags: [Email Cron Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cron jobs stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email cron jobs stopped successfully"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/cron/stop', 
  authMiddleware, 
  authorizeRoles('admin'), 
  (req, res) => {
    try {
      emailCron.stopAll();
      res.status(200).json({
        success: true,
        message: 'Email cron jobs stopped successfully'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to stop cron jobs'
      });
    }
  }
);

// =============================================
// QUICK ACTIONS ROUTES
// =============================================

/**
 * @swagger
 * /api/email/quick-send:
 *   post:
 *     summary: Quick send promotional email (Admin/Moderator)
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - buttonLink
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Quick Promotion"
 *               content:
 *                 type: string
 *                 example: "Special offer for our students!"
 *               buttonLink:
 *                 type: string
 *                 format: uri
 *                 example: "https://educonnect.com/offer"
 *     responses:
 *       200:
 *         description: Quick promotional email sent successfully
 *       400:
 *         description: Missing required fields or daily limit exceeded
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.post('/quick-send', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  checkEmailConfig,
  checkEmailLimit,
  async (req, res) => {
    try {
      const { title, content, buttonLink } = req.body;
      
      // Default values for quick send
      const emailData = {
        title,
        content,
        buttonText: 'Learn More',
        buttonLink,
        contactEmail: process.env.CONTACT_EMAIL || 'info@educonnect.com',
        contactPhone: process.env.CONTACT_PHONE || '+977-1-1234567'
      };

      // Use the existing promotional email controller
      await promotionalEmailController.sendPromotionalEmail(
        { body: emailData },
        res
      );

    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to send quick promotional email'
      });
    }
  }
);

/**
 * @swagger
 * /api/email/limits:
 *   get:
 *     summary: Get current email limits and usage (Admin/Moderator)
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email limits retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     daily:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                           example: 500
 *                         used:
 *                           type: integer
 *                           example: 45
 *                         remaining:
 *                           type: integer
 *                           example: 455
 *                     monthly:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: integer
 *                           example: 1245
 *                         month:
 *                           type: string
 *                           example: "2024-01"
 *                     performance:
 *                       type: object
 *                       properties:
 *                         successRate:
 *                           type: number
 *                           format: float
 *                           example: 98.5
 *                         averageSendTime:
 *                           type: integer
 *                           example: 1200
 *                         status:
 *                           type: string
 *                           enum: [active, idle]
 *                           example: "active"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.get('/limits', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  checkEmailConfig,
  async (req, res) => {
    try {
      const stats = await EmailService.getEmailStats();
      
      res.status(200).json({
        success: true,
        data: {
          daily: {
            limit: stats.dailyLimit,
            used: stats.sentToday,
            remaining: stats.remainingToday
          },
          monthly: {
            used: stats.monthlySent,
            month: stats.currentMonth
          },
          performance: {
            successRate: stats.successRate,
            averageSendTime: stats.averageSendTime,
            status: stats.currentSession.totalSends > 0 ? 'active' : 'idle'
          }
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to get email limits'
      });
    }
  }
);

module.exports = router;