const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { sessionAwareAuth, authorizeRoles } = require('../middlewares/authMiddleware');

// Apply session-aware auth middleware to all analytics routes
router.use(sessionAwareAuth);

// ========================
// ANALYTICS CONFIGURATION ROUTES
// ========================

// GET /api/analytics/config - Get all configurations (Admin only)
router.get('/config', authorizeRoles('admin'), analyticsController.getAnalyticsConfigs);

// GET /api/analytics/config/:id - Get single configuration (Admin only)
router.get('/config/:id', authorizeRoles('admin'), analyticsController.getAnalyticsConfig);

// POST /api/analytics/config - Create new configuration (Admin only)
router.post('/config', authorizeRoles('admin'), analyticsController.createAnalyticsConfig);

// PUT /api/analytics/config/:id - Update configuration (Admin only)
router.put('/config/:id', authorizeRoles('admin'), analyticsController.updateAnalyticsConfig);

// DELETE /api/analytics/config/:id - Delete configuration (Admin only)
router.delete('/config/:id', authorizeRoles('admin'), analyticsController.deleteAnalyticsConfig);

// ========================
// CONFIGURATION ACTIONS (Admin only)
// ========================

// POST /api/analytics/config/:id/test - Test configuration
router.post('/config/:id/test', authorizeRoles('admin'), analyticsController.testAnalyticsConfig);

// POST /api/analytics/config/:id/activate - Activate configuration
router.post('/config/:id/activate', authorizeRoles('admin'), analyticsController.activateAnalyticsConfig);

// ========================
// ANALYTICS DATA ROUTES (All authenticated users)
// ========================

// GET /api/analytics/data - Get analytics data
router.get('/data', analyticsController.getAnalyticsData);

// GET /api/analytics/status - Get analytics status
router.get('/status', analyticsController.getAnalyticsStatus);

module.exports = router;