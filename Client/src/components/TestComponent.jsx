import React, { useEffect, useState } from 'react';
import roleUtils from '../utils/roleUtils';

const TestComponent = () => {
  const [testResults, setTestResults] = useState({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Collect debug information
  const token = roleUtils.getTokenFromLocalStorage();
  const user = roleUtils.getUserFromLocalStorage();
    
    setDebugInfo({
      token: token ? `Exists (${token.length} chars)` : 'Not found',
      user: user ? 'Found in localStorage' : 'Not found',
      currentUrl: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    
    runAllTests();
  }, []);

  const runAllTests = async () => {
    setIsRunningTests(true);
    const results = {};
    
    // Test 1: Basic connectivity
    try {
      console.log('Testing basic connectivity...');
      const response = await fetch('/api/health');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Health data:', data);
        results.connectivity = `✅ Server is reachable (Status: ${response.status})`;
      } else {
        results.connectivity = `❌ Server error (Status: ${response.status})`;
      }
    } catch (error) {
      console.error('Connectivity error:', error);
      results.connectivity = `❌ Network error: ${error.message}`;
    }

    // Test 2: Authentication check
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        results.auth = '❌ No authentication token found';
      } else {
        console.log('Testing authentication...');
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Auth response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Auth data:', data);
          results.auth = `✅ Authenticated as ${data.data?.user?.name || data.data?.user?.email || 'Unknown'}`;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log('Auth error data:', errorData);
          results.auth = `❌ Authentication failed: ${errorData.message || response.statusText}`;
        }
      }
    } catch (error) {
      console.error('Auth test error:', error);
      results.auth = `❌ Auth test error: ${error.message}`;
    }

    // Test 3: Projects API
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        results.projects = '❌ No token for projects test';
      } else {
        console.log('Testing projects API...');
        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Projects response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Projects data:', data);
          const projectCount = data.data?.projects?.length || 0;
          results.projects = `✅ Found ${projectCount} projects`;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log('Projects error data:', errorData);
          results.projects = `❌ Projects API failed: ${errorData.message || response.statusText}`;
        }
      }
    } catch (error) {
      console.error('Projects test error:', error);
      results.projects = `❌ Projects test error: ${error.message}`;
    }

    // Test 4: Managers API
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        results.managers = '❌ No token for managers test';
      } else {
        console.log('Testing managers API...');
        const response = await fetch('/api/users/managers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Managers response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Managers data:', data);
          const managerCount = data.data?.managers?.length || 0;
          results.managers = `✅ Found ${managerCount} managers`;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log('Managers error data:', errorData);
          results.managers = `❌ Managers API failed: ${errorData.message || response.statusText}`;
        }
      }
    } catch (error) {
      console.error('Managers test error:', error);
      results.managers = `❌ Managers test error: ${error.message}`;
    }

    // Test 5: Login test
    try {
      console.log('Testing login endpoint...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword'
        }),
      });
      
      console.log('Login response status:', response.status);
      
      if (response.status === 401) {
        results.login = '✅ Login endpoint working (expected 401 for invalid credentials)';
      } else {
        const data = await response.json().catch(() => ({}));
        console.log('Login response data:', data);
        results.login = `⚠️ Login endpoint returned ${response.status}: ${data.message || 'Unknown'}`;
      }
    } catch (error) {
      console.error('Login test error:', error);
      results.login = `❌ Login test error: ${error.message}`;
    }

    console.log('All test results:', results);
    setTestResults(results);
    setIsRunningTests(false);
  };

  const clearStorage = () => {
    localStorage.clear();
    setDebugInfo({
      token: 'Cleared',
      user: 'Cleared',
      currentUrl: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    alert('Local storage cleared. Please refresh the page.');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Detailed API & Authentication Diagnostics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">API Test Results</h2>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">🖥️ Server Connectivity</h3>
            <p className="text-sm">{testResults.connectivity || 'Testing...'}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">🔐 Authentication</h3>
            <p className="text-sm">{testResults.auth || 'Testing...'}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">📋 Projects API</h3>
            <p className="text-sm">{testResults.projects || 'Testing...'}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">👥 Managers API</h3>
            <p className="text-sm">{testResults.managers || 'Testing...'}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">🚪 Login Endpoint</h3>
            <p className="text-sm">{testResults.login || 'Testing...'}</p>
          </div>
        </div>

        {/* Debug Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🔧 Debug Information</h2>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Local Storage</h3>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <p><strong>Token:</strong> {debugInfo.token}</p>
              <p><strong>User Data:</strong> {debugInfo.user}</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Environment</h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>URL:</strong> {debugInfo.currentUrl}</p>
              <p><strong>User Agent:</strong> {debugInfo.userAgent?.substring(0, 50)}...</p>
              <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={runAllTests}
                disabled={isRunningTests}
                className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
              >
                {isRunningTests ? '🔄 Running Tests...' : '🔄 Run Tests Again'}
              </button>
              
              <button 
                onClick={clearStorage}
                className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                🗑️ Clear Local Storage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📋 Troubleshooting Steps</h2>
        <div className="space-y-2 text-sm">
          <p><strong>1.</strong> Check if the server is running on port 7007</p>
          <p><strong>2.</strong> Check if the frontend is running on port 5173</p>
          <p><strong>3.</strong> Look at the browser console for detailed error messages</p>
          <p><strong>4.</strong> If authentication fails, try logging in again</p>
          <p><strong>5.</strong> If APIs fail, check the server logs for errors</p>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
