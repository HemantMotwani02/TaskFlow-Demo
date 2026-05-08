import React, { useEffect, useState } from 'react';
import { useWebSocketNotificationsSimple as useWebSocketNotifications } from '../../hooks/useWebSocketNotificationsSimple';
import { fetchMyNotifications } from '../../utils/notificationApi';

const AllNotifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Use WebSocket notifications
  const {
    notifications: wsNotifications,
    connectionStatus,
    markAllAsRead: wsMarkAllAsRead,
    reconnect
  } = useWebSocketNotifications();

  // Load initial notifications from API (one-time load for historical data)
  const loadInitialNotifications = async () => {
    setLoading(true);
    try {
      // Fetch a large limit for "view all" behavior. If you have many notifications, adapt to pagination.
      const notifications = await fetchMyNotifications({ page: 1, limit: 1000 });

      const normalized = (notifications || []).map(n => {
        const created = n.createdAt || n.createdAtIso || n.created_at || n.createdAtLocal;
        const timeDate = created ? new Date(created) : new Date();
        return {
          ...n,
          id: n.id || n.notification_id || n.notificationId,
          notification_id: n.notification_id || n.id || n.notificationId,
          createdAt: created,
          _time: timeDate,
          time: n.createdAtLocal || timeDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        };
      });

      // Ensure newest notifications come first
      normalized.sort((a, b) => new Date(b.createdAt || b._time) - new Date(a.createdAt || a._time));
      setItems(normalized);
    } catch (e) {
      console.error('Failed to load initial notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialNotifications();
  }, []);

  // Combine WebSocket notifications with historical data
  useEffect(() => {
    if (wsNotifications.length > 0) {
      setItems(prev => {
        // normalize prev ids
        const existingIds = new Set(prev.map(item => item.id || item.notification_id));

        // Normalize incoming ws notifications
        const incoming = wsNotifications.map(n => {
          const created = n.createdAt || n.createdAtIso || n.created_at || n.createdAtLocal;
          const timeDate = created ? new Date(created) : new Date();
          return {
            id: n.id || n.notification_id || n.notificationId,
            notification_id: n.notification_id || n.id || n.notificationId,
            title: n.title,
            message: n.message,
            read_at: n.read_at,
            createdAt: created,
            _time: timeDate,
            time: n.createdAtLocal || n.time || timeDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          };
        }).filter(n => !existingIds.has(n.id));

        const merged = [...incoming, ...prev];
        // Sort newest first
        merged.sort((a, b) => new Date(b.createdAt || b._time) - new Date(a.createdAt || a._time));
        return merged.slice(0, 1000); // keep reasonable cap for view all
      });
    }
  }, [wsNotifications]);

  return (
    <div className="w-full px-4 lg:px-6 pb-6">
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Notifications</h1>
            <p className="text-xs text-gray-500 mt-1">
              Showing last 1 month notifications
              <span className="ml-2 flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus.connected ? 'bg-green-500' : 
                  connectionStatus.connecting ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs">
                  {connectionStatus.connected ? 'Real-time connected' : 
                   connectionStatus.connecting ? 'Connecting...' : 'Disconnected'}
                </span>
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                wsMarkAllAsRead();
                setItems(prev => prev.map(i => ({ ...i, read_at: i.read_at || new Date().toISOString() })));
              }}
              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Mark all as read
            </button>
            <button
              onClick={() => loadInitialNotifications()}
              className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Refresh
            </button>
            {!connectionStatus.connected && (
              <button
                onClick={reconnect}
                className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {items.length === 0 && !loading && (
          <div className="p-6 text-sm text-gray-500">No notifications found.</div>
        )}
        {items.map(n => (
          <div
            key={n.notification_id}
            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1 ${n.read_at ? 'bg-gray-300' : 'bg-green-500'}`}></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <div className="text-[11px] text-gray-500" title={n._time.toLocaleString()}>
                    {n.time || n._time.toLocaleString([], { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                <div className="text-[12px] text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                  {n.message}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center mt-4">
        <div className="text-xs text-gray-500">
          Showing {items.length} notifications • Real-time updates via WebSocket
        </div>
      </div>
    </div>
  );
};

export default AllNotifications;


