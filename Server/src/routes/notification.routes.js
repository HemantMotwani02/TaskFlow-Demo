const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const notificationController = require('../controllers/notification.controller');

// GET /api/notifications - list my notifications
router.get('/', authenticateToken, asyncHandler(notificationController.getNotifications.bind(notificationController)));

// POST /api/notifications/mark-read - mark one or many as read
router.post('/mark-read', authenticateToken, asyncHandler(notificationController.markAsRead.bind(notificationController)));

// DELETE /api/notifications/:id - delete a notification
router.delete('/:id', authenticateToken, asyncHandler(notificationController.deleteNotification.bind(notificationController)));

// POST /api/notifications/test - send test notification
router.post('/test', authenticateToken, asyncHandler(notificationController.sendTestNotification.bind(notificationController)));

module.exports = router;
