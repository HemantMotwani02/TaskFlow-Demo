import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store';
import notificationWebSocket from '../utils/notificationWebSocket';
import { markNotificationsRead, fetchMyNotifications } from '../utils/notificationApi';

/**
 * Simplified WebSocket notifications hook that directly listens to WebSocket messages
 */
export const useWebSocketNotificationsSimple = () => {
  console.log('🎯 useWebSocketNotificationsSimple hook called');
  
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
  const fetchLastAt = useRef(0);
  const pollRef = useRef(null);
  const { isAuthenticated, user } = useAuthStore();
  
  console.log('🎯 Simple Hook state:', { isAuthenticated, user: !!user, isInitialized: isInitialized.current });
  
  // Initialize WebSocket connection only when authenticated
  useEffect(() => {
    console.log('🔄 Simple Hook useEffect triggered:', { isInitialized: isInitialized.current, isAuthenticated, user: !!user });
    
    // Reset initialization if WebSocket is not properly connected
    const wsStatus = notificationWebSocket.getStatus();
    if (isInitialized.current && (!wsStatus.connected || !wsStatus.authenticated)) {
      console.log('🔄 Simple Hook: WebSocket not properly connected, resetting initialization');
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
      
      // Use notificationWebSocket event API instead of raw socket listeners
      // Helper to sync notifications from server
      const syncFromServer = async () => {
        try {
          const now = Date.now();
          const last = fetchLastAt.current || 0;
          if (now - last < 2000) return; // throttle
          fetchLastAt.current = now;
          const res = await fetchMyNotifications({ page: 1, limit: 10 });
          if (res && res.data && Array.isArray(res.data.notifications)) {
            const normalized = res.data.notifications.map(n => {
              const createdAt = n.createdAt || n.created_at;
              const date = createdAt ? new Date(createdAt) : new Date();
              return {
                id: n.notification_id || n.id,
                notification_id: n.notification_id || n.id,
                title: n.title,
                message: n.message,
                read_at: n.read_at,
                createdAt: createdAt,
                _time: date,
                time: date.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                isUnread: !n.read_at
              };
            });

            // Merge server list (newest first)
            setNotifications(prev => {
              const map = new Map();
              normalized.concat(prev).forEach(item => {
                const key = item.id || item.notification_id;
                if (!map.has(key)) map.set(key, item);
              });
              const merged = Array.from(map.values());
              merged.sort((a, b) => new Date(b.createdAt || b._time) - new Date(a.createdAt || a._time));
              return merged.slice(0, 100);
            });

            const unread = normalized.filter(n => n.isUnread).length;
            setUnreadCount(unread);
          }
        } catch (err) {
          console.error('Error syncing notifications from server:', err);
        }
      };

      // Play a short notification sound (Web Audio API)
      const playNotificationSound = () => {
        try {
          const enabled = (() => { try { return localStorage.getItem('notification_sound') !== 'off'; } catch (e) { return true; } })();
          if (!enabled) return;
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return;
          const ctx = new AudioCtx();
          const now = ctx.currentTime;

          // Short filtered noise burst (droplet impact)
          const bufferSize = Math.floor(0.25 * ctx.sampleRate); // 250ms max
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          // fill with noise, shaped envelope
          for (let i = 0; i < bufferSize; i++) {
            // quick decay envelope applied later; fill with small random values
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.6;
          }

          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2000, now);
          bp.Q.setValueAtTime(8, now);
          // sweep downwards slightly to mimic water ripple ping
          bp.frequency.exponentialRampToValueAtTime(700, now + 0.18);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.35, now + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

          noise.connect(bp);
          bp.connect(gain);
          gain.connect(ctx.destination);

          noise.start(now);

          // Tiny high-frequency ping to simulate the initial metallic drop sound
          const osc = ctx.createOscillator();
          const og = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(3300, now);
          og.gain.setValueAtTime(0.0001, now);
          og.gain.exponentialRampToValueAtTime(0.25, now + 0.005);
          og.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
          osc.connect(og);
          og.connect(ctx.destination);
          osc.start(now);

          // cleanup after sound finished
          setTimeout(() => {
            try { noise.stop(); osc.stop(); ctx.close(); } catch (e) {}
          }, 600);
        } catch (e) {
          // Fallback: try HTML5 Audio with a small beep data URI (if allowed)
          try {
            const a = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=');
            a.play().catch(() => {});
          } catch (err) {}
        }
      };

      const handleNotification = (notification) => {
        // Prefer ISO timestamp from server; fall back to createdAtLocal or raw
        const createdAt = notification.createdAt || notification.createdAtIso || notification.created_at || notification.createdAtLocal;
        const date = createdAt ? new Date(createdAt) : new Date();
        const normalized = {
          id: notification.id || notification.notification_id || notification.notificationId,
          notification_id: notification.notification_id || notification.id || notification.notificationId,
          title: notification.title,
          message: notification.message,
          read_at: notification.read_at,
          createdAt: createdAt,
          _time: date,
          time: notification.createdAtLocal || notification.time || date.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          isUnread: !notification.read_at
        };

        setNotifications(prev => {
          if (prev.some(n => (n.id || n.notification_id) === normalized.id)) return prev;
          const merged = [normalized, ...prev];
          merged.sort((a, b) => new Date(b.createdAt || b._time) - new Date(a.createdAt || a._time));
          return merged.slice(0, 100);
        });

        if (!notification.read_at) setUnreadCount(prev => prev + 1);

        // Play sound for newly received notification
        try { playNotificationSound(); } catch (e) {}

        // Best-effort sync from server to ensure DB-backed notifications appear
        syncFromServer();
      };

      const handleCount = (count) => setUnreadCount(count);
      const handleCountAndSync = (count) => {
        setUnreadCount(count);
        syncFromServer();
      };
      const handleConnected = () => setConnectionStatus({ connected: true, connecting: false, authenticated: true, reconnectAttempts: notificationWebSocket.reconnectAttempts || 0 });
      const handleDisconnected = () => setConnectionStatus({ connected: false, connecting: false, authenticated: false, reconnectAttempts: notificationWebSocket.reconnectAttempts || 0 });
      const handleError = (err) => setError(err?.message || err || 'WebSocket error');

      notificationWebSocket.on('notification', handleNotification);
      notificationWebSocket.on('notificationCount', handleCountAndSync);
      notificationWebSocket.on('connected', handleConnected);
      notificationWebSocket.on('disconnected', handleDisconnected);
      notificationWebSocket.on('error', handleError);
      
      console.log('✅ Simple Hook: Direct WebSocket listeners set up successfully');

      // Update connection status immediately
      const initialStatus = notificationWebSocket.getStatus();
      console.log('🔍 Initial WebSocket status:', initialStatus);
      setConnectionStatus(prev => ({ ...prev, ...initialStatus }));
      
      // Cleanup function for this effect
      return () => {
        console.log('🧹 Simple Hook: Cleaning up WebSocket event listeners');
        notificationWebSocket.off('notification', handleNotification);
        notificationWebSocket.off('notificationCount', handleCountAndSync);
        notificationWebSocket.off('connected', handleConnected);
        notificationWebSocket.off('disconnected', handleDisconnected);
        notificationWebSocket.off('error', handleError);
        isInitialized.current = false; // Reset for next login
      };
    }
  }, [isAuthenticated, user]); // Depend on auth state

  // Polling fallback: when WS is disconnected, poll server every 10s to fetch latest notifications
  useEffect(() => {
    try {
      if (!connectionStatus.connected && isAuthenticated && user) {
        if (!pollRef.current) {
          pollRef.current = setInterval(() => {
            syncFromServer();
          }, 10000);
          // Do an immediate sync
          syncFromServer();
        }
      } else {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    } catch (err) {
      console.error('Error in polling fallback effect:', err);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [connectionStatus.connected, isAuthenticated, user]);

  // Mark notification as read (use server's mark-read API which accepts an array of ids)
  const markAsRead = async (notificationId) => {
    try {
      // Optimistic UI update
      setNotifications(prev => 
        prev.map(notification => 
          (notification.id === notificationId || notification.notification_id === notificationId)
            ? { ...notification, read_at: new Date().toISOString(), isUnread: false }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Server call (wrap single id in array)
      await markNotificationsRead([notificationId]);
    } catch (error) {
      console.error('Error marking notification as read via API:', error);
      // Note: could implement rollback if needed
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read_at && (n.id || n.notification_id))
        .map(n => n.id || n.notification_id);

      if (unreadIds.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Optimistic UI update
      setNotifications(prev => prev.map(notification => ({ ...notification, read_at: new Date().toISOString(), isUnread: false })));
      setUnreadCount(0);

      await markNotificationsRead(unreadIds);
    } catch (error) {
      console.error('Error marking all notifications as read via API:', error);
      // Note: could implement rollback if needed
    }
  };

  // Manual reconnect function
  const reconnect = () => {
    console.log('🔄 Simple Hook: Manual reconnect requested');
    isInitialized.current = false;
    notificationWebSocket.connect();
  };

  return {
    notifications,
    unreadCount,
    connectionStatus,
    error,
    markAsRead,
    markAllAsRead,
    reconnect
  };
};
