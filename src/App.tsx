import { useState } from 'react'
import SimpleSatelliteMap from './components/Map/SimpleSatelliteMap'
import { Dashboard } from './components/Dashboard'
import AgriculturalDashboard from './components/Dashboard/AgriculturalDashboard'
import { Header } from './components/Layout'
import { County, FarmSuitabilityScore } from './types'

function App() {
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [suitabilityData] = useState<FarmSuitabilityScore | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'overview' | 'agricultural'>('agricultural');

  const handleLocationClick = (lat: number, lon: number) => {
    setSelectedLocation({ lat, lon });
    
    // Create a mock county from the clicked location for AgriculturalDashboard
    const mockCounty: County = {
      id: `${lat}-${lon}`,
      name: `Location ${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      state: 'IA', // Default to Iowa for now
      fips: '19999', // Mock FIPS
      coordinates: [lat, lon]
    };
    
    setSelectedCounty(mockCounty);
    console.log('Location selected:', lat, lon);
  };

  const handleAnalyze = async (county: County, farmType: string) => {
    // TODO: Replace with real API call to agricultural data service
    console.log('Analyzing', county.name, 'for', farmType);
    // setSuitabilityData(realApiData);
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Header 
        onSearch={handleSearch}
        onSettingsClick={() => console.log('Settings clicked')}
        onHelpClick={() => console.log('Help clicked')}
      />

      <main style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* Dashboard Section - LEFT SIDE (40%) */}
        <div style={{ 
          width: '40%', 
          borderRight: '1px solid #e5e7eb', 
          backgroundColor: 'white', 
          overflowY: 'auto' 
        }}>
          {/* Tab Selector */}
          <div style={{ 
            borderBottom: '1px solid #e5e7eb', 
            padding: '0 16px',
            display: 'flex',
            backgroundColor: '#f9fafb'
          }}>
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
                fontSize: '14px'
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
                fontSize: '14px'
              }}
            >
              📊 Overview
            </button>
          </div>

          {/* Dashboard Content */}
          <div style={{ height: 'calc(100% - 49px)' }}>
            {activeTab === 'agricultural' ? (
              <AgriculturalDashboard 
                selectedCounty={selectedCounty}
              />
            ) : (
              <div style={{ padding: '16px' }}>
                <Dashboard
                  selectedCounty={selectedCounty}
                  suitabilityData={suitabilityData}
                  onAnalyze={handleAnalyze}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Satellite Map Section - RIGHT SIDE (60%) */}
        <div style={{ flex: '1' }}>
          <SimpleSatelliteMap onLocationClick={handleLocationClick} />
        </div>
      </main>
    </div>
  )
}

export default App
