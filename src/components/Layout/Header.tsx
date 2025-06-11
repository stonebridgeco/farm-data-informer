import React, { useState, useEffect } from 'react';
import { Search, Settings, HelpCircle, Tractor, Menu, X } from 'lucide-react';

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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <header 
      style={{
        background: 'linear-gradient(90deg, #059669 0%, #2563eb 50%, #059669 100%)',
        color: 'white',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        minHeight: '80px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
        {/* Logo and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '32px' : '40px',
            height: isMobile ? '32px' : '40px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px'
          }}>
            <Tractor style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ 
              fontSize: isMobile ? '1rem' : '1.25rem', 
              fontWeight: 'bold', 
              color: 'white', 
              margin: 0 
            }}>
              farm data informer
            </h1>
            {!isMobile && (
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                Agricultural Suitability Analysis Platform
              </p>
            )}
          </div>
          <span style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: isMobile ? '0.625rem' : '0.75rem',
            fontWeight: '500'
          }}>
            Beta
          </span>
        </div>

        {/* Desktop Search Bar and Actions */}
        {!isMobile && (
          <>
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
          </>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: 'none',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobile && mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'rgba(59, 130, 246, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 50,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Mobile Search */}
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
              placeholder="Search counties..."
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

          {/* Mobile Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                onHelpClick?.();
                setMobileMenuOpen(false);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              <HelpCircle style={{ width: '16px', height: '16px' }} />
              Help
            </button>
            <button
              onClick={() => {
                onSettingsClick?.();
                setMobileMenuOpen(false);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
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
      )}
    </header>
  );
};

export { Header };
