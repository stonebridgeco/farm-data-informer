import React, { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import { County } from '../../types';

// TODO: Replace with real county data
const placeholderCountyData: any = { type: "FeatureCollection", features: [] };

interface CountyLayerProps {
  onCountyClick: (county: County) => void;
  selectedCounty: County | null;
}

const CountyLayer: React.FC<CountyLayerProps> = ({ onCountyClick, selectedCounty }) => {
  const [countyData, setCountyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay for realism
    setTimeout(() => {
      setCountyData(placeholderCountyData);
      setLoading(false);
    }, 500);
  }, []);

  const onEachFeature = (feature: any, layer: any) => {
    const county: County = {
      id: feature.properties.id,
      name: feature.properties.name,
      state: feature.properties.state,
      fips: feature.properties.fips,
      coordinates: [0, 0] // Will be calculated from bounds
    };

    layer.on({
      click: () => {
        onCountyClick(county);
      },
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 4,
          fillOpacity: 0.9,
          color: '#1E40AF' // Darker blue border on hover
        });
      },
      mouseout: (e: any) => {
        const layer = e.target;
        const isSelected = selectedCounty && feature.properties.id === selectedCounty.id;
        layer.setStyle({
          weight: isSelected ? 3 : 2,
          fillOpacity: isSelected ? 0.8 : 0.6,
          color: isSelected ? '#1E40AF' : '#047857'
        });
      }
    });

    // Bind popup with county information
    layer.bindPopup(`
      <div class="p-3">
        <h3 class="font-bold text-lg text-gray-900">${county.name}</h3>
        <p class="text-sm text-gray-600">${county.state}</p>
        <p class="text-xs text-gray-500 mb-2">FIPS: ${county.fips}</p>
        <div class="text-xs space-y-1">
          <div class="flex justify-between">
            <span>Farm Suitability:</span>
            <span class="text-green-600 font-medium">Good</span>
          </div>
          <div class="flex justify-between">
            <span>Soil Quality:</span>
            <span class="text-blue-600">B+</span>
          </div>
          <div class="flex justify-between">
            <span>Climate Zone:</span>
            <span class="text-orange-600">7a</span>
          </div>
        </div>
        <button class="mt-2 w-full bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600">
          Analyze Location
        </button>
      </div>
    `);
  };

  const getCountyStyle = (feature: any) => {
    const isSelected = selectedCounty && feature.properties.id === selectedCounty.id;
    
    return {
      fillColor: isSelected ? '#3B82F6' : '#059669', // Blue if selected, green otherwise
      weight: isSelected ? 3 : 2,
      opacity: 1,
      color: isSelected ? '#1E40AF' : '#047857', // Darker border
      fillOpacity: isSelected ? 0.8 : 0.6
    };
  };

  if (loading) {
    return null; // Show loading state in parent component
  }

  if (!countyData) {
    return null;
  }

  return (
    <GeoJSON
      data={countyData}
      style={getCountyStyle}
      onEachFeature={onEachFeature}
    />
  );
};

export default CountyLayer;
