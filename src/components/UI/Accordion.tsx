import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className
}) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen));
  
  const toggleItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item?.disabled) return;
    
    setOpenItems(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(itemId);
      }
      
      return newSet;
    });
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        const isDisabled = item.disabled;
        
        return (
          <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleItem(item.id)}
              disabled={isDisabled}
              className={cn(
                'w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
                isDisabled && 'opacity-50 cursor-not-allowed hover:bg-gray-50'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{item.title}</span>
                <svg
                  className={cn(
                    'w-5 h-5 text-gray-500 transition-transform duration-200',
                    isOpen && 'transform rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {isOpen && (
              <div className="px-4 py-3 bg-white border-t border-gray-200">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
