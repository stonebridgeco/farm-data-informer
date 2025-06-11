import React from 'react';
import { Card, Badge, Progress } from '../UI';
import { Thermometer, Cloud, Droplets, Wind, Sun } from 'lucide-react';

interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  condition: string;
}

interface StatusDashboardProps {
  weatherData?: WeatherData;
  isLoading?: boolean;
}

const StatusDashboard: React.FC<StatusDashboardProps> = ({
  weatherData,
  isLoading = false
}) => {
  const mockWeather: WeatherData = {
    temperature: 72,
    humidity: 65,
    precipitation: 0.2,
    windSpeed: 8,
    condition: 'Partly Cloudy'
  };

  const weather = weatherData || mockWeather;

  const getTemperatureColor = (temp: number) => {
    if (temp < 32) return 'text-blue-600';
    if (temp < 60) return 'text-green-600';
    if (temp < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHumidityVariant = (humidity: number) => {
    if (humidity < 30) return 'warning';
    if (humidity > 80) return 'info';
    return 'success';
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Weather */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Current Conditions</h3>
          <Badge variant="info">{weather.condition}</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Thermometer className={`w-5 h-5 ${getTemperatureColor(weather.temperature)}`} />
            <div>
              <div className="text-lg font-semibold">{weather.temperature}°F</div>
              <div className="text-xs text-gray-500">Temperature</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Wind className="w-5 h-5 text-gray-600" />
            <div>
              <div className="text-lg font-semibold">{weather.windSpeed} mph</div>
              <div className="text-xs text-gray-500">Wind Speed</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Humidity & Precipitation */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Moisture Levels</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Humidity</span>
              </div>
              <Badge variant={getHumidityVariant(weather.humidity)} size="sm">
                {weather.humidity}%
              </Badge>
            </div>
            <Progress 
              value={weather.humidity} 
              variant={getHumidityVariant(weather.humidity) === 'success' ? 'success' : 'warning'}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Precipitation</span>
              </div>
              <span className="text-sm text-gray-600">{weather.precipitation}" today</span>
            </div>
            <Progress 
              value={Math.min(weather.precipitation * 100, 100)} 
              variant="info"
            />
          </div>
        </div>
      </Card>

      {/* Farm Conditions */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Farm Conditions</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Growing Conditions</span>
            <Badge variant="success">Excellent</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Soil Moisture</span>
            <Badge variant="warning">Moderate</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Pest Risk</span>
            <Badge variant="success">Low</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Disease Risk</span>
            <Badge variant="success">Low</Badge>
          </div>
        </div>
      </Card>

      {/* Solar Conditions */}
      <Card>
        <div className="flex items-center space-x-3">
          <Sun className="w-6 h-6 text-yellow-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Sunlight</span>
              <span className="text-sm text-gray-600">8.2 hrs today</span>
            </div>
            <Progress value={85} variant="warning" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StatusDashboard;
