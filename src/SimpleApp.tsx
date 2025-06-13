function SimpleApp() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Inter, sans-serif',
      backgroundColor: '#f9fafb',
      minHeight: '100vh'
    }}>
      <header style={{
        background: 'linear-gradient(90deg, #059669 0%, #2563eb 50%, #059669 100%)',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
          🚜 Farm Data Informer
        </h1>
        <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>
          Agricultural Suitability Analysis Platform
        </p>
      </header>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ marginTop: 0, color: '#374151' }}>System Status</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: '#059669' }}>✅ React App Loading</div>
          <div style={{ color: '#059669' }}>✅ Build System Working</div>
          <div style={{ color: '#059669' }}>✅ Basic Styling Applied</div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, color: '#374151' }}>Map Placeholder</h3>
        <div style={{
          height: '300px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280'
        }}>
          🗺️ Interactive Map Coming Soon
        </div>
      </div>
    </div>
  )
}

export default SimpleApp
