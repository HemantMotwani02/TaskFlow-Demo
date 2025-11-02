/**
 * WebSocket server for real-time notifications
 * This is a basic implementation - in production, consider using Socket.IO or similar
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class NotificationWebSocketServer {
  constructor(server) {
    console.log('🔧 Initializing WebSocket server...');
    console.log('  - Server:', !!server);
    console.log('  - Server listening:', server.listening);
    
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/notifications'
    });
    this.clients = new Map(); // userId -> Set of WebSocket connections
    
    console.log('✅ WebSocket server created');
    console.log('  - Path: /ws/notifications');
    console.log('  - Ready state:', this.wss.readyState);
    
    // Add error handling for WebSocket server
    this.wss.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
    });
    
    this.setupWebSocket();
    console.log('🔌 WebSocket server setup complete');
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection attempt');
      console.log('  - URL:', req.url);
      console.log('  - Headers:', req.headers);
      
      // Extract token from query parameters
      const host = req.headers.host || 'localhost:7007';
      const url = new URL(req.url, `http://${host}`);
      const token = url.searchParams.get('token');
      
      console.log('  - Token provided:', !!token);
      console.log('  - Token length:', token ? token.length : 0);
      
      if (!token) {
        console.log('❌ No token provided, closing connection');
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
        // Always store userId keys as strings to ensure consistent lookups
        const userId = String(decoded.userId);
        
        console.log(`✅ WebSocket authenticated for user: ${userId}`);
        console.log('  - Decoded token:', decoded);
        console.log('  - User role:', decoded.role);
        console.log('  - Token expiry:', new Date(decoded.exp * 1000).toISOString());
        
        // Store client connection
        if (!this.clients.has(userId)) {
          this.clients.set(userId, new Set());
          console.log(`  - 🆕 New user ${userId} added to clients map`);
        }
        this.clients.get(userId).add(ws);
        console.log(`  - Total clients for user ${userId}:`, this.clients.get(userId).size);
        console.log(`  - 📊 Total connected users: ${this.clients.size}`);
        
        // Set up message handlers
        ws.on('message', (message) => {
          this.handleMessage(ws, userId, message);
        });
        
        ws.on('close', (code, reason) => {
          console.log(`❌ WebSocket disconnected for user: ${userId}`);
          console.log(`  - Close code: ${code}`);
          console.log(`  - Reason: ${reason || 'None'}`);
          this.removeClient(userId, ws);
        });
        
        ws.on('error', (error) => {
          console.error(`WebSocket error for user ${userId}:`, error);
          this.removeClient(userId, ws);
        });
        
        // Send initial connection confirmation
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'Connected to real-time notifications'
        }));
        
        // Send current unread count
        this.sendNotificationCount(userId);
        
        // Send recent unread notifications
        this.sendRecentNotifications(userId);
        
      } catch (error) {
        console.log('❌ Invalid token, closing connection');
        console.log('  - Error:', error.message);
        console.log('  - Error name:', error.name);
        console.log('  - Token preview:', token ? token.substring(0, 50) + '...' : 'null');
        if (error.name === 'TokenExpiredError') {
          console.log('  - ⏰ Token expired at:', new Date(error.expiredAt).toISOString());
        }
        if (error.name === 'JsonWebTokenError') {
          console.log('  - ⚠️ JWT verification failed - possible secret mismatch');
        }
        ws.close(1008, `Invalid authentication token: ${error.message}`);
      }
    });
  }

  async handleMessage(ws, userId, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'ping':
          // Respond to heartbeat
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
          
        case 'mark_read':
          // Handle marking notification as read
          await this.markNotificationAsRead(userId, data.notificationId);
          break;
          
        case 'mark_all_read':
          // Handle marking all notifications as read
          await this.markAllNotificationsAsRead(userId);
          break;
          
        case 'meeting_signal':
          // Relay WebRTC signaling to intended recipients within the same meeting
          try {
            const { meetingId, fromUserId, recipients, signal, signalType } = data.payload || {};
            if (!recipients || !Array.isArray(recipients)) break;
            
            console.log(`📡 Meeting signal from ${fromUserId} to ${recipients.join(', ')}: ${signal.type}`);
            
            recipients.forEach((rid) => {
              const targetId = String(rid);
              if (this.clients.has(targetId)) {
                this.clients.get(targetId).forEach(clientWs => {
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({
                      type: 'meeting_signal',
                      payload: { 
                        meetingId, 
                        fromUserId, 
                        signal,
                        signalType: signalType || 'broadcast'
                      }
                    }));
                  }
                });
              } else {
                console.log(`⚠️  Target user ${targetId} not connected for meeting signal`);
                console.log(`  - Signal type: ${signal.type}`);
                console.log(`  - From user: ${fromUserId}`);
                console.log(`  - Connected users:`, Array.from(this.clients.keys()));
              }
            });
          } catch (e) {
            console.error('Failed relaying meeting_signal:', e);
          }
          break;

        default:
          console.warn(`Unknown message type from user ${userId}:`, data.type);
      }
    } catch (error) {
      console.error(`Error handling message from user ${userId}:`, error);
    }
  }

  removeClient(userId, ws) {
    const key = String(userId);
    if (this.clients.has(key)) {
      this.clients.get(key).delete(ws);
      if (this.clients.get(key).size === 0) {
        this.clients.delete(key);
      }
    }
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    console.log(`📤 Sending notification to user ${userId}:`, notification);
    console.log(`  - Clients for user ${userId}:`, this.clients.has(userId) ? this.clients.get(userId).size : 0);
    
    const key = String(userId);
    if (this.clients.has(key)) {
      // Format notification with proper date handling
      const formattedNotification = {
        ...notification,
        createdAt: notification.createdAt || new Date().toISOString()
      };

      const message = JSON.stringify({
        type: 'notification',
        payload: formattedNotification
      });
      
      console.log(`  - Message to send:`, message);
      
      this.clients.get(key).forEach((ws) => {
        console.log(`  - WebSocket ready state:`, ws.readyState);
        if (ws.readyState === WebSocket.OPEN) {
          console.log(`  - Sending to WebSocket`);
          ws.send(message);
        } else {
          console.log(`  - WebSocket not open, skipping`);
        }
      });
    } else {
      console.log(`  - No clients found for user ${key}`);
    }
  }

  // Send notification count update to user
  async sendNotificationCount(userId) {
    try {
      // Fetch actual unread count from database
      const notificationService = require('../services/notificationService');
      const unreadCount = await notificationService.getUnreadCount(userId);
      
      const key = String(userId);
      if (this.clients.has(key)) {
        const message = JSON.stringify({
          type: 'notification_count',
          payload: unreadCount
        });
        
        this.clients.get(key).forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    } catch (error) {
      console.error('Error sending notification count:', error);
      // Fallback to 0 if database error
      const key = String(userId);
      if (this.clients.has(key)) {
        const message = JSON.stringify({
          type: 'notification_count',
          payload: 0
        });
        
        this.clients.get(key).forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    }
  }

  // Mark notification as read
  async markNotificationAsRead(userId, notificationId) {
    try {
      console.log(`Marking notification ${notificationId} as read for user ${userId}`);
      const notificationService = require('../services/notificationService');
      await notificationService.markAsRead(userId, notificationId);
      
      // Send updated count
      await this.sendNotificationCount(userId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId) {
    try {
      console.log(`Marking all notifications as read for user ${userId}`);
      const notificationService = require('../services/notificationService');
      await notificationService.markAllAsRead(userId);
      
      // Send updated count
      await this.sendNotificationCount(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Send recent unread notifications to user
  async sendRecentNotifications(userId) {
    try {
      const notificationService = require('../services/notificationService');
      const { notifications } = await notificationService.getUserNotifications(userId, {
        page: 1,
        limit: 10
      });

      // Send each unread notification
      notifications.forEach(notification => {
        if (!notification.read_at) {
          this.sendNotificationToUser(userId, {
            id: notification.notification_id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            createdAt: notification.createdAt || new Date().toISOString(),
            read_at: notification.read_at,
            metadata: notification.metadata
          });
        }
      });
    } catch (error) {
      console.error('Error sending recent notifications:', error);
    }
  }

  // Broadcast notification to all connected users (for system-wide notifications)
  broadcastNotification(notification) {
    const message = JSON.stringify({
      type: 'notification',
      payload: notification
    });
    
    this.clients.forEach((userClients, userId) => {
      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    });
  }

  // Get connection statistics
  getStats() {
    const totalConnections = Array.from(this.clients.values())
      .reduce((sum, userClients) => sum + userClients.size, 0);
    
    return {
      totalUsers: this.clients.size,
      totalConnections: totalConnections
    };
  }
}

module.exports = NotificationWebSocketServer;
