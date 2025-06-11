import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  variant = 'default',
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  const baseClasses = 'w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  
  const variants = {
    default: 'border-gray-300 bg-white',
    filled: 'border-gray-200 bg-gray-50 focus:bg-white'
  };
  
  const paddingClasses = cn(
    'px-3 py-2',
    leftIcon && 'pl-10',
    rightIcon && 'pr-10'
  );
  
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{leftIcon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            baseClasses,
            variants[variant],
            paddingClasses,
            error && 'border-red-300 focus:ring-red-500',
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{rightIcon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
