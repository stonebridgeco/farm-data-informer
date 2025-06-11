import { useState, useEffect } from 'react'
import SimpleMap from './components/Map/SimpleMap'
import { Dashboard } from './components/Dashboard'
import AgriculturalDashboard from './components/Dashboard/AgriculturalDashboard'
import { Header } from './components/Layout'
import { County, FarmSuitabilityScore } from './types'

function App() {
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [suitabilityData, setSuitabilityData] = useState<FarmSuitabilityScore | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'overview' | 'agricultural'>('agricultural');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'dashboard' | 'map'>('dashboard');

  // Mobile detection and responsive handling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAnalyze = (_county: County, farmType: string) => {
    const mockData: FarmSuitabilityScore = {
      overall: 0.75 + Math.random() * 0.2,
      factors: {
        soil: 0.8 + Math.random() * 0.15,
        climate: 0.9 + Math.random() * 0.1,
        water: 0.7 + Math.random() * 0.2,
        terrain: 0.85 + Math.random() * 0.1,
        market: 0.6 + Math.random() * 0.3
      },
      farmType: farmType as any
    };
    setSuitabilityData(mockData);
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  // Mobile layout styles
  const mobileStyles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column' as const
    },
    main: {
      display: 'flex',
      height: 'calc(100vh - 80px)',
      flexDirection: isMobile ? 'column' as const : 'row' as const
    },
    dashboardSection: {
      width: isMobile ? '100%' : '40%',
      height: isMobile ? (mobileView === 'dashboard' ? 'calc(100vh - 130px)' : '0px') : 'auto',
      borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
      backgroundColor: 'white',
      overflowY: 'auto' as const,
      display: isMobile ? (mobileView === 'dashboard' ? 'block' : 'none') : 'block'
    },
    mapSection: {
      flex: isMobile ? 'none' : '1',
      width: isMobile ? '100%' : 'auto',
      height: isMobile ? (mobileView === 'map' ? 'calc(100vh - 130px)' : '0px') : 'auto',
      display: isMobile ? (mobileView === 'map' ? 'block' : 'none') : 'block'
    },
    tabContainer: {
      borderBottom: '1px solid #e5e7eb',
      padding: '0 16px',
      display: 'flex',
      backgroundColor: '#f9fafb',
      flexWrap: 'nowrap' as const,
      overflowX: 'auto' as const
    },
    mobileToggle: {
      display: isMobile ? 'flex' : 'none',
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '8px 0',
      justifyContent: 'center' as const,
      gap: '4px'
    }
  };

  return (
    <div style={mobileStyles.container}>
      <Header 
        onSearch={handleSearch}
        onSettingsClick={() => console.log('Settings clicked')}
        onHelpClick={() => console.log('Help clicked')}
      />

      {/* Mobile View Toggle */}
      <div style={mobileStyles.mobileToggle}>
        <button
          onClick={() => setMobileView('dashboard')}
          style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: mobileView === 'dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setMobileView('map')}
          style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: mobileView === 'map' ? 'rgba(255,255,255,0.2)' : 'transparent',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🗺️ Map
        </button>
      </div>

      <main style={mobileStyles.main}>
        {/* Dashboard Section - LEFT SIDE (40%) or Mobile Dashboard */}
        <div style={mobileStyles.dashboardSection}>
          {/* Tab Selector */}
          <div style={mobileStyles.tabContainer}>
            <button
              onClick={() => setActiveTab('agricultural')}
              style={{
                padding: '12px 16px',
                border: 'none',
                backgroundColor: activeTab === 'agricultural' ? 'white' : 'transparent',
                borderBottom: activeTab === 'agricultural' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'agricultural' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'agricultural' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: isMobile ? '12px' : '14px',
                whiteSpace: 'nowrap' as const
              }}
            >
              🚜 Agricultural Data
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '12px 16px',
                border: 'none',
                backgroundColor: activeTab === 'overview' ? 'white' : 'transparent',
                borderBottom: activeTab === 'overview' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'overview' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: isMobile ? '12px' : '14px',
                whiteSpace: 'nowrap' as const
              }}
            >
              📊 Overview
            </button>
          </div>

          {/* Dashboard Content */}
          <div style={{ height: 'calc(100% - 49px)' }}>
            {activeTab === 'agricultural' ? (
              <AgriculturalDashboard 
                selectedCountyFips={selectedCounty?.fips}
                isMobile={isMobile}
              />
            ) : (
              <div style={{ padding: isMobile ? '12px' : '16px' }}>
                <Dashboard
                  selectedCounty={selectedCounty}
                  suitabilityData={suitabilityData}
                  onAnalyze={handleAnalyze}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Map Section - RIGHT SIDE (60%) or Mobile Map */}
        <div style={mobileStyles.mapSection}>
          <SimpleMap 
            onCountySelect={setSelectedCounty}
            selectedCounty={selectedCounty}
          />
        </div>
      </main>
    </div>
  )
}

export default App
