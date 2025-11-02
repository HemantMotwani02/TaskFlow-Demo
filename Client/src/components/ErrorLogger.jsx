import React, { useEffect, useState } from 'react';

const ErrorLogger = () => {
  const [errors, setErrors] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Capture all console errors
    const originalError = console.error;
    const originalLog = console.log;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const error = {
        type: 'error',
        message: args.join(' '),
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      };
      setErrors(prev => [...prev, error]);
      originalError.apply(console, args);
    };

    console.log = (...args) => {
      const log = {
        type: 'log',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      };
      setLogs(prev => [...prev.slice(-50), log]); // Keep last 50 logs
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      const warn = {
        type: 'warn',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      };
      setLogs(prev => [...prev.slice(-50), warn]);
      originalWarn.apply(console, args);
    };

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = {
        type: 'unhandledrejection',
        message: event.reason?.message || event.reason || 'Unknown error',
        timestamp: new Date().toISOString(),
        stack: event.reason?.stack
      };
      setErrors(prev => [...prev, error]);
    });

    // Capture global errors
    window.addEventListener('error', (event) => {
      const error = {
        type: 'global',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
      };
      setErrors(prev => [...prev, error]);
    });

    return () => {
      console.error = originalError;
      console.log = originalLog;
      console.warn = originalWarn;
    };
  }, []);

  const clearLogs = () => {
    setErrors([]);
    setLogs([]);
  };

  const exportLogs = () => {
    const data = {
      errors,
      logs,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🐛 Error Logger & Debug Console</h1>
        <div className="space-x-2">
          <button 
            onClick={clearLogs}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Clear All
          </button>
          <button 
            onClick={exportLogs}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Export Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Errors */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-red-600">❌ Errors ({errors.length})</h2>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            {errors.length === 0 ? (
              <p className="text-green-600">No errors captured yet</p>
            ) : (
              errors.map((error, index) => (
                <div key={index} className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-red-500">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500">{error.timestamp}</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">{error.type}</span>
                  </div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300 mt-1">{error.message}</p>
                  {error.filename && (
                    <p className="text-xs text-gray-600 mt-1">
                      File: {error.filename}:{error.lineno}:{error.colno}
                    </p>
                  )}
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Stack trace</summary>
                      <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{error.stack}</pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Console Logs */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-600">📝 Console Logs ({logs.length})</h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-600">No logs captured yet</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-2 p-2 bg-white dark:bg-gray-800 rounded">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500">{log.timestamp}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      log.type === 'error' ? 'bg-red-100 text-red-800' :
                      log.type === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {log.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">💻 System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            <p><strong>URL:</strong> {window.location.href}</p>
            <p><strong>Local Storage:</strong> {localStorage.getItem('token') ? 'Token exists' : 'No token'}</p>
          </div>
          <div>
            <p><strong>Screen Size:</strong> {window.screen.width}x{window.screen.height}</p>
            <p><strong>Viewport:</strong> {window.innerWidth}x{window.innerHeight}</p>
            <p><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorLogger;
