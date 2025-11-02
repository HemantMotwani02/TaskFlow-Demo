import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useUIStore } from '../../store';

const NotificationSystem = () => {
  const { notifications, removeNotification, clearNotifications } = useUIStore();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-primary-500" />;
    }
  };

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return 'border-success-200 bg-success-50';
      case 'error':
        return 'border-danger-200 bg-danger-50';
      case 'warning':
        return 'border-warning-200 bg-warning-50';
      default:
        return 'border-primary-200 bg-primary-50';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.slice(0, 3).map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`max-w-sm w-full bg-white rounded-lg shadow-strong border ${getNotificationStyles(notification.type)} overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-sm text-slate-600 mt-1">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="inline-flex text-slate-400 hover:text-slate-600 transition-colors duration-200"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Notification Center (for larger screens) */}
      {notifications.length > 0 && (
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 right-4 z-40 w-80 bg-white rounded-lg shadow-strong border border-slate-200/60 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BellIcon className="h-5 w-5 text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Notifications ({notifications.length})
                  </h3>
                </div>
                <button
                  onClick={clearNotifications}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors duration-200"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors duration-200 ${getNotificationStyles(notification.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-sm text-slate-600 mt-1">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default NotificationSystem;
