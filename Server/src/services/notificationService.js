/**
 * Notification service for sending real-time notifications
 * This service integrates with the WebSocket server to push notifications
 */

const NotificationWebSocketServer = require('../websocket/notificationWebSocket');
const { Notification } = require('../models');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.wsServer = null;
  }

  // Set the WebSocket server instance
  setWebSocketServer(wsServer) {
    this.wsServer = wsServer;
  }

  /**
   * Send notification to a specific user
   * @param {number} userId - Target user ID
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {string} notificationData.type - Notification type (info, success, warning, error)
   * @param {Object} notificationData.metadata - Additional metadata
   */
  async sendNotificationToUser(userId, notificationData) {
    try {
      console.log(`📝 Creating notification for user ${userId}:`, notificationData);
      
      // Save notification to database
      // Use current time in IST timezone
      const now = new Date();
      console.log('🕐 Current server time:', now.toISOString());
      console.log('🕐 Current server time (IST):', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      
      const notification = await Notification.create({
        recipient_id: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        read_at: null
        // Let Sequelize handle timestamps automatically with timezone
      });

      console.log(`✅ Notification created in database:`, notification.toJSON());

      // Send real-time notification via WebSocket
      if (this.wsServer) {
        // Format the date properly for the client
        const createdAt = notification.createdAt || notification.created_at;
        const createdAtIso = new Date(createdAt).toISOString();
        const formattedDateLocal = new Date(createdAt).toLocaleString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        const wsNotification = {
          id: notification.notification_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          // include ISO for reliable parsing on client and a localized display string
          createdAt: createdAtIso,
          createdAtLocal: formattedDateLocal,
          read_at: notification.read_at,
          metadata: notification.metadata
        };
        
        console.log(`📡 Sending via WebSocket:`, wsNotification);
        this.wsServer.sendNotificationToUser(userId, wsNotification);
      } else {
        console.log(`❌ No WebSocket server available`);
      }

      logger.info(`Notification sent to user ${userId}: ${notification.title}`);
      return notification;

    } catch (error) {
      logger.error('Error sending notification to user:', error);
      console.error('❌ Error in sendNotificationToUser:', error);
      throw error;
    }
  }

  /**
   * Push an already-created notification record to a user over WebSocket
   * @param {number} userId
   * @param {Object} notificationObj - database notification row or plain object
   */
  pushExistingNotification(userId, notificationObj) {
    try {
      if (!this.wsServer) {
        console.log('❌ pushExistingNotification: No WebSocket server available');
        return;
      }

      const createdAtRaw = notificationObj.createdAt || notificationObj.created_at || new Date();
      const createdAtIso = (new Date(createdAtRaw)).toISOString();
      const createdAtLocal = (new Date(createdAtRaw)).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const wsNotification = {
        id: notificationObj.notification_id || notificationObj.id,
        title: notificationObj.title,
        message: notificationObj.message,
        type: notificationObj.type || 'info',
        createdAt: createdAtIso,
        createdAtLocal: createdAtLocal,
        read_at: notificationObj.read_at || null,
        metadata: notificationObj.metadata || null
      };

      console.log(`📡 pushExistingNotification: sending to user ${userId}`, wsNotification);
      this.wsServer.sendNotificationToUser(userId, wsNotification);
    } catch (error) {
      console.error('Error in pushExistingNotification:', error);
    }
  }

  /**
   * Send notification to multiple users
   * @param {number[]} userIds - Array of target user IDs
   * @param {Object} notificationData - Notification data
   */
  async sendNotificationToUsers(userIds, notificationData) {
    const promises = userIds.map(userId => 
      this.sendNotificationToUser(userId, notificationData)
    );
    
    try {
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      logger.info(`Bulk notification sent: ${successful} successful, ${failed} failed`);
      return { successful, failed, results };
    } catch (error) {
      logger.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Send system-wide notification to all connected users
   * @param {Object} notificationData - Notification data
   */
  async sendSystemNotification(notificationData) {
    try {
      // For system notifications, we might want to store them differently
      // or not store them at all depending on requirements
      
      if (this.wsServer) {
        this.wsServer.broadcastNotification({
          id: `system_${Date.now()}`,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'info',
          createdAt: new Date().toISOString(),
          read_at: null,
          metadata: { ...notificationData.metadata, system: true }
        });
      }

      logger.info(`System notification broadcasted: ${notificationData.title}`);
      return true;

    } catch (error) {
      logger.error('Error sending system notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {number} userId - User ID
   * @param {number} notificationId - Notification ID
   */
  async markAsRead(userId, notificationId) {
    try {
      await Notification.update(
        { read_at: new Date() },
        { 
          where: { 
            notification_id: notificationId,
            recipient_id: userId 
          } 
        }
      );

      // Send updated count via WebSocket
      if (this.wsServer) {
        this.wsServer.sendNotificationCount(userId);
      }

      logger.info(`Notification ${notificationId} marked as read for user ${userId}`);
      return true;

    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   */
  async markAllAsRead(userId) {
    try {
      await Notification.update(
        { read_at: new Date() },
        { 
          where: { 
            recipient_id: userId,
            read_at: null 
          } 
        }
      );

      // Send updated count via WebSocket
      if (this.wsServer) {
        this.wsServer.sendNotificationCount(userId);
      }

      logger.info(`All notifications marked as read for user ${userId}`);
      return true;

    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {number} userId - User ID
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: {
          recipient_id: userId,
          read_at: null
        }
      });

      return count;

    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with pagination
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.type - Filter by type
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 10, type } = options;
      const offset = (page - 1) * limit;

      const whereClause = { recipient_id: userId };
      if (type) {
        whereClause.type = type;
      }

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        notifications,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
