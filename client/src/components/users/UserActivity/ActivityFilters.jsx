import React, { useState } from 'react';
import { FaFilter, FaSearch, FaCalendarAlt, FaTimes } from 'react-icons/fa';

const ActivityFilters = ({ onApplyFilters, onResetFilters, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || '',
    userId: initialFilters.userId || '',
    userEmail: initialFilters.userEmail || '',
    ipAddress: initialFilters.ipAddress || '',
    deviceType: initialFilters.deviceType || '',
    status: initialFilters.status || ''
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyFilters(filters);
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: '',
      userEmail: '',
      ipAddress: '',
      deviceType: '',
      status: ''
    });
    onResetFilters();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium flex items-center">
          <FaFilter className="mr-2 text-blue-500" />
          Activity Filters
        </h3>
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Basic Filters - Always Visible */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FaCalendarAlt className="inline mr-2 text-gray-500" />
              Start Date
            </label>
            <input
              type="datetime-local"
              name="startDate"
              value={filters.startDate}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FaCalendarAlt className="inline mr-2 text-gray-500" />
              End Date
            </label>
            <input
              type="datetime-local"
              name="endDate"
              value={filters.endDate}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FaSearch className="inline mr-2 text-gray-500" />
              User Email
            </label>
            <input
              type="text"
              name="userEmail"
              value={filters.userEmail}
              onChange={handleChange}
              placeholder="Search by email"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User ID
              </label>
              <input
                type="text"
                name="userId"
                value={filters.userId}
                onChange={handleChange}
                placeholder="Filter by user ID"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IP Address
              </label>
              <input
                type="text"
                name="ipAddress"
                value={filters.ipAddress}
                onChange={handleChange}
                placeholder="e.g. 192.168.1.1"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Device Type
              </label>
              <select
                name="deviceType"
                value={filters.deviceType}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Session Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Sessions</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
                <option value="expired">Expired</option>
                <option value="forced">Forced Logout</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
          >
            <FaTimes className="mr-2" />
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
          >
            <FaSearch className="mr-2" />
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActivityFilters;
