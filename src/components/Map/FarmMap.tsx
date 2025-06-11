import React, { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import CountyLayer from './CountyLayer.tsx';
import MapControls from './MapControls.tsx';
import LoadingSpinner from '../LoadingSpinner';
import { County, MapState } from '../../types';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
import L from 'leaflet';

// Use CDN URLs for marker icons to avoid bundling issues
let DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FarmMapProps {
  onCountySelect?: (county: County) => void;
  selectedCounty?: County | null;
}

const FarmMap: React.FC<FarmMapProps> = ({ onCountySelect, selectedCounty }) => {
  const [mapState, setMapState] = useState<MapState>({
    center: [39.8283, -98.5795], // Geographic center of US
    zoom: 5,
    selectedCounty: null
  });
  const [mapLoading, setMapLoading] = useState(true);

  const handleCountyClick = (county: County) => {
    setMapState(prev => ({
      ...prev,
      selectedCounty: county
    }));
    onCountySelect?.(county);
  };

  // Simulate map loading for better UX
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (mapLoading) {
    return <LoadingSpinner message="Loading farm data map..." />;
  }

  return (
    <div className="map-container relative">
      <MapContainer
        center={mapState.center as LatLngExpression}
        zoom={mapState.zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <CountyLayer 
          onCountyClick={handleCountyClick}
          selectedCounty={selectedCounty || mapState.selectedCounty}
        />
      </MapContainer>
      
      <MapControls 
        selectedCounty={selectedCounty || mapState.selectedCounty}
        onClearSelection={() => {
          setMapState(prev => ({ ...prev, selectedCounty: null }));
          onCountySelect?.(null as any);
        }}
      />
    </div>
  );
};

export default FarmMap;
