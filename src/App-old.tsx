import { useState } from 'react'
import { FarmMap } from './components/Map'
// import TestMap from './components/Map/TestMap'
import { Dashboard } from './components/Dashboard'
import { Header } from './components/Layout'
import { County, FarmSuitabilityScore } from './types'

function App() {
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [suitabilityData, setSuitabilityData] = useState<FarmSuitabilityScore | undefined>(undefined);

  const handleAnalyze = (_county: County, farmType: string) => {
    // Mock analysis - in a real app, this would call the API
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
    // TODO: Implement search functionality
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSearch={handleSearch}
        onSettingsClick={() => console.log('Settings clicked')}
        onHelpClick={() => console.log('Help clicked')}
      />

      <main className="flex h-[calc(100vh-120px)]">
        {/* Dashboard Section - LEFT SIDE (40%) */}
        <div className="w-2/5 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4">
            <Dashboard
              selectedCounty={selectedCounty}
              suitabilityData={suitabilityData}
              onAnalyze={handleAnalyze}
            />
          </div>
        </div>
        
        {/* Map Section - RIGHT SIDE (60%) */}
        <div className="flex-1">
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
