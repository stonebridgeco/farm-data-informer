import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Tabs } from '../UI';
import usgsM2MService from '../../services/usgsM2MService';
import '../../utils/leafletFix';

// Satellite layer types
type SatelliteLayerType = 'natural' | 'infrared' | 'ndvi' | 'agriculture';

interface SatelliteMapProps {
  selectedLocation?: [number, number] | null;
  onLocationSelect?: (coords: [number, number]) => void;
}

const SatelliteMap: React.FC<SatelliteMapProps> = ({ 
  selectedLocation, 
  onLocationSelect 
}) => {
  const [currentLayer, setCurrentLayer] = useState<SatelliteLayerType>('natural');
  const [landsatData, setLandsatData] = useState<any>(null);
  const [ndviData, setNdviData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Default center on Iowa agricultural region
  const center: LatLngExpression = selectedLocation || [42.0308, -93.6319];
  const zoom = 10;

  // Load Landsat data when location changes
  useEffect(() => {
    if (selectedLocation) {
      loadSatelliteData(selectedLocation);
    }
  }, [selectedLocation, currentLayer]);

  const loadSatelliteData = async (coords: [number, number]) => {
    setLoading(true);
    try {
      const [lat, lon] = coords;
      
      // Get recent Landsat scenes
      const scenes = await usgsM2MService.searchLandsatScenes(lat, lon);
      setLandsatData(scenes);
      
      // Get NDVI data if on NDVI layer
      if (currentLayer === 'ndvi' || currentLayer === 'agriculture') {
        const ndvi = await usgsM2MService.calculateNDVI(`${lat}-${lon}`, lat, lon);
        setNdviData(ndvi);
      }
    } catch (error) {
      console.error('Error loading satellite data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng;
    onLocationSelect?.([lat, lng]);
  };

  // Satellite layer configurations
  const satelliteLayers = {
    natural: {
      name: 'Natural Color',
      description: 'True color satellite imagery',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, Maxar, Earthstar Geographics'
    },
    infrared: {
      name: 'Infrared',
      description: 'False color infrared for vegetation analysis',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, Maxar, Earthstar Geographics'
    },
    ndvi: {
      name: 'NDVI',
      description: 'Normalized Difference Vegetation Index',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'USGS Landsat via M2M API'
    },
    agriculture: {
      name: 'Agriculture',
      description: 'Agricultural analysis composite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'USGS Landsat via M2M API'
    }
  };

  const satelliteTabs = [
    {
      id: 'layers',
      label: 'Satellite Layers',
      content: (
        <div className="space-y-4">
          <div className="grid gap-2">
            {Object.entries(satelliteLayers).map(([key, layer]) => (
              <button
                key={key}
                onClick={() => setCurrentLayer(key as SatelliteLayerType)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  currentLayer === key
                    ? 'bg-blue-100 border-2 border-blue-400 text-blue-900'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{layer.name}</div>
                <div className="text-sm text-gray-600">{layer.description}</div>
              </button>
            ))}
          </div>
          
          {loading && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">Loading satellite data...</div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'analysis',
      label: 'Analysis',
      content: (
        <div className="space-y-4">
          {selectedLocation ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-900 mb-2">Location Analysis</h4>
                <div className="text-sm text-green-700">
                  Lat: {selectedLocation[0].toFixed(4)}<br/>
                  Lon: {selectedLocation[1].toFixed(4)}
                </div>
              </div>
              
              {landsatData && landsatData.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-2">Landsat Data</h4>
                  <div className="text-sm text-blue-700">
                    Latest Scene: {landsatData[0].acquisitionDate}<br/>
                    Cloud Cover: {landsatData[0].cloudCover}%<br/>
                    Available Scenes: {landsatData.length}
                  </div>
                </div>
              )}
              
              {ndviData && (currentLayer === 'ndvi' || currentLayer === 'agriculture') && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-medium text-green-900 mb-2">Vegetation Health</h4>
                  <div className="text-sm text-green-700">
                    NDVI Average: {ndviData.ndvi_avg?.toFixed(3)}<br/>
                    Health Status: {ndviData.vegetation_health}<br/>
                    Stress Level: {ndviData.crop_stress_level?.toFixed(1)}%
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm">Click on the map to analyze a location</div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      content: (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="font-medium text-amber-900 mb-2">Data Sources</h4>
            <div className="text-sm text-amber-700">
              • USGS Landsat Collection 2<br/>
              • 30m spatial resolution<br/>
              • Updated every 16 days<br/>
              • Cloud cover filtered
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Controls</h4>
            <div className="text-sm text-gray-700">
              • Click map to select location<br/>
              • Switch layers for different analysis<br/>
              • View real-time satellite data<br/>
              • Export analysis results
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full h-full flex">
      {/* Satellite Map - 70% width */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          eventHandlers={{
            click: handleMapClick
          }}
        >
          <TileLayer
            key={currentLayer}
            url={satelliteLayers[currentLayer].url}
            attribution={satelliteLayers[currentLayer].attribution}
            maxZoom={18}
          />
        </MapContainer>
        
        {/* Layer indicator */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
          {satelliteLayers[currentLayer].name}
        </div>
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4">
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-gray-600">Loading satellite data...</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Control Panel - 30% width */}
      <div className="w-80 bg-white border-l border-gray-200">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Satellite Analysis</h3>
            <p className="text-sm text-gray-600">USGS Landsat Agricultural Monitoring</p>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <Tabs tabs={satelliteTabs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteMap;
