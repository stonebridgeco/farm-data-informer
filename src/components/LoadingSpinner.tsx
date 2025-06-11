import React from 'react';
import { cn } from '../utils/cn';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  size = 'md',
  className 
}) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={cn("flex items-center justify-center h-full bg-gray-50", className)}>
      <div className="text-center">
        <div className={cn(
          "animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4",
          sizes[size]
        )}></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
