import { useState } from 'react'
import { FarmMap } from './components/Map'
import { County } from './types'

function App() {
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Farm Data Informer
              </h1>
              {selectedCounty && (
                <span className="ml-4 text-sm text-gray-600">
                  - {selectedCounty.name}, {selectedCounty.state}
                </span>
              )}
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900">Dashboard</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Map</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Analysis</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Data</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-120px)]">
        <FarmMap 
          onCountySelect={setSelectedCounty}
          selectedCounty={selectedCounty}
        />
      </main>
    </div>
  )
}

export default App
