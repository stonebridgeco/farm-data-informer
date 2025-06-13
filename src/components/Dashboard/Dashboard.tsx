import React, { useState, useEffect } from 'react';
import { County, FarmSuitabilityScore } from '../../types';
import { Card, Badge, Progress, Tabs, Button, Accordion } from '../UI';
import { MapPin, TrendingUp, Droplets, Thermometer, DollarSign, Activity, Database } from 'lucide-react';
import StatusDashboard from './StatusDashboard';

interface DashboardProps {
  selectedCounty: County | null;
  suitabilityData?: FarmSuitabilityScore;
  onAnalyze: (county: County, farmType: string) => void;
}

interface CountyDataPoint {
  source: string;
  type: string;
  value: string | number;
  unit?: string;
  status: 'success' | 'loading' | 'error';
  timestamp?: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  selectedCounty,
  suitabilityData,
  onAnalyze
}) => {
  const [selectedFarmType, setSelectedFarmType] = useState<'goat' | 'apple' | 'general'>('general');
  const [countyDataPoints, setCountyDataPoints] = useState<CountyDataPoint[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch real data for the selected county
  useEffect(() => {
    if (selectedCounty) {
      fetchCountyDataPoints(selectedCounty);
    }
  }, [selectedCounty]);

  const fetchCountyDataPoints = async (county: County) => {
    setIsLoadingData(true);
    const dataPoints: CountyDataPoint[] = [];

    try {
      // USDA NASS Agricultural Data
      dataPoints.push({ source: 'USDA NASS', type: 'Corn Yield', value: 'Loading...', status: 'loading' });
      dataPoints.push({ source: 'USDA NASS', type: 'Soybean Yield', value: 'Loading...', status: 'loading' });
      dataPoints.push({ source: 'USDA NASS', type: 'Corn Area', value: 'Loading...', status: 'loading' });

      // OpenWeather Current Conditions
      dataPoints.push({ source: 'OpenWeather', type: 'Temperature', value: 'Loading...', status: 'loading' });
      dataPoints.push({ source: 'OpenWeather', type: 'Humidity', value: 'Loading...', status: 'loading' });
      dataPoints.push({ source: 'OpenWeather', type: 'Weather', value: 'Loading...', status: 'loading' });

      // EPA ATTAINS Water Quality
      dataPoints.push({ source: 'EPA ATTAINS', type: 'Water Domains', value: 'Loading...', status: 'loading' });

      // Open Elevation
      dataPoints.push({ source: 'Open Elevation', type: 'Elevation', value: 'Loading...', status: 'loading' });

      // NOAA Climate Stations
      dataPoints.push({ source: 'NOAA', type: 'Climate Stations', value: 'Loading...', status: 'loading' });

      setCountyDataPoints([...dataPoints]);

      // Fetch USDA data
      try {
        const usdaResponse = await fetch(`https://quickstats.nass.usda.gov/api/api_GET/?key=${import.meta.env.VITE_USDA_NASS_API_KEY}&source_desc=CENSUS&sector_desc=CROPS&group_desc=FIELD CROPS&commodity_desc=CORN&statisticcat_desc=YIELD&agg_level_desc=COUNTY&state_alpha=${county.state}&county_code=${county.fips.slice(-3)}&year=2017&format=JSON`);
        if (usdaResponse.ok) {
          const usdaData = await usdaResponse.json();
          if (usdaData.data && usdaData.data.length > 0) {
            dataPoints[0] = { source: 'USDA NASS', type: 'Corn Yield', value: usdaData.data[0].Value, unit: 'BU / ACRE', status: 'success', timestamp: new Date().toLocaleTimeString() };
          }
        }
      } catch (error) {
        dataPoints[0] = { source: 'USDA NASS', type: 'Corn Yield', value: 'Error', status: 'error' };
      }

      // Fetch OpenWeather data
      try {
        const lat = county.coordinates?.[0] || 42.0308;
        const lon = county.coordinates?.[1] || -93.6319;
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=imperial`);
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          dataPoints[3] = { source: 'OpenWeather', type: 'Temperature', value: weatherData.main.temp, unit: '°F', status: 'success', timestamp: new Date().toLocaleTimeString() };
          dataPoints[4] = { source: 'OpenWeather', type: 'Humidity', value: weatherData.main.humidity, unit: '%', status: 'success', timestamp: new Date().toLocaleTimeString() };
          dataPoints[5] = { source: 'OpenWeather', type: 'Weather', value: weatherData.weather[0].description, status: 'success', timestamp: new Date().toLocaleTimeString() };
        }
      } catch (error) {
        dataPoints[3] = { source: 'OpenWeather', type: 'Temperature', value: 'Error', status: 'error' };
        dataPoints[4] = { source: 'OpenWeather', type: 'Humidity', value: 'Error', status: 'error' };
        dataPoints[5] = { source: 'OpenWeather', type: 'Weather', value: 'Error', status: 'error' };
      }

      // Fetch EPA data
      try {
        const epaResponse = await fetch(`https://attains.epa.gov/attains-public/api/domains?state=${county.state}`);
        if (epaResponse.ok) {
          const epaData = await epaResponse.json();
          dataPoints[6] = { source: 'EPA ATTAINS', type: 'Water Domains', value: epaData.length || 0, status: 'success', timestamp: new Date().toLocaleTimeString() };
        }
      } catch (error) {
        dataPoints[6] = { source: 'EPA ATTAINS', type: 'Water Domains', value: 'Error', status: 'error' };
      }

      // Fetch Elevation data
      try {
        const lat = county.coordinates?.[0] || 42.0308;
        const lon = county.coordinates?.[1] || -93.6319;
        const elevationResponse = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
        if (elevationResponse.ok) {
          const elevationData = await elevationResponse.json();
          dataPoints[7] = { source: 'Open Elevation', type: 'Elevation', value: elevationData.results[0].elevation, unit: 'm', status: 'success', timestamp: new Date().toLocaleTimeString() };
        }
      } catch (error) {
        dataPoints[7] = { source: 'Open Elevation', type: 'Elevation', value: 'Error', status: 'error' };
      }

      setCountyDataPoints([...dataPoints]);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (!selectedCounty) {
    return (
      <div className="space-y-6">
        <Card className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Select a County</h3>
            <p>Click on a county on the map to view farm suitability analysis</p>
          </div>
        </Card>
        
        {/* Show status dashboard even without county selection */}
        <StatusDashboard />
      </div>
    );
  }

  const farmTypes = [
    { id: 'general', label: 'General Farming', icon: '🌾' },
    { id: 'goat', label: 'Goat Farming', icon: '🐐' },
    { id: 'apple', label: 'Apple Orchard', icon: '🍎' }
  ];

  const suitabilityTabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <TrendingUp className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {suitabilityData ? Math.round(suitabilityData.overall * 100) : 75}%
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <Badge variant="success" size="lg">Excellent</Badge>
              <div className="text-sm text-gray-600 mt-1">Rating</div>
            </div>
          </div>
          
          <Progress 
            value={suitabilityData ? suitabilityData.overall * 100 : 75}
            variant="success"
            size="lg"
            showPercentage
          />
          
          <div className="text-sm text-gray-600">
            This county shows excellent potential for {farmTypes.find(f => f.id === selectedFarmType)?.label.toLowerCase()} 
            with strong soil conditions and favorable climate patterns.
          </div>
        </div>
      )
    },
    {
      id: 'status',
      label: 'Live Status',
      icon: <Activity className="w-4 h-4" />,
      content: <StatusDashboard />
    },
    {
      id: 'datapoints',
      label: 'Real Data',
      icon: <Database className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Live Data Points for {selectedCounty.name}, {selectedCounty.state}</h3>
            <Button 
              size="sm" 
              onClick={() => fetchCountyDataPoints(selectedCounty)}
              disabled={isLoadingData}
            >
              {isLoadingData ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
          
          <div className="grid gap-3">
            {countyDataPoints.map((dataPoint, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      dataPoint.status === 'success' ? 'bg-green-500' : 
                      dataPoint.status === 'loading' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="font-medium text-sm">{dataPoint.source}</div>
                      <div className="text-xs text-gray-500">{dataPoint.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {dataPoint.value} {dataPoint.unit || ''}
                    </div>
                    {dataPoint.timestamp && (
                      <div className="text-xs text-gray-400">{dataPoint.timestamp}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {countyDataPoints.length === 0 && !isLoadingData && (
            <div className="text-center text-gray-500 py-8">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No data points loaded. Click "Refresh Data" to fetch live information.</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'factors',
      label: 'Factors',
      content: (
        <div className="space-y-4">
          {[
            { name: 'Soil Quality', value: suitabilityData?.factors.soil || 0.8, icon: <div className="w-4 h-4 bg-brown-500 rounded" /> },
            { name: 'Climate', value: suitabilityData?.factors.climate || 0.9, icon: <Thermometer className="w-4 h-4" /> },
            { name: 'Water Access', value: suitabilityData?.factors.water || 0.7, icon: <Droplets className="w-4 h-4" /> },
            { name: 'Market Access', value: suitabilityData?.factors.market || 0.6, icon: <DollarSign className="w-4 h-4" /> }
          ].map((factor) => (
            <div key={factor.name}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  {factor.icon}
                  <span className="text-sm font-medium">{factor.name}</span>
                </div>
                <span className="text-sm text-gray-600">{Math.round(factor.value * 100)}%</span>
              </div>
              <Progress value={factor.value * 100} variant="default" />
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      content: (
        <Accordion
          items={[
            {
              id: 'soil',
              title: 'Soil Management',
              content: (
                <div className="space-y-2 text-sm">
                  <p>• Consider soil testing for pH and nutrient levels</p>
                  <p>• Implement crop rotation to maintain soil health</p>
                  <p>• Add organic matter to improve soil structure</p>
                </div>
              )
            },
            {
              id: 'climate',
              title: 'Climate Considerations',
              content: (
                <div className="space-y-2 text-sm">
                  <p>• Plan planting schedule around frost dates</p>
                  <p>• Consider drought-resistant varieties</p>
                  <p>• Install irrigation for dry periods</p>
                </div>
              )
            },
            {
              id: 'market',
              title: 'Market Opportunities',
              content: (
                <div className="space-y-2 text-sm">
                  <p>• Research local farmers markets</p>
                  <p>• Consider direct-to-consumer sales</p>
                  <p>• Explore organic certification benefits</p>
                </div>
              )
            }
          ]}
          allowMultiple
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* County Header */}
      <Card>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{selectedCounty.name}</h2>
            <p className="text-gray-600">{selectedCounty.state}</p>
            <p className="text-sm text-gray-500">FIPS: {selectedCounty.fips}</p>
          </div>
          <Badge variant="info">Selected</Badge>
        </div>
      </Card>

      {/* Farm Type Selection */}
      <Card>
        <h3 className="font-semibold mb-4">Farm Type</h3>
        <div className="grid grid-cols-3 gap-3">
          {farmTypes.map((type) => (
            <Button
              key={type.id}
              variant={selectedFarmType === type.id ? 'primary' : 'outline'}
              onClick={() => setSelectedFarmType(type.id as any)}
              className="flex flex-col items-center py-4"
            >
              <span className="text-2xl mb-1">{type.icon}</span>
              <span className="text-xs">{type.label}</span>
            </Button>
          ))}
        </div>
        
        <Button
          onClick={() => onAnalyze(selectedCounty, selectedFarmType)}
          className="w-full mt-4"
          leftIcon={<TrendingUp className="w-4 h-4" />}
        >
          Analyze Suitability
        </Button>
      </Card>

      {/* Suitability Analysis */}
      {suitabilityData && (
        <Card padding="none">
          <Tabs tabs={suitabilityTabs} variant="underline" />
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
