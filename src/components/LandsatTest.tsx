import React, { useState } from 'react';

const LandsatTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string>('Click "Test LANDSAT" to begin...');
  const [loading, setLoading] = useState(false);

  const testLandsatConnection = async () => {
    setLoading(true);
    setTestResults('Testing LANDSAT connection...');
    
    try {
      // Simple test - we'll build this step by step
      setTestResults('Ready to test LANDSAT data access');
    } catch (error) {
      setTestResults(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>LANDSAT Data Test</h2>
      <p>Isolated testing environment for LANDSAT functionality</p>
      
      <button 
        onClick={testLandsatConnection}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test LANDSAT'}
      </button>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap'
      }}>
        {testResults}
      </div>
    </div>
  );
};

export default LandsatTest;
