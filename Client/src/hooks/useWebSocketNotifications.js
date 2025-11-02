import { useState, useEffect, useCallback, useRef } from 'react';
import notificationWebSocket from '../utils/notificationWebSocket';
import { markNotificationsRead } from '../utils/notificationApi';
import { useAuthStore } from '../store';

/**
 * Custom hook for managing WebSocket-based real-time notifications
 */
export const useWebSocketNotifications = () => {
  console.log('🎯 useWebSocketNotifications hook called');
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    connecting: false,
    authenticated: false,
    reconnectAttempts: 0
  });
  const [error, setError] = useState(null);
  
  const isInitialized = useRef(false);
  const { isAuthenticated, user } = useAuthStore();
  
  console.log('🎯 Hook state:', { isAuthenticated, user: !!user, isInitialized: isInitialized.current });
  
  // Force re-render when WebSocket status changes
  useEffect(() => {
    if (isInitialized.current) {
      const currentStatus = notificationWebSocket.getStatus();
      console.log('🔄 Force status update:', currentStatus);
      setConnectionStatus(currentStatus);
    }
  }, [notificationWebSocket]);

  // Additional effect to sync status when WebSocket is already connected
  useEffect(() => {
    if (isInitialized.current) {
      const wsStatus = notificationWebSocket.getStatus();
      if (wsStatus.connected && !connectionStatus.connected) {
        console.log('🔧 WebSocket is connected but hook status is not, syncing...');
        setConnectionStatus(wsStatus);
      }
    }
  }, [connectionStatus.connected]);

  // Listen for manual status updates
  useEffect(() => {
    const handleStatusUpdate = (event) => {
      console.log('🔧 Received manual status update:', event.detail);
      setConnectionStatus(event.detail);
    };

    window.addEventListener('websocket-status-update', handleStatusUpdate);
    return () => window.removeEventListener('websocket-status-update', handleStatusUpdate);
  }, []);

  // Periodic check to ensure hook stays connected
  useEffect(() => {
    const checkConnection = () => {
      const wsStatus = notificationWebSocket.getStatus();
      console.log('🔄 Periodic connection check:', wsStatus);
      
      // If WebSocket is connected but hook is not initialized, reinitialize
      if (wsStatus.connected && wsStatus.authenticated && !isInitialized.current && isAuthenticated && user) {
        console.log('🔄 WebSocket is connected but hook not initialized, reinitializing...');
        isInitialized.current = false; // This will trigger the main useEffect
      }
    };

    const interval = setInterval(checkConnection, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Initialize WebSocket connection only when authenticated
  useEffect(() => {
    console.log('🔄 Hook useEffect triggered:', { isInitialized: isInitialized.current, isAuthenticated, user: !!user });
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - user:', user);
    console.log('  - isInitialized.current:', isInitialized.current);
    
    // Always check WebSocket status and reinitialize if needed
    const wsStatus = notificationWebSocket.getStatus();
    console.log('  - WebSocket status:', wsStatus);
    
    // If WebSocket is not connected or not authenticated, reset initialization
    if ((!wsStatus.connected || !wsStatus.authenticated) && isInitialized.current) {
      console.log('🔄 WebSocket not properly connected, resetting initialization');
      isInitialized.current = false;
    }
    
    if (!isInitialized.current && isAuthenticated && user) {
      isInitialized.current = true;
      
      console.log('🚀 User authenticated, attempting WebSocket connection...');
      console.log('  - User:', user);
      console.log('  - Token available:', !!localStorage.getItem('token'));
      console.log('  - Current status:', notificationWebSocket.getStatus());
      
      // Connect to WebSocket
      notificationWebSocket.connect();
      
      // Set up event listeners
      const handleNotification = (notification) => {
        console.log('🔔 Hook: New notification received:', notification);
        console.log('  - Notification ID:', notification.id);
        console.log('  - Title:', notification.title);
        console.log('  - Message:', notification.message);
        console.log('  - Created at:', notification.createdAt || notification.created_at);
        console.log('  - Read at:', notification.read_at);
        console.log('  - Current notifications count before update:', notifications.length);
        
        // Format the notification with proper time display
        const createdAt = notification.createdAt || notification.created_at;
        const date = new Date(createdAt);
        
        const formattedNotification = {
          ...notification,
          time: isNaN(date.getTime()) ? 'Just now' : date.toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isUnread: !notification.read_at
        };
        
        console.log('  - Formatted notification:', formattedNotification);
        
        setNotifications(prev => {
          console.log('  - Current notifications count:', prev.length);
          // Avoid duplicates
          const exists = prev.some(n => n.id === notification.id);
          if (exists) {
            console.log('  - Notification already exists, skipping');
            return prev;
          }
          
          console.log('  - Adding new notification to list');
          // Add new notification to the beginning
          const newList = [formattedNotification, ...prev].slice(0, 50); // Keep only last 50 notifications
          console.log('  - New notifications count:', newList.length);
          return newList;
        });
        
        // Update unread count
        if (!notification.read_at) {
          console.log('  - Updating unread count');
          setUnreadCount(prev => {
            const newCount = prev + 1;
            console.log('  - Unread count:', prev, '->', newCount);
            return newCount;
          });
        }
      };

      const handleNotificationCount = (count) => {
        console.log('Notification count update:', count);
        setUnreadCount(count);
      };

      const handleConnected = () => {
        console.log('🔗 Hook: WebSocket connected event received');
        console.log('  - Current status before update:', connectionStatus);
        setConnectionStatus(prev => {
          const newStatus = { ...prev, connected: true, connecting: false, authenticated: true };
          console.log('  - New status:', newStatus);
          return newStatus;
        });
        setError(null);
      };

      const handleDisconnected = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus(prev => ({ ...prev, connected: false, authenticated: false }));
      };

      const handleError = (error) => {
        console.error('WebSocket error:', error);
        setError(error);
      };

      const handleMaxReconnectAttempts = () => {
        console.warn('Max reconnection attempts reached');
        setError('Unable to connect to notification service. Please refresh the page.');
      };

      // removed development-only test handler

      // Add event listeners
      console.log('🔗 Setting up event listeners on notificationWebSocket instance:', notificationWebSocket);
      console.log('  - Instance ID:', notificationWebSocket.constructor.name);
      console.log('  - Has on method:', typeof notificationWebSocket.on === 'function');
      
      // Remove any existing listeners first to avoid duplicates
      notificationWebSocket.off('notification', handleNotification);
      notificationWebSocket.off('notificationCount', handleNotificationCount);
      notificationWebSocket.off('connected', handleConnected);
      notificationWebSocket.off('disconnected', handleDisconnected);
      notificationWebSocket.off('error', handleError);
      notificationWebSocket.off('maxReconnectAttemptsReached', handleMaxReconnectAttempts);
  // removed development-only test cleanup
      
  notificationWebSocket.on('notification', handleNotification);
      notificationWebSocket.on('notificationCount', handleNotificationCount);
      notificationWebSocket.on('connected', handleConnected);
      notificationWebSocket.on('disconnected', handleDisconnected);
      notificationWebSocket.on('error', handleError);
      notificationWebSocket.on('maxReconnectAttemptsReached', handleMaxReconnectAttempts);
      
      
      console.log('✅ Event listeners set up successfully');

      // Update connection status immediately and then periodically
      const initialStatus = notificationWebSocket.getStatus();
      console.log('🔍 Initial WebSocket status:', initialStatus);
      
      // Force update the connection status immediately
      setConnectionStatus(prev => {
        console.log('🔄 Updating connection status from:', prev, 'to:', initialStatus);
        return initialStatus;
      });
      
      // If already connected, trigger the connected event
      if (initialStatus.connected) {
        console.log('🔗 WebSocket already connected, triggering connected event');
        handleConnected();
      }
      
      const statusInterval = setInterval(() => {
        const currentStatus = notificationWebSocket.getStatus();
        console.log('🔄 Status update:', currentStatus);
        setConnectionStatus(currentStatus);
      }, 1000);

      // Cleanup function
      return () => {
        clearInterval(statusInterval);
        notificationWebSocket.off('notification', handleNotification);
        notificationWebSocket.off('notificationCount', handleNotificationCount);
        notificationWebSocket.off('connected', handleConnected);
        notificationWebSocket.off('disconnected', handleDisconnected);
        notificationWebSocket.off('error', handleError);
        notificationWebSocket.off('maxReconnectAttemptsReached', handleMaxReconnectAttempts);
      };
    }
  }, [isAuthenticated, user]);

  // Disconnect WebSocket when user logs out
  useEffect(() => {
    if (!isAuthenticated && isInitialized.current) {
      console.log('🚪 User logged out, disconnecting WebSocket...');
      notificationWebSocket.disconnect();
      isInitialized.current = false;
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Send to server via REST API (wrap id in array)
    markNotificationsRead([notificationId]).catch(e => console.warn('Failed to mark read via API', e));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ 
        ...notification, 
        read_at: notification.read_at || new Date().toISOString() 
      }))
    );
    
    setUnreadCount(0);
    
    // Send to server via REST API for bulk mark-read
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id || n.notification_id).filter(Boolean);
    if (unreadIds.length > 0) {
      markNotificationsRead(unreadIds).catch(e => console.warn('Failed to mark all read via API', e));
    }
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const wasUnread = notification && !notification.read_at;
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Reconnect manually
  const reconnect = useCallback(() => {
    notificationWebSocket.disconnect();
    setTimeout(() => {
      notificationWebSocket.connect();
    }, 1000);
  }, []);

  return {
    notifications,
    unreadCount,
    connectionStatus,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    reconnect
  };
};

export default useWebSocketNotifications;
