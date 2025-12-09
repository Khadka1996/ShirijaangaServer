const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require('../controllers/notificationController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

// Apply auth middleware to ALL notification routes
router.use(authMiddleware);
router.use(authorizeRoles('admin', 'moderator'));

// Get all notifications (Admin, Moderator only)
router.get('/', getNotifications);

// Mark notification as read (Admin, Moderator only)
router.patch('/:id/read', markAsRead);

// Mark all notifications as read (Admin, Moderator only)
router.patch('/read-all', markAllAsRead);

// Get unread count (Admin, Moderator only)
router.get('/unread-count', getUnreadCount);

module.exports = router;