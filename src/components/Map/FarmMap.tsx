import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import LoadingSpinner from '../LoadingSpinner';
import { County } from '../../types';
import { mockCountyGeoJSON } from '../../services/mockData';
import '../../utils/leafletFix'; // Import the Leaflet icon fix

interface FarmMapProps {
  onCountySelect?: (county: County) => void;
  selectedCounty?: County | null;
}

const FarmMap: React.FC<FarmMapProps> = ({ onCountySelect, selectedCounty }) => {
  const [mapLoading, setMapLoading] = useState(true);
  const center: LatLngExpression = [39.8283, -98.5795]; // Geographic center of US
  const zoom = 5;

  // Simulate map loading for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleCountyClick = (feature: any) => {
    const county: County = {
      id: feature.properties.id,
      name: feature.properties.name,
      state: feature.properties.state,
      fips: feature.properties.fips,
      coordinates: [0, 0] // Will be calculated from bounds
    };
    onCountySelect?.(county);
  };

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      click: () => handleCountyClick(feature)
    });
    
    // Add popup
    layer.bindPopup(`
      <div class="p-2">
        <h3 class="font-semibold">${feature.properties.name}</h3>
        <p class="text-sm text-gray-600">${feature.properties.state}</p>
        <p class="text-xs text-gray-500">FIPS: ${feature.properties.fips}</p>
      </div>
    `);
  };

  const getCountyStyle = (feature: any) => {
    const isSelected = selectedCounty && feature.properties.id === selectedCounty.id;
    
    return {
      fillColor: isSelected ? '#3B82F6' : '#10B981',
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: isSelected ? 0.9 : 0.7
    };
  };

  if (mapLoading) {
    return <LoadingSpinner message="Loading farm data map..." />;
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <GeoJSON 
          data={mockCountyGeoJSON}
          style={getCountyStyle}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
      
      {/* Map Info Overlay */}
      {selectedCounty && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-2">Selected County</h3>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h4 className="font-medium text-blue-900">{selectedCounty.name}</h4>
            <p className="text-sm text-blue-700">{selectedCounty.state}</p>
            <p className="text-xs text-blue-600">FIPS: {selectedCounty.fips}</p>
          </div>
          <button
            onClick={() => onCountySelect?.(null as any)}
            className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default FarmMap;
