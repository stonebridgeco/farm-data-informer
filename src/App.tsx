import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Farm Data Informer
              </h1>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Farm Data Informer
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Analyze farm suitability using comprehensive agricultural data
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Interactive Maps
              </h3>
              <p className="text-gray-600">
                Visualize agricultural data with interactive maps and heat overlays
              </p>
            </div>
            
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Data Analysis
              </h3>
              <p className="text-gray-600">
                Analyze soil quality, climate patterns, and farm suitability
              </p>
            </div>
            
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Farm Scoring
              </h3>
              <p className="text-gray-600">
                Get comprehensive scores for different types of farming operations
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
