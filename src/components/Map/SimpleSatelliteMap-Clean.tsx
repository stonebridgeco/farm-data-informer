import React, { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import '../../utils/leafletFix';

interface SimpleSatelliteMapProps {
  onLocationClick?: (lat: number, lon: number) => void;
}

// Component to handle map clicks
function MapClickHandler({ onLocationClick }: { onLocationClick?: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      console.log('Map clicked via useMapEvents:', lat, lng);
      onLocationClick?.(lat, lng);
    }
  });
  return null;
}

const SimpleSatelliteMap: React.FC<SimpleSatelliteMapProps> = ({ onLocationClick }) => {
  const [currentLayer, setCurrentLayer] = useState('satellite');
  const [clickedLocation, setClickedLocation] = useState<{lat: number, lon: number} | null>(null);
  
  const handleLocationClick = (lat: number, lon: number) => {
    console.log('handleLocationClick called:', lat, lon);
    setClickedLocation({ lat, lon });
    onLocationClick?.(lat, lon);
  };
  
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Map - 70% */}
      <div style={{ flex: '1', position: 'relative', backgroundColor: '#f0f0f0' }}>
        <MapContainer
          center={[42.0308, -93.6319]}
          zoom={10}
          style={{ height: '100%', width: '100%', minHeight: '400px' }}
          zoomControl={true}
          dragging={true}
          touchZoom={true}
          doubleClickZoom={true}
          scrollWheelZoom={true}
          boxZoom={true}
          keyboard={true}
        >
          <MapClickHandler onLocationClick={handleLocationClick} />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Esri"
          />
        </MapContainer>
        
        <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px', borderRadius: '4px', fontSize: '14px' }}>
          Satellite View
        </div>
      </div>
      
      {/* Controls - 30% */}
      <div style={{ width: '320px', backgroundColor: 'white', borderLeft: '1px solid #ccc', padding: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Satellite Controls</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setCurrentLayer('satellite')}
            style={{ width: '100%', padding: '8px', backgroundColor: '#dbeafe', borderRadius: '4px', textAlign: 'left', border: 'none' }}
          >
            🛰️ Satellite Imagery
          </button>
          <button 
            onClick={() => setCurrentLayer('terrain')}
            style={{ width: '100%', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', textAlign: 'left', border: 'none' }}
          >
            🏔️ Terrain
          </button>
        </div>
        
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '4px' }}>
          <div style={{ fontSize: '14px' }}>
            <strong>Location:</strong><br/>
            {clickedLocation ? (
              <>
                📍 Lat: {clickedLocation.lat.toFixed(4)}<br/>
                📍 Lon: {clickedLocation.lon.toFixed(4)}<br/>
                ✅ Click working
              </>
            ) : (
              'Click map to select location'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSatelliteMap;
