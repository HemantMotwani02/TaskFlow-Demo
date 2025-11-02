import React, { useState, useEffect } from 'react';

const APIDebugger = () => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  };

  const testAPI = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const options = {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) })
    };

    try {
      addLog(`Testing ${method} ${endpoint}`, 'info');
      
      const response = await fetch(`/api${endpoint}`, options);
      const data = await response.json();
      
      const result = {
        status: response.status,
        ok: response.ok,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      };

      addLog(`Response: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');
      
      if (!response.ok) {
        addLog(`Error: ${data.message || data.error || 'Unknown error'}`, 'error');
      }

      return result;
    } catch (error) {
      addLog(`Network Error: ${error.message}`, 'error');
      return { error: error.message };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    setLogs([]);

    addLog('Starting API tests...', 'info');

    // Test 1: Health check
    addLog('=== Test 1: Health Check ===', 'info');
    const healthResult = await testAPI('/health');
    setTestResults(prev => ({ ...prev, health: healthResult }));

    // Test 2: API Health check
    addLog('=== Test 2: API Health Check ===', 'info');
    const apiHealthResult = await testAPI('/health');
    setTestResults(prev => ({ ...prev, apiHealth: apiHealthResult }));

    // Test 3: Login endpoint
    addLog('=== Test 3: Login Endpoint ===', 'info');
    const loginResult = await testAPI('/auth/login', 'POST', {
      email: 'test@test.com',
      password: 'test123'
    });
    setTestResults(prev => ({ ...prev, login: loginResult }));

    // Test 4: Users endpoint (should fail without auth)
    addLog('=== Test 4: Users Endpoint (No Auth) ===', 'info');
    const usersResult = await testAPI('/users');
    setTestResults(prev => ({ ...prev, users: usersResult }));

    // Test 5: Projects endpoint (should fail without auth)
    addLog('=== Test 5: Projects Endpoint (No Auth) ===', 'info');
    const projectsResult = await testAPI('/projects');
    setTestResults(prev => ({ ...prev, projects: projectsResult }));

    // Test 6: Direct backend connection
    addLog('=== Test 6: Direct Backend Connection ===', 'info');
    try {
      const directResponse = await fetch('http://localhost:7007/health');
      const directData = await directResponse.json();
      setTestResults(prev => ({ 
        ...prev, 
        directBackend: { 
          status: directResponse.status, 
          ok: directResponse.ok, 
          data: directData 
        } 
      }));
      addLog(`Direct backend response: ${directResponse.status}`, directResponse.ok ? 'success' : 'error');
    } catch (error) {
      addLog(`Direct backend error: ${error.message}`, 'error');
      setTestResults(prev => ({ ...prev, directBackend: { error: error.message } }));
    }

    setIsRunning(false);
    addLog('All tests completed!', 'info');
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults({});
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 API Debugger</h1>
        <p className="text-gray-600">Test and debug API connectivity issues</p>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Test Controls</h2>
          <div className="space-x-2">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Environment Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Frontend URL:</strong> {window.location.origin}
          </div>
          <div>
            <strong>Backend URL:</strong> http://localhost:7007
          </div>
          <div>
            <strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-3">
            {Object.entries(testResults).map(([test, result]) => (
              <div key={test} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium capitalize">{test.replace(/([A-Z])/g, ' $1')}</h3>
                  {result.status && (
                    <span className={`font-mono text-sm ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  )}
                </div>
                {result.error ? (
                  <p className="text-red-600 text-sm">{result.error}</p>
                ) : result.data ? (
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-500 text-sm">No response data</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Logs</h2>
          <div className="bg-gray-100 rounded p-3 h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Run tests to see results.</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    <span className="text-gray-500">[{log.timestamp.split('T')[1].split('.')[0]}]</span>
                    <span className={`ml-2 ${
                      log.type === 'error' ? 'text-red-600' :
                      log.type === 'success' ? 'text-green-600' :
                      'text-gray-800'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Troubleshooting Guide */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">🔍 Troubleshooting Guide</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>1. Network Error:</strong> Check if backend server is running on port 7007</p>
          <p><strong>2. 404 Errors:</strong> Check if API endpoints exist in backend</p>
          <p><strong>3. 500 Errors:</strong> Check backend server logs for errors</p>
          <p><strong>4. CORS Errors:</strong> Check if backend has proper CORS configuration</p>
          <p><strong>5. Proxy Issues:</strong> Check Vite proxy configuration in vite.config.js</p>
        </div>
      </div>
    </div>
  );
};

export default APIDebugger;
