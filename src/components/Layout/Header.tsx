import React from 'react';
import { Search, Settings, HelpCircle, Tractor } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  onSettingsClick,
  onHelpClick
}) => {
  return (
    <header 
      style={{
        background: 'linear-gradient(90deg, #059669 0%, #2563eb 50%, #059669 100%)',
        color: 'white',
        padding: '1rem 1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        minHeight: '80px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
        {/* Logo and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px'
          }}>
            <Tractor style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
              Farm Data Informer
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
              Agricultural Suitability Analysis Platform
            </p>
          </div>
          <span style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            Beta
          </span>
        </div>

        {/* Search Bar */}
        <div style={{ flex: '1', maxWidth: '400px', margin: '0 2rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              width: '16px',
              height: '16px'
            }} />
            <input
              type="text"
              placeholder="Search counties or regions..."
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '8px',
                outline: 'none',
                color: '#374151'
              }}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onHelpClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <HelpCircle style={{ width: '16px', height: '16px' }} />
            Help
          </button>
          <button
            onClick={onSettingsClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <Settings style={{ width: '16px', height: '16px' }} />
            Settings
          </button>
        </div>
      </div>
    </header>
  );
};

export { Header };
