import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import '../../utils/leafletFix';

interface SimpleMapProps {
  onCountySelect?: (county: any) => void;
  selectedCounty?: any;
}

const SimpleMap: React.FC<SimpleMapProps> = () => {
  const center: LatLngExpression = [39.8283, -98.5795]; // Geographic center of US
  const zoom = 5;

  return (
    <div style={{ width: '100%', height: '100%' }}>
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
        
        {/* Simple test marker */}
        <Marker position={center}>
          <Popup>
            <div>
              <h3>Test Location</h3>
              <p>Farm Data Informer - Map is working!</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default SimpleMap;
