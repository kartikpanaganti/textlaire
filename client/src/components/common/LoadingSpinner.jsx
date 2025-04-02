import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'blue' }) => {
  // Size classes
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };
  
  // Color classes
  const colorClasses = {
    blue: 'border-blue-500 border-b-transparent',
    white: 'border-white border-b-transparent',
    gray: 'border-gray-500 border-b-transparent',
    primary: 'border-blue-600 border-b-transparent'
  };
  
  return (
    <div className="flex justify-center items-center">
      <div 
        className={`${sizeClasses[size] || sizeClasses.medium} ${colorClasses[color] || colorClasses.blue} 
        rounded-full border-4 animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner; 