import React, { useState } from 'react';

const SimpleAPITest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name, endpoint, method = 'GET', body = null) => {
    setLoading(true);
    
    try {
      console.log(`Testing ${name}: ${method} ${endpoint}`);
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(body && { body: JSON.stringify(body) })
      };

      const response = await fetch(`/api${endpoint}`, options);
      const data = await response.json();
      
      console.log(`${name} Response:`, { status: response.status, data });
      
      setResults(prev => ({
        ...prev,
        [name]: { status: response.status, data, ok: response.ok }
      }));
      
    } catch (error) {
      console.error(`${name} Error:`, error);
      setResults(prev => ({
        ...prev,
        [name]: { error: error.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    setResults({});
    
    // Test 1: Health check
    await testEndpoint('Health', '/health');
    
    // Test 2: Login with test credentials
    await testEndpoint('Login', '/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    // Test 3: Users endpoint (should fail without auth)
    await testEndpoint('Users', '/users');
    
    // Test 4: Projects endpoint (should fail without auth)
    await testEndpoint('Projects', '/projects');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Simple API Test</h1>
      
      <button 
        onClick={runTests}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Run Tests'}
      </button>

      <div className="space-y-4">
        {Object.entries(results).map(([name, result]) => (
          <div key={name} className="border rounded p-4">
            <h3 className="font-bold">{name}</h3>
            {result.error ? (
              <p className="text-red-600">Error: {result.error}</p>
            ) : (
              <div>
                <p className="text-sm">Status: {result.status}</p>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleAPITest;
