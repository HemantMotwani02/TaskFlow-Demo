import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, ROLES } from '../store';

const ProtectedRoute = ({ children, requiredRoles = null }) => {
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check if we have a token but authentication hasn't been initialized yet
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated && !isLoading) {
      // Re-initialize authentication if we have a token but aren't authenticated
      initializeAuth().finally(() => {
        setIsInitializing(false);
      });
    } else {
      setIsInitializing(false);
    }
  }, [isAuthenticated, isLoading, initializeAuth]);

  // Show loading spinner while checking authentication or initializing
  if (isLoading || isInitializing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only redirect to login if we're sure the user is not authenticated
  // and we're not in the middle of initializing
  if (!isAuthenticated && !isInitializing) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRoles && user) {
    const hasAccess = Array.isArray(requiredRoles) 
      ? requiredRoles.includes(user?.role)
      : user?.role === requiredRoles;

    if (!hasAccess) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
