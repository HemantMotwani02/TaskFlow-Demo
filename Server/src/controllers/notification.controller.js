const { Notification, User, Project, Task } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

/**
 * Notification Controller
 * Handles all notification-related business logic
 */
class NotificationController {
  /**
   * Get current user's notifications
   * @route GET /api/notifications
   */
  async getNotifications(req, res) {
    const { page = 1, limit = 20, unread, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = { recipient_id: req.user.user_id };
    if (unread === 'true') {
      where.read_at = null;
    }
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [
        { model: User, as: 'actor', attributes: ['user_id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['project_id', 'project_name'] },
        { model: Task, as: 'task', attributes: ['task_id', 'task_name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        notifications: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  }

  /**
   * Mark notifications as read
   * @route POST /api/notifications/mark-read
   */
  async markAsRead(req, res) {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array required' });
    }

    await Notification.update(
      { read_at: new Date() },
      { where: { notification_id: ids, recipient_id: req.user.user_id } }
    );

    res.json({ success: true, message: 'Notifications marked as read' });
  }

  /**
   * Delete notification
   * @route DELETE /api/notifications/:id
   */
  async deleteNotification(req, res) {
    const notif = await Notification.findByPk(req.params.id);
    if (!notif || notif.recipient_id !== req.user.user_id) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    await notif.destroy();
    res.json({ success: true, message: 'Notification deleted' });
  }

  /**
   * Send test notification
   * @route POST /api/notifications/test
   */
  async sendTestNotification(req, res) {
    const { title, message, type } = req.body;
    
    try {
      console.log(`🧪 Test notification request from user ${req.user.user_id}`);
      console.log('  - Title:', title || 'Test Notification');
      console.log('  - Message:', message || 'This is a test notification');
      console.log('  - Type:', type || 'info');
      
      await notificationService.sendNotificationToUser(req.user.user_id, {
        title: title || 'Test Notification',
        message: message || 'This is a test notification',
        type: type || 'info',
        metadata: { test: true }
      });
      
      console.log(`✅ Test notification sent successfully to user ${req.user.user_id}`);
      
      res.json({ 
        success: true, 
        message: 'Test notification sent successfully' 
      });
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test notification',
        error: error.message 
      });
    }
  }
}

module.exports = new NotificationController();

