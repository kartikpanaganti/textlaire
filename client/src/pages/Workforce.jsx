import React, { useState } from 'react';
import { FaUsers, FaPlus, FaChartBar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Workforce = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="responsive-container with-scroll">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <FaUsers className="mr-2 text-blue-500" /> Workforce Management
        </h1>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus /> Add Employee
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          >
            <FaChartBar /> Dashboard
          </button>
        </div>
      </div>
      
      {/* Rest of the component */}
    </div>
  );
};

export default Workforce; 