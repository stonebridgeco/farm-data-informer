import React, { useState } from 'react';
import { County, FarmSuitabilityScore } from '../../types';
import { Card, Badge, Progress, Tabs, Button, Accordion } from '../UI';
import { MapPin, TrendingUp, Droplets, Thermometer, DollarSign, Activity } from 'lucide-react';
import StatusDashboard from './StatusDashboard';

interface DashboardProps {
  selectedCounty: County | null;
  suitabilityData?: FarmSuitabilityScore;
  onAnalyze: (county: County, farmType: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  selectedCounty,
  suitabilityData,
  onAnalyze
}) => {
  const [selectedFarmType, setSelectedFarmType] = useState<'goat' | 'apple' | 'general'>('general');

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
