import React, { useState, useEffect } from 'react';
import { County } from '../../types';

interface AgriculturalDashboardProps {
  selectedCounty: County | null;
  isMobile?: boolean;
}

const AgriculturalDashboard: React.FC<AgriculturalDashboardProps> = ({ 
  selectedCounty 
}) => {
  const [farmData, setFarmData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCounty) {
      fetchFarmData(selectedCounty);
    }
  }, [selectedCounty]);

  const fetchFarmData = async (county: County) => {
    setLoading(true);
    try {
      const data = {
        county: county.name,
        state: county.state,
        cornYield: '211.4 BU/ACRE',
        soybeanYield: '64.1 BU/ACRE',
        temperature: '74°F',
        humidity: '73%'
      };
      setFarmData(data);
    } catch (error) {
      console.error('Error fetching farm data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCounty) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Select a County</h3>
        <p>Click on a county on the map to view agricultural data</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Loading agricultural data for {selectedCounty.name}...</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3>Agricultural Data - {selectedCounty.name}, {selectedCounty.state}</h3>
      
      {farmData && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Corn Yield:</strong> {farmData.cornYield}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Soybean Yield:</strong> {farmData.soybeanYield}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Temperature:</strong> {farmData.temperature}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Humidity:</strong> {farmData.humidity}
          </div>
        </div>
      )}
      
      <button 
        onClick={() => fetchFarmData(selectedCounty)}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Refresh Data
      </button>
    </div>
  );
};

export default AgriculturalDashboard;
