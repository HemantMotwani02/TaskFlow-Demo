/**
 * WebSocket-based real-time notification service
 * Replaces polling with efficient push-based notifications
 */

class NotificationWebSocket {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.isConnecting = false;
    this.listeners = new Map();
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.isAuthenticated = false;
  // Auto-reconnect helpers
  this._autoReconnectHandlersSet = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    // Disconnect any existing connection first
    if (this.ws) {
      this.disconnect();
    }

    this.isConnecting = true;
    const token = localStorage.getItem('token');

    console.log('🔑 Token check: exists=', !!token);
    if (!token) {
      this.isConnecting = false;
      // Retry after 2 seconds in case token is not ready yet
      setTimeout(() => {
        const retryToken = localStorage.getItem('token');
        if (retryToken) this.connect();
      }, 2000);
      return;
    }

    try {
      // Use wss:// for production, ws:// for development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Determine the correct backend server host
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // Check if accessing via localhost/127.0.0.1
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      
      // If on localhost, connect to localhost:7007
      // If on network IP (like 192.168.x.x), use the SAME IP but port 7007
      // This ensures the WebSocket connects to the right machine
      let serverHost;
      if (isLocalhost) {
        serverHost = 'localhost:7007';
      } else {
        // Use the same hostname as the frontend, but change port to 7007
        serverHost = `${hostname}:7007`;
      }

      // Allow overriding WebSocket base URL with env var (useful in CI/prod)
      const envWsBase = import.meta.env.VITE_WS_BASE_URL;
      const tokenParam = encodeURIComponent(token);
      const wsUrl = envWsBase
        ? `${envWsBase.replace(/\/$/, '')}/ws/notifications?token=${tokenParam}`
        : `${protocol}//${serverHost}/ws/notifications?token=${tokenParam}`;

      console.log('🔌 WebSocket Connection Info:');
      console.log('  - Frontend Hostname:', hostname);
      console.log('  - Frontend Port:', port);
      console.log('  - Is Localhost:', isLocalhost);
      console.log('  - Backend Server Host:', serverHost);
      console.log('  - Connecting to:', wsUrl.replace(/token=[^&]+/, 'token=***'));

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Safety timeout for connecting
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn('WebSocket connection timeout, closing and retrying');
          this.ws.close();
          this.scheduleReconnect();
        }
      }, 10000);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }

    // Ensure auto-reconnect handlers are registered once (browser-only)
    try {
      if (typeof window !== 'undefined' && !this._autoReconnectHandlersSet) {
        // When token is added in another tab or later, try connecting
        window.addEventListener('storage', (e) => {
          try {
            if (e.key === 'token' && e.newValue) {
              console.debug('Storage event: token set, attempting WS connect');
              setTimeout(() => this.connect(), 500);
            }
          } catch (err) {}
        });

        // When the tab becomes visible, attempt to reconnect (useful after background)
        document.addEventListener('visibilitychange', () => {
          try {
            if (document.visibilityState === 'visible') {
              console.debug('Visibility change: visible, checking WS status');
              const s = this.getStatus();
              if (!s.connected) this.connect();
            }
          } catch (err) {}
        });

        // When network comes back online
        window.addEventListener('online', () => {
          try { console.debug('Network online, attempting WS connect'); this.connect(); } catch (err) {}
        });

        this._autoReconnectHandlersSet = true;
      }
    } catch (err) {
      // ignore in non-browser environments
    }
  }

  handleOpen(event) {
    console.log('✅ WebSocket low-level open');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    // Start heartbeat to keep connection alive
    this.startHeartbeat();

    // Emit a lower-level open event (server will send 'connected' when authenticated)
    this.emit('open', event);
  }

  handleMessage(event) {
    try {
      // Log raw incoming message for debugging
      try {
        console.debug('🔵 Raw WS frame received:', event.data);
      } catch (e) {
        // ignore
      }
      const data = JSON.parse(event.data);
      // console.debug('WS message', data);
      switch (data.type) {
        case 'notification':
          this.emit('notification', data.payload);
          break;
        case 'notification_count':
          this.emit('notificationCount', data.payload);
          break;
        case 'connected':
          // Server explicitly confirms authentication
          this.isAuthenticated = true;
          this.emit('connected', data.payload || data.message || event);
          break;
        case 'pong':
          // Clear heartbeat timeout so we don't reconnect
          if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
          }
          break;
        case 'error':
          this.emit('error', data.message || data.payload || 'Unknown error from WS');
          break;
        default:
          // ignore unknown
      }
    } catch (err) {
      console.error('Failed to parse WS message', err, event.data);
    }
  }

  handleClose(event) {
    console.log('🔌 WebSocket closed', event.code, event.reason);
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.stopHeartbeat();
    this.emit('disconnected', event);
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  handleError(error) {
    console.error('WebSocket error', error);
    this.emit('error', error);
    if (this.ws && this.ws.readyState === WebSocket.CLOSED) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    setTimeout(() => this.connect(), delay);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
          this.heartbeatTimeout = setTimeout(() => {
            console.warn('Heartbeat timeout — closing socket');
            this.ws.close();
          }, 5000);
        } catch (e) {
          console.warn('Failed to send ping', e);
        }
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).delete(callback);
  }

  emit(event, data) {
    // Debug: show emitted event and payload
    try { console.debug(`🔔 WS emit -> ${event}`, data); } catch (e) {}
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(cb => {
      try { cb(data); } catch (e) { console.error('WS listener error', e); }
    });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  markAsRead(notificationId) {
    this.send({ type: 'mark_read', notificationId });
  }

  markAllAsRead() {
    this.send({ type: 'mark_all_read' });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      try { this.ws.close(1000, 'Manual disconnect'); } catch (e) {}
      this.ws = null;
    }
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
  }

  getStatus() {
    return {
      connected: !!(this.ws && this.ws.readyState === WebSocket.OPEN),
      connecting: this.isConnecting,
      authenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

const notificationWebSocket = new NotificationWebSocket();
// Expose for quick debugging in browser console (dev only)
try { window.notificationWebSocket = notificationWebSocket; } catch (e) { /* node env or restricted */ }
export default notificationWebSocket;
