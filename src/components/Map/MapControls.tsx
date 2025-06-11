import React from 'react';
import { County } from '../../types';

interface MapControlsProps {
  selectedCounty: County | null;
  onClearSelection: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ selectedCounty, onClearSelection }) => {
  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-xs">
      <h3 className="font-semibold text-gray-900 mb-2">Map Controls</h3>
      
      {selectedCounty ? (
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h4 className="font-medium text-blue-900">{selectedCounty.name}</h4>
            <p className="text-sm text-blue-700">{selectedCounty.state}</p>
            <p className="text-xs text-blue-600">FIPS: {selectedCounty.fips}</p>
          </div>
          
          <button
            onClick={onClearSelection}
            className="w-full btn-secondary text-sm"
          >
            Clear Selection
          </button>
          
          <button className="w-full btn-primary text-sm">
            Analyze Suitability
          </button>
        </div>
      ) : (
        <div className="text-gray-600 text-sm">
          <p className="mb-3">Click on a county to view details and analyze farm suitability.</p>
          
          <div className="bg-gray-50 border rounded p-3 mb-3">
            <h4 className="font-medium text-gray-800 mb-2">Sample Counties:</h4>
            <ul className="text-xs space-y-1">
              <li>• Harris County, TX (Urban/Suburban)</li>
              <li>• Fresno County, CA (Central Valley)</li>
              <li>• Story County, IA (Corn Belt)</li>
              <li>• Wayne County, NY (Apple Region)</li>
            </ul>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-green-600 rounded mr-2"></div>
              <span>Available Counties</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span>Selected County</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapControls;
