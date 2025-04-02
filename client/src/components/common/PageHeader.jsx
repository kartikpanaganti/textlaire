import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeProvider';

const PageHeader = ({ title, description, actions }) => {
  const { theme } = useContext(ThemeContext);
  
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </div>
      {description && (
        <p className={`text-sm md:text-base ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {description}
        </p>
      )}
    </div>
  );
};

export default PageHeader; 