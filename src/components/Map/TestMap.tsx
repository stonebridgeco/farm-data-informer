import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import '../../utils/leafletFix';

const TestMap: React.FC = () => {
  const center: LatLngExpression = [39.8283, -98.5795]; // Geographic center of US
  const zoom = 5;

  const testGeoJSON = {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: { name: "Test County" },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [-100, 40],
            [-99, 40],
            [-99, 41],
            [-100, 41],
            [-100, 40]
          ]]
        }
      }
    ]
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
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
          data={testGeoJSON}
          style={{
            fillColor: '#blue',
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
          }}
        />
      </MapContainer>
    </div>
  );
};

export default TestMap;
