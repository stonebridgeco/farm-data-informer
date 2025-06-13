import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import LoadingSpinner from '../LoadingSpinner';
import { County } from '../../types';
import usgsM2MService from '../../services/usgsM2MService';
import CountyAPI from '../../services/countyAPI';
import '../../utils/leafletFix'; // Import the Leaflet icon fix

// Map layer types
type MapLayerType = 'counties' | 'satellite' | 'ndvi' | 'terrain';

// TODO: Replace with real county GeoJSON data from API
const placeholderGeoJSON: any = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "id": "19169", "name": "Story", "state": "IA", "fips": "19169" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-93.8, 42.1], [-93.4, 42.1], [-93.4, 41.9], [-93.8, 41.9], [-93.8, 42.1]]]
      }
    }
  ]
};

interface FarmMapProps {
  onCountySelect?: (county: County) => void;
  selectedCounty?: County | null;
}

const FarmMap: React.FC<FarmMapProps> = ({ onCountySelect, selectedCounty }) => {
  const [mapLoading, setMapLoading] = useState(true);
  const [currentLayer, setCurrentLayer] = useState<MapLayerType>('terrain');
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [ndviData, setNdviData] = useState<any>(null);
  const [terrainData, setTerrainData] = useState<any>(null);
  const [layerLoading, setLayerLoading] = useState(false);
  
  const center: LatLngExpression = [39.8283, -98.5795]; // Geographic center of US
  const zoom = 5;

  // Simulate map loading for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Load data based on selected layer and county
  useEffect(() => {
    if (selectedCounty) {
      loadLayerData(selectedCounty, currentLayer);
    }
  }, [selectedCounty, currentLayer]);

  const loadLayerData = async (county: County, layer: MapLayerType) => {
    if (!county.coordinates) return;
    
    setLayerLoading(true);
    try {
      const [lat, lon] = county.coordinates;
      
      switch (layer) {
        case 'terrain':
          // Mock terrain data for now
          setTerrainData({ elevation_avg: 320, slope_category: 'gentle', farm_suitability_score: 8.2 });
          break;
        case 'ndvi':
          const ndvi = await usgsM2MService.calculateNDVI(county.fips, lat, lon);
          setNdviData(ndvi);
          break;
        case 'satellite':
          const scenes = await usgsM2MService.searchLandsatScenes(lat, lon);
          setSatelliteData(scenes);
          break;
      }
    } catch (error) {
      console.error(`Error loading ${layer} data:`, error);
    } finally {
      setLayerLoading(false);
    }
  };

  const handleCountyClick = (feature: any) => {
    // Calculate center coordinates from the feature geometry
    const coords = feature.geometry.coordinates[0];
    const lats = coords.map((coord: number[]) => coord[1]);
    const lons = coords.map((coord: number[]) => coord[0]);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
    
    const county: County = {
      id: feature.properties.id,
      name: feature.properties.name,
      state: feature.properties.state,
      fips: feature.properties.fips,
      coordinates: [centerLat, centerLon]
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
    <div className="w-full h-full relative" style={{ backgroundColor: '#f0f0f0' }}>
      {/* Debug info */}
      <div className="absolute top-2 left-2 z-[2000] bg-red-500 text-white p-1 text-xs">
        Layer: {currentLayer} | Loading: {mapLoading ? 'Yes' : 'No'}
      </div>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ 
          height: '100%', 
          width: '100%',
          zIndex: 1,
          position: 'relative'
        }}
        zoomControl={true}
      >
        {/* Base Layer - changes based on selected layer */}
        {currentLayer === 'terrain' ? (
          <TileLayer
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            key="terrain"
            maxZoom={17}
          />
        ) : currentLayer === 'satellite' ? (
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}
        
        {/* County boundaries overlay - only show if we have real data */}
        {currentLayer === 'counties' && (
          <GeoJSON 
            data={placeholderGeoJSON}
            style={getCountyStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      
      {/* Layer Control Panel */}
      <div className="absolute top-4 right-4 z-[2000] bg-white rounded-lg shadow-lg p-3 border">
        <h4 className="font-medium text-gray-900 mb-3">Map Layers</h4>
        <div className="space-y-2">
          {[
            { key: 'counties', label: '🗺️ Counties', desc: 'County boundaries' },
            { key: 'satellite', label: '🛰️ Satellite', desc: 'Landsat imagery' },
            { key: 'ndvi', label: '🌱 NDVI', desc: 'Crop health' },
            { key: 'terrain', label: '🏔️ Terrain', desc: 'Elevation data' }
          ].map((layer) => (
            <button
              key={layer.key}
              onClick={() => setCurrentLayer(layer.key as MapLayerType)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                currentLayer === layer.key
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              disabled={layerLoading}
            >
              <div className="font-medium">{layer.label}</div>
              <div className="text-xs opacity-75">{layer.desc}</div>
            </button>
          ))}
        </div>
        
        {layerLoading && (
          <div className="mt-3 text-center">
            <div className="text-xs text-gray-500">Loading satellite data...</div>
          </div>
        )}
        
        {terrainData && currentLayer === 'terrain' && (
          <div className="mt-3 p-2 bg-amber-50 rounded text-xs">
            <div className="font-medium text-amber-900">Terrain Data</div>
            <div className="text-amber-700">
              Elevation: {terrainData.elevation_avg?.toFixed(0)}m<br/>
              Slope: {terrainData.slope_category}<br/>
              Suitability: {terrainData.farm_suitability_score?.toFixed(1)}/10
            </div>
          </div>
        )}
        
        {ndviData && currentLayer === 'ndvi' && (
          <div className="mt-3 p-2 bg-green-50 rounded text-xs">
            <div className="font-medium text-green-900">NDVI Data</div>
            <div className="text-green-700">
              Health: {ndviData.vegetation_health}<br/>
              Average: {ndviData.ndvi_avg?.toFixed(2)}
            </div>
          </div>
        )}
        
        {satelliteData && currentLayer === 'satellite' && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
            <div className="font-medium text-blue-900">Satellite Data</div>
            <div className="text-blue-700">
              Scenes: {satelliteData.length}<br/>
              Latest: {satelliteData[0]?.acquisitionDate}
            </div>
          </div>
        )}
      </div>

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
