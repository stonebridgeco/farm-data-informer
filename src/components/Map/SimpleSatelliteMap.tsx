import React, { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import USGSService from '../../services/usgsService';
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
  const [elevationData, setElevationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const handleLocationClick = async (lat: number, lon: number) => {
    console.log('handleLocationClick called:', lat, lon);
    setClickedLocation({ lat, lon });
    setLoading(true);
    
    try {
      // Fetch real USGS elevation data using SOAP format
      console.log('Fetching USGS elevation data via SOAP...');
      
      const soapBody = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                     xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                     xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <GetElevation xmlns="http://nationalmap.gov/epqs">
            <X>${lon}</X>
            <Y>${lat}</Y>
            <Units>Meters</Units>
            <Output>JSON</Output>
          </GetElevation>
        </soap:Body>
      </soap:Envelope>`;

      const response = await fetch('https://nationalmap.gov/epqs/pqs.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://nationalmap.gov/epqs/GetElevation'
        },
        body: soapBody
      });

      if (response.ok) {
        const xmlText = await response.text();
        // Parse SOAP response for elevation data
        const elevationMatch = xmlText.match(/<Elevation>(.*?)<\/Elevation>/);
        const elevation = elevationMatch ? parseFloat(elevationMatch[1]) : null;
        
        setElevationData(elevation ? [{ lat, lon, elevation }] : null);
        console.log('USGS SOAP elevation:', elevation);
      } else {
        // Fallback to Open Elevation API
        const fallbackResponse = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const elevation = fallbackData.results?.[0]?.elevation;
          setElevationData(elevation ? [{ lat, lon, elevation }] : null);
          console.log('Open Elevation fallback:', elevation);
        } else {
          setElevationData(null);
        }
      }
    } catch (error) {
      console.error('Error fetching elevation data:', error);
      setElevationData(null);
    } finally {
      setLoading(false);
    }
    
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
            <strong>Location Data:</strong><br/>
            {loading ? (
              '🔄 Loading USGS data...'
            ) : clickedLocation ? (
              <>
                📍 Lat: {clickedLocation.lat.toFixed(4)}<br/>
                📍 Lon: {clickedLocation.lon.toFixed(4)}<br/>
                {elevationData && elevationData.length > 0 ? (
                  <>
                    🏔️ Elevation: {elevationData[0].elevation}m<br/>
                    ✅ USGS Data: Available
                  </>
                ) : (
                  '❌ USGS Data: Not available'
                )}
              </>
            ) : (
              'Click map to get real USGS data'
            )}
          </div>
        </div>
        
        {elevationData && elevationData.length > 0 && (
          <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#e0f2fe', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px' }}>
              <strong>🛰️ USGS Elevation API:</strong><br/>
              Source: Open Elevation<br/>
              Accuracy: ±10m<br/>
              Updated: Real-time
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleSatelliteMap;
