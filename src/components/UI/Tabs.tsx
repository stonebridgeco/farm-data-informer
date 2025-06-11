import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  className
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  
  const handleTabChange = (tabId: string) => {
    if (tabs.find(t => t.id === tabId)?.disabled) return;
    setActiveTab(tabId);
    onChange?.(tabId);
  };
  
  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;
  
  const getTabClasses = (tab: Tab) => {
    const baseClasses = 'px-4 py-2 font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500';
    const isActive = tab.id === activeTab;
    const isDisabled = tab.disabled;
    
    if (variant === 'pills') {
      return cn(
        baseClasses,
        'rounded-lg',
        isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100',
        isDisabled && 'opacity-50 cursor-not-allowed'
      );
    }
    
    if (variant === 'underline') {
      return cn(
        baseClasses,
        'border-b-2 rounded-none',
        isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900',
        isDisabled && 'opacity-50 cursor-not-allowed'
      );
    }
    
    // Default variant
    return cn(
      baseClasses,
      'border rounded-t-lg',
      isActive ? 'border-gray-300 border-b-white bg-white text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50',
      isDisabled && 'opacity-50 cursor-not-allowed'
    );
  };
  
  return (
    <div className={cn('w-full', className)}>
      {/* Tab Headers */}
      <div className={cn(
        'flex',
        variant === 'default' && 'border-b border-gray-300',
        variant === 'underline' && 'border-b border-gray-200',
        variant === 'pills' && 'bg-gray-100 p-1 rounded-lg'
      )}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={getTabClasses(tab)}
            disabled={tab.disabled}
          >
            <div className="flex items-center space-x-2">
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className={cn(
        'mt-4',
        variant === 'default' && 'border border-gray-300 border-t-0 rounded-b-lg p-4 bg-white'
      )}>
        {activeTabContent}
      </div>
    </div>
  );
};

export default Tabs;
