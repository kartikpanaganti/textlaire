import React, { useState } from 'react';
import { FaUserCheck, FaCalendarAlt, FaPlus, FaChartBar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Attendance = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="responsive-container with-scroll">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <FaUserCheck className="mr-2 text-blue-500" /> Attendance Management
        </h1>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <FaCalendarAlt className="text-blue-500 dark:text-blue-400 mr-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus /> Add Record
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

export default Attendance; 