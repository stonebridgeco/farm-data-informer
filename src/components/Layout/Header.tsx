import React from 'react';
import { Button, Badge } from '../UI';
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
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg">
            <Tractor className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Farm Data Informer</h1>
            <p className="text-sm text-gray-500">Agricultural Suitability Analysis</p>
          </div>
          <Badge variant="info" size="sm">Beta</Badge>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search counties or regions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onHelpClick}
            leftIcon={<HelpCircle className="w-4 h-4" />}
          >
            Help
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            leftIcon={<Settings className="w-4 h-4" />}
          >
            Settings
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
