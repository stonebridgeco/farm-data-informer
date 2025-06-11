import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  shadow = 'md',
  border = true,
  hover = false
}) => {
  const baseClasses = 'bg-white rounded-lg';
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };
  
  return (
    <div
      className={cn(
        baseClasses,
        paddings[padding],
        shadows[shadow],
        border && 'border border-gray-200',
        hover && 'hover:shadow-lg transition-shadow duration-200',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
