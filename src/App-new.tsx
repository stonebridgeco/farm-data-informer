import { useState } from 'react'
import { FarmMap } from './components/Map'
import { Dashboard } from './components/Dashboard'
import { Header } from './components/Layout'
import { County, FarmSuitabilityScore } from './types'

function App() {
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [suitabilityData, setSuitabilityData] = useState<FarmSuitabilityScore | undefined>(undefined);

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
          <div style={{ padding: '16px' }}>
            <Dashboard
              selectedCounty={selectedCounty}
              suitabilityData={suitabilityData}
              onAnalyze={handleAnalyze}
            />
          </div>
        </div>
        
        {/* Map Section - RIGHT SIDE (60%) */}
        <div style={{ flex: '1' }}>
          <FarmMap 
            onCountySelect={setSelectedCounty}
            selectedCounty={selectedCounty}
          />
        </div>
      </main>
    </div>
  )
}

export default App
