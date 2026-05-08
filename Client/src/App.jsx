import Meetings from './pages/Meetings';
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from './store';
import { ToastProvider, useToastContext } from './contexts/ToastContext';
import toastService from './utils/toastService';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation/Navigation';
import Login from './components/Login/Login';
import Signup from './components/SignUp/Signup';
import ForgotPassword from './components/Auth/ForgotPassword';
import VerifyOTP from './components/Auth/VerifyOTP';
import ResetPassword from './components/Auth/ResetPassword';
import Dashboard from './components/Dashboard/Dashboard';
import Products from './components/Products';
import ToastContainer from './components/Toast/ToastContainer';

import ViewAllTask from './components/Tasks/ViewAllTask';
import TaskForm from './components/Tasks/TaskForm';
import AddLog from './components/Tasks/AddLog/AddLog';
import Analytics from './components/Analytics/Analytics';
import Team from './components/Team/Team';
import AssignMembers from './components/AssignMembers';
import TestComponent from './components/TestComponent';
import ErrorLogger from './components/ErrorLogger';
import APIDebugger from './components/APIDebugger';
import SimpleAPITest from './components/SimpleAPITest';
import projectDisplay from './components/projectDisplay';
import ShowAllLogs from './components/LogTable/ShowAllLogs/ShowAllLogs';
import ViewSingleTaskLogs from './components/LogTable/LogsByTaskID/ViewSingleTaskLogs';
import Settings from './components/Settings/Settings';
import ProjectDetails from './components/ProjectDetails/ProjectDetails';
import ProjectReport from './components/ProjectDetails/ProjectReport';
import NotFound from './components/NotFound';
import AllNotifications from './components/Notifications/AllNotifications';
import { ROLES } from './store';

function AppContent() {
  const { isAuthenticated, initializeAuth, isLoading } = useAuthStore();
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToastContext();
  const { sidebar, initializeTheme } = useUIStore();

  useEffect(() => {
    initializeTheme();
    initializeAuth();
    // Bridge context to global toastService so non-React code can call it
    toastService.register({ showSuccess, showError, showWarning, showInfo });
  }, [initializeTheme, initializeAuth]);

  // Show loading screen while authentication is being initialized
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Navigation - Only show if authenticated */}
        {isAuthenticated && <Navigation />}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden" style={{ paddingTop: '64px' }}>
          <div className="flex-1 overflow-y-auto">
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />
            } />
            <Route path="/forgot-password" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />
            } />
            <Route path="/verify-otp" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerifyOTP />
            } />
            <Route path="/reset-password" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPassword />
            } />
            
            {/* Debug Routes */}
            <Route path="/test" element={<TestComponent />} />
            <Route path="/debug" element={<ErrorLogger />} />
            <Route path="/api-debugger" element={<APIDebugger />} />
            <Route path="/api-test" element={<SimpleAPITest />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/projects" element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } />
            

            
                     <Route path="/project/:project_id" element={
       <ProtectedRoute>
         <ProjectDetails />
       </ProtectedRoute>
     } />
     <Route path="/project/:project_id/report" element={
       <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
         <ProjectReport />
       </ProtectedRoute>
     } />
    
                <Route path="/project/:project_id/tasks" element={
              <ProtectedRoute>
                <ViewAllTask />
              </ProtectedRoute>
            } />
            
            <Route path="/project/:project_id/add-task" element={
              <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <TaskForm />
              </ProtectedRoute>
            } />
            
            <Route path="/project/:project_id/task/:task_id/add-log" element={
              <ProtectedRoute>
                <AddLog />
              </ProtectedRoute>
            } />
            
            <Route path="/project/:project_id/task/:task_id/logs" element={
              <ProtectedRoute>
                <ViewSingleTaskLogs />
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            
            <Route path="/team" element={
              <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Team />
              </ProtectedRoute>
            } />
            
            <Route path="/project/:project_id/assign-members" element={
              <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
                <AssignMembers />
              </ProtectedRoute>
            } />

            <Route path="/logs" element={
              <ProtectedRoute>
                <ShowAllLogs />
              </ProtectedRoute>
            } />
            
            <Route path="/tasks" element={
              <ProtectedRoute>
                <ViewAllTask />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            <Route path="/notifications" element={
              <ProtectedRoute>
                <AllNotifications />
              </ProtectedRoute>
            } />
            
            {/* Timeline Route */}
            <Route path="/timeline" element={
              <ProtectedRoute>
                <Meetings />
              </ProtectedRoute>
            } />
            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </BrowserRouter>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;