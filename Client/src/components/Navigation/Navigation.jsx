import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore, ROLES } from '../../store';
import { 
  HomeIcon, 
  FolderIcon, 
  UserGroupIcon, 
  PlusIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import ProfileImage from '../ProfileImage/ProfileImage';
import { useWebSocketNotificationsSimple as useWebSocketNotifications } from '../../hooks/useWebSocketNotificationsSimple';
import roleUtils from '../../utils/roleUtils';

const Navigation = () => {
  const { user, logout, canAccess } = useAuthStore();
  const { sidebar, toggleSidebar, theme, toggleTheme } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Use WebSocket-based real-time notifications
  const {
    notifications: currentNotifications,
    unreadCount: currentUnreadCount,
    connectionStatus,
    error: wsError,
    markAsRead: wsMarkAsRead,
    markAllAsRead: wsMarkAllAsRead,
    removeNotification: wsRemoveNotification,
    reconnect
  } = useWebSocketNotifications();

  // Sound preference stored in localStorage (default on)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('notification_sound') !== 'off'; } catch (e) { return true; }
  });

  const toggleSound = () => {
    try {
      const next = !soundEnabled;
      setSoundEnabled(next);
      localStorage.setItem('notification_sound', next ? 'on' : 'off');
    } catch (e) {}
  };

  // Debug: log incoming notifications for quick verification in browser console
  useEffect(() => {
    if (currentNotifications && currentNotifications.length > 0) {
      try { console.debug('🔔 Navigation received notifications:', currentNotifications.slice(0,3)); } catch (e) {}
    }
  }, [currentNotifications]);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Handle clicking outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/projects', label: 'Projects', icon: FolderIcon },
    { path: '/team', label: 'Team', icon: UserGroupIcon },
    { path: '/tasks', label: 'Tasks', icon: CheckCircleIcon },
    { path: '/logs', label: 'Logs', icon: DocumentTextIcon },
    { path: '/timeline', label: 'Timeline', icon: CalendarIcon }, // Timeline with calendar icon
  ];

  // Determine role (use auth store, fall back to localStorage via roleUtils)
  const userRole = user?.role || roleUtils.getRoleFromLocalStorage();

  // If the current user is a developer (employee), hide Team from the menu
  const filteredMenuItems = (userRole === ROLES.DEVELOPER)
    ? menuItems.filter(mi => mi.path !== '/team')
    : menuItems;

  return (
    <>
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700" style={{ height: '64px' }}>
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left side - Mobile menu button and TaskFlow icon */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              {sidebar ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
            
            {/* TaskFlow Icon */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                TaskFlow
              </h1>
            </div>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              {theme.mode === 'dark' ? (
                <SunIcon className="h-5 w-5 text-yellow-500" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

                         {/* Notifications */}
             <div className="relative" ref={notificationRef}>
               <button 
                 onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                 className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
               >
                 <BellIcon className="h-5 w-5" />
                 {currentUnreadCount > 0 && (
                   <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                 )}
               </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="fixed sm:absolute right-2 sm:right-0 mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 pt-2 pb-0 z-50">
                   <div className="px-3 py-1.5 border-b border-gray-200 dark:border-gray-700">
                     <div className="flex items-center justify-between">
                       <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                       <div className="flex items-center space-x-2">
                         {/* Connection status indicator */}
                         <div className={`w-2 h-2 rounded-full ${
                           connectionStatus.connected ? 'bg-green-500' : 
                           connectionStatus.connecting ? 'bg-yellow-500' : 'bg-red-500'
                         }`} title={
                           connectionStatus.connected ? 'Real-time connected' : 
                           connectionStatus.connecting ? 'Connecting...' : 'Disconnected'
                         }></div>
                         {/* Removed development-only buttons: Test / Sync / Debug / Hook Test / Reinit */}
                         {/* Error indicator and manual reconnect */}
                         {wsError && (
                           <button
                             onClick={reconnect}
                             className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                             title="Reconnect to real-time notifications"
                           >
                             Reconnect
                           </button>
                         )}
                       </div>
                     </div>
                   </div>
                   
                  {currentNotifications.length > 0 ? (
                    <div className="py-1 space-y-0 max-h-64 sm:max-h-96 overflow-y-auto">
                      {currentNotifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className="px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-start space-x-2">
                           <div className="flex-shrink-0 pt-1">
                             <div className={`w-2 h-2 rounded-full ${notification.isUnread ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                           </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                {notification.title}
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 sm:px-4 py-6 sm:py-8 text-center">
                      <BellIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
                    </div>
                  )}
                  
                  {currentNotifications.length > 0 && (
                    <div className="px-2 sm:px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:grid sm:grid-cols-3 gap-2 sticky bottom-0 bg-white dark:bg-gray-800">
                     <div className="flex gap-1.5 sm:gap-2 sm:col-span-2">
                       <button 
                         className="flex-1 sm:flex-none text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 sm:px-2.5 py-1.5 rounded-md border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                         onClick={() => { wsMarkAllAsRead(); }}
                       >
                         Mark all read
                       </button>
                       <button 
                         className="flex-1 sm:flex-none text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 sm:px-2.5 py-1.5 rounded-md border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                         onClick={() => navigate('/notifications')}
                       >
                         View all
                       </button>
                     </div>
                     <div className="flex items-center justify-center sm:justify-end">
                       <button
                         onClick={toggleSound}
                         className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                           soundEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                         }`}
                       >
                         <span className="sr-only">Toggle sound</span>
                         <span
                           className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                             soundEnabled ? 'translate-x-6' : 'translate-x-1'
                           }`}
                         />
                       </button>
                       <span className="ml-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300">Sound</span>
                     </div>
                   </div>
                  )}
                 </div>
               )}
             </div>

                         {/* Profile Dropdown */}
             <div className="relative" ref={profileRef}>
               <button
                 onClick={() => {
                   setIsProfileOpen(!isProfileOpen);
                   setIsNotificationOpen(false); // Close notification dropdown when profile is opened
                 }}
                 className="flex items-center space-x-3 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
               >
                <ProfileImage user={user} size="sm" showOnlineStatus={true} />
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'user@example.com'}</div>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                                     <button 
                     onClick={() => {
                       navigate('/settings');
                       setIsProfileOpen(false);
                       setIsNotificationOpen(false); // Close notification dropdown
                     }}
                     className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                   >
                    <Cog6ToothIcon className="mr-3 h-4 w-4" />
                    Settings
                  </button>
                                     <button
                     onClick={() => {
                       handleLogout();
                       setIsNotificationOpen(false); // Close notification dropdown
                     }}
                     className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors duration-200"
                   >
                    <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebar ? 'translate-x-0' : '-translate-x-full'}`} style={{ top: '64px', height: 'calc(100vh - 64px)', width: isSidebarMinimized ? '80px' : '288px' }}>
        <div className="flex flex-col h-full">
          {/* Navigation Menu */}
          <nav className={`flex-1 space-y-2 ${isSidebarMinimized ? 'px-2 py-6' : 'px-6 py-6'}`}>
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 no-underline ${
                    isActive(item.path)
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  } ${isSidebarMinimized ? 'justify-center' : ''}`}
                  title={isSidebarMinimized ? item.label : ''}
                >
                  <Icon className={`h-5 w-5 transition-colors duration-200 ${
                    isActive(item.path) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  } ${isSidebarMinimized ? '' : 'mr-3'}`} />
                  {!isSidebarMinimized && item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className={`border-t border-gray-200 dark:border-gray-700 space-y-2 ${isSidebarMinimized ? 'px-2 py-4' : 'px-6 py-4'}`}>
            {/* Minimize Toggle Button */}
            <button
              onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
              className={`group flex items-center w-full px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 ${isSidebarMinimized ? 'justify-center' : ''}`}
              title={isSidebarMinimized ? 'Expand Sidebar' : 'Minimize Sidebar'}
            >
              <svg className={`h-5 w-5 transition-colors duration-200 ${isSidebarMinimized ? '' : 'mr-3'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarMinimized ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
              </svg>
              {!isSidebarMinimized && (isSidebarMinimized ? 'Expand' : 'Minimize')}
            </button>

            {/* Profile Section */}
            <div className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 ${isSidebarMinimized ? 'justify-center' : ''}`}>
              <ProfileImage user={user} size="md" showOnlineStatus={true} />
              {!isSidebarMinimized && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'User'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'user@example.com'}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Navigation;
