import React from 'react'
import ReactDOM from 'react-dom/client'

// Simple test component to verify the app loads
function TestApp() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{
        color: '#333',
        marginBottom: '20px'
      }}>
        Farm Data Informer - Test Mode
      </h1>
      <p style={{
        color: '#666',
        marginBottom: '10px'
      }}>
        ✅ React is working
      </p>
      <p style={{
        color: '#666',
        marginBottom: '10px'
      }}>
        ✅ Build is successful
      </p>
      <p style={{
        color: '#666',
        marginBottom: '10px'
      }}>
        ✅ App is loading correctly
      </p>
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p><strong>If you see this message, the deployment is working!</strong></p>
        <p>The issue might be with CSS loading or component dependencies.</p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
)
