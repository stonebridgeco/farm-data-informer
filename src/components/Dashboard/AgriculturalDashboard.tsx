import { useAgriculturalData } from '../../hooks/useFarmData'
import Card from '../UI/Card'
import Badge from '../UI/Badge'
import Button from '../UI/Button'
import Progress from '../UI/Progress'
import Tabs from '../UI/Tabs'
import LoadingSpinner from '../LoadingSpinner'

interface AgriculturalDashboardProps {
  selectedCountyFips?: string
  isMobile?: boolean
}

export function AgriculturalDashboard({ selectedCountyFips, isMobile: _isMobile = false }: AgriculturalDashboardProps) {
  const { data, loading, error, status, refreshStatus, refresh } = useAgriculturalData(selectedCountyFips)

  if (!selectedCountyFips) {
    return (
      <div className="p-5 text-center">
        <h3 className="mb-2 text-gray-600">Select a County</h3>
        <p className="text-gray-500">Click on a county on the map to view detailed agricultural data</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-5 text-center">
        <LoadingSpinner />
        <p className="mt-2 text-gray-600">Loading agricultural data...</p>
        {status && (
          <div className="mt-4 text-sm">
            <div>🌾 USDA: {status.usda}</div>
            <div>🌤️ NOAA: {status.noaa}</div>
            <div>🏔️ USGS: {status.usgs}</div>
            <div>🌱 Soil: {status.soil}</div>
          </div>
        )}
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-5 text-center">
        <h3 className="text-red-600 mb-2">Data Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={refresh} className="bg-blue-500 text-white">
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  const tabData = [
    {
      id: 'overview',
      label: 'Overview',
      content: <OverviewTab data={data} />
    },
    {
      id: 'soil',
      label: 'Soil Analysis',
      content: <SoilTab data={data.soil_data} />
    },
    {
      id: 'climate',
      label: 'Climate',
      content: <ClimateTab data={data.climate_data} />
    },
    {
      id: 'terrain',
      label: 'Terrain',
      content: <TerrainTab data={data.terrain_data} />
    },
    {
      id: 'crops',
      label: 'Agricultural Data',
      content: <AgriculturalTab data={data.agricultural_data} />
    }
  ]

  return (
    <div className="p-4 h-full overflow-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">
            {data.county_info.name}, {data.county_info.state}
          </h2>
          <Button 
            onClick={refresh}
            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300"
          >
            🔄 Refresh
          </Button>
        </div>
        
        {/* Data Status Indicators */}
        <div className="flex gap-2 flex-wrap mb-2">
          <DataStatusBadge label="USDA" status={status?.usda || 'pending'} />
          <DataStatusBadge label="NOAA" status={status?.noaa || 'pending'} />
          <DataStatusBadge label="USGS" status={status?.usgs || 'pending'} />
          <DataStatusBadge label="Soil" status={status?.soil || 'pending'} />
        </div>

        {/* Cache Status */}
        {refreshStatus && (
          <div className="text-xs text-gray-600">
            Last updated: {refreshStatus.last_updated ? 
              new Date(refreshStatus.last_updated).toLocaleString() : 'Never'} 
            ({refreshStatus.cache_age_hours}h ago)
          </div>
        )}
      </div>

      {/* Error Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          ⚠️ Some data sources encountered issues: {error}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs tabs={tabData} defaultTab="overview" />
    </div>
  )
}

// Helper component for data status badges
function DataStatusBadge({ label, status }: { label: string; status: string }) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'cached': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'cached': return '💾'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  return (
    <Badge className={`text-xs px-2 py-1 ${getStatusClass(status)}`}>
      {getStatusIcon(status)} {label}
    </Badge>
  )
}

// Overview Tab Component
function OverviewTab({ data }: { data: any }) {
  const analysis = data.farm_analysis

  return (
    <div className="flex flex-col gap-4">
      {/* Overall Score Card */}
      <Card className="text-center mb-4">
        <h3 className={`text-2xl font-bold mb-1 ${getGradeColorClass(analysis.suitability_grade)}`}>
          Grade {analysis.suitability_grade}
        </h3>
        <div className="text-gray-600 mb-4">Farm Suitability Score</div>
        
        <Progress 
          value={analysis.overall_suitability_score} 
          max={100}
          className="mb-3"
        />
        <div className="text-sm text-gray-600">
          {analysis.overall_suitability_score}% Overall Suitability
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm">
          <h4 className="text-sm text-gray-600 mb-2">Soil Quality</h4>
          <div className="text-lg font-bold text-green-600">
            {data.soil_data.fertility_rating.charAt(0).toUpperCase() + 
             data.soil_data.fertility_rating.slice(1)}
          </div>
          <div className="text-xs text-gray-600">
            pH {data.soil_data.soil_ph_avg.toFixed(1)}
          </div>
        </Card>

        <Card padding="sm">
          <h4 className="text-sm text-gray-600 mb-2">Growing Season</h4>
          <div className="text-lg font-bold text-blue-600">
            {data.climate_data.growing_season.growing_season_length} days
          </div>
          <div className="text-xs text-gray-600">
            {data.climate_data.growing_season.growing_degree_days} GDD
          </div>
        </Card>
      </div>

      {/* Strengths and Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="sm">
          <h4 className="text-sm text-green-600 mb-2">💪 Strengths</h4>
          <ul className="text-xs space-y-1">
            {analysis.primary_strengths.map((strength: string, index: number) => (
              <li key={index}>• {strength}</li>
            ))}
          </ul>
        </Card>

        <Card padding="sm">
          <h4 className="text-sm text-red-600 mb-2">⚠️ Limitations</h4>
          <ul className="text-xs space-y-1">
            {analysis.primary_limitations.map((limitation: string, index: number) => (
              <li key={index}>• {limitation}</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Recommended Crops */}
      <Card padding="sm">
        <h4 className="text-sm text-green-700 mb-2">🌾 Recommended Crops</h4>
        <div className="flex flex-wrap gap-1">
          {analysis.recommended_crops.map((crop: string, index: number) => (
            <Badge key={index} className="bg-green-100 text-green-800 text-xs">
              {crop}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  )
}

// Soil Analysis Tab
function SoilTab({ data }: { data: any }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h4 className="mb-4">Soil Characteristics</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Soil Type</div>
            <div className="font-bold">{data.dominant_soil_type}</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">Fertility</div>
            <Badge className={getFertilityColorClass(data.fertility_rating)}>
              {data.fertility_rating}
            </Badge>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">pH Level</div>
            <div className="font-bold">
              {data.soil_ph_avg.toFixed(1)} 
              <span className="text-xs text-gray-600 ml-1">
                ({data.soil_ph_range.min.toFixed(1)} - {data.soil_ph_range.max.toFixed(1)})
              </span>
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">Organic Matter</div>
            <div className="font-bold">{data.organic_matter_percent.toFixed(1)}%</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">Drainage</div>
            <div className="font-bold">{data.drainage_class.replace(/_/g, ' ')}</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">Depth to Bedrock</div>
            <div className="font-bold">{Math.round(data.depth_to_bedrock)} cm</div>
          </div>
        </div>
      </Card>

      {/* Soil Score */}
      <Card>
        <h4 className="mb-3">Soil Suitability</h4>
        <Progress 
          value={data.soil_suitability_score} 
          max={100}
          className="mb-2"
        />
        <div className="text-sm text-gray-600">
          {data.soil_suitability_score}% Soil Suitability Score
        </div>
      </Card>

      {/* Limitations */}
      {data.limitations && data.limitations.length > 0 && (
        <Card>
          <h4 className="text-red-600 mb-3">Soil Limitations</h4>
          <ul className="text-sm space-y-1">
            {data.limitations.map((limitation: string, index: number) => (
              <li key={index}>• {limitation}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

// Climate Tab
function ClimateTab({ data }: { data: any }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h4 className="mb-4">Growing Season ({new Date().getFullYear() - 1})</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Season Length</div>
            <div className="font-bold text-lg text-blue-600">
              {data.growing_season.growing_season_length} days
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">Growing Degree Days</div>
            <div className="font-bold text-lg text-green-600">
              {data.growing_season.growing_degree_days}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">Frost Free Days</div>
            <div className="font-bold">{data.growing_season.frost_free_days}</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">Last Frost</div>
            <div className="font-bold">
              {data.growing_season.last_frost ? 
                new Date(data.growing_season.last_frost).toLocaleDateString() : 
                'N/A'
              }
            </div>
          </div>
        </div>
      </Card>

      {/* Climate Normals Preview */}
      {data.climate_normals && data.climate_normals.length > 0 && (
        <Card>
          <h4 className="mb-2">Climate Summary (30-year averages)</h4>
          <div className="text-sm text-gray-600">
            Based on {data.climate_normals.length} months of climate normal data
          </div>
        </Card>
      )}

      {/* Historical Weather Preview */}
      {data.historical_weather && data.historical_weather.length > 0 && (
        <Card>
          <h4 className="mb-2">Historical Weather Data</h4>
          <div className="text-sm text-gray-600">
            {data.historical_weather.length} daily weather records available
          </div>
        </Card>
      )}
    </div>
  )
}

// Terrain Tab
function TerrainTab({ data }: { data: any }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h4 className="mb-4">Terrain Analysis</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Elevation Range</div>
            <div className="font-bold">
              {Math.round(data.elevation_min)} - {Math.round(data.elevation_max)} m
            </div>
            <div className="text-xs text-gray-600">
              Avg: {Math.round(data.elevation_avg)} m
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">Slope</div>
            <div className="font-bold">
              {data.slope_avg.toFixed(1)}° ({data.slope_category.replace(/_/g, ' ')})
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">Drainage</div>
            <Badge className={getDrainageColorClass(data.drainage_pattern)}>
              {data.drainage_pattern}
            </Badge>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">Flood Risk</div>
            <Badge className={getRiskColorClass(data.flood_risk)}>
              {data.flood_risk}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Terrain Suitability Score */}
      <Card>
        <h4 className="mb-3">Terrain Suitability</h4>
        <Progress 
          value={data.farm_suitability_score} 
          max={100}
          className="mb-2"
        />
        <div className="text-sm text-gray-600">
          {data.farm_suitability_score}% Terrain Suitability Score
        </div>
      </Card>
    </div>
  )
}

// Agricultural Data Tab
function AgriculturalTab({ data }: { data: any }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h4 className="mb-4">USDA Agricultural Data ({data.data_year})</h4>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-blue-600">
              {data.crops.length}
            </div>
            <div className="text-xs text-gray-600">Crop Records</div>
          </div>
          
          <div>
            <div className="text-xl font-bold text-green-600">
              {data.livestock.length}
            </div>
            <div className="text-xs text-gray-600">Livestock Records</div>
          </div>
          
          <div>
            <div className="text-xl font-bold text-red-600">
              {data.economics.length}
            </div>
            <div className="text-xs text-gray-600">Economic Records</div>
          </div>
        </div>
      </Card>

      {data.crops.length === 0 && data.livestock.length === 0 && data.economics.length === 0 && (
        <Card className="text-center">
          <div className="text-gray-600 text-sm">
            📊 Agricultural data is being processed or may not be available for this county.
            <br />
            <span className="text-xs">
              Data sources are continuously updated. Check back later for more information.
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}

// Helper functions for styling
function getGradeColorClass(grade: string): string {
  switch (grade) {
    case 'A': return 'text-green-600'
    case 'B': return 'text-blue-600'
    case 'C': return 'text-yellow-600'
    case 'D': return 'text-red-600'
    case 'F': return 'text-red-800'
    default: return 'text-gray-600'
  }
}

function getFertilityColorClass(fertility: string): string {
  switch (fertility) {
    case 'excellent': return 'bg-green-100 text-green-800'
    case 'good': return 'bg-green-50 text-green-700'
    case 'fair': return 'bg-yellow-100 text-yellow-800'
    case 'poor': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getDrainageColorClass(drainage: string): string {
  switch (drainage) {
    case 'excellent': return 'bg-green-100 text-green-800'
    case 'good': return 'bg-green-50 text-green-700'
    case 'moderate': return 'bg-yellow-100 text-yellow-800'
    case 'poor': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getRiskColorClass(risk: string): string {
  switch (risk) {
    case 'low': return 'bg-green-100 text-green-800'
    case 'moderate': return 'bg-yellow-100 text-yellow-800'
    case 'high': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default AgriculturalDashboard
