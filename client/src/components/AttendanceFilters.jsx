// AttendanceFilters.jsx
import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaFilter, FaUndo } from 'react-icons/fa';

const AttendanceFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    department: '',
    position: '',
    shift: '',
    status: '',
    dateRange: { start: null, end: null }
  });
  
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  const DEPARTMENT_OPTIONS = ["Weaving", "Dyeing", "Printing", "Quality Control", "Packaging", "Maintenance"];
  const POSITION_OPTIONS = ["Machine Operator", "Quality Inspector", "Supervisor", "Technician", "Helper"];
  const SHIFT_OPTIONS = ["Morning (6AM-2PM)", "Afternoon (2PM-10PM)", "Night (10PM-6AM)"];
  const STATUS_OPTIONS = ["Present", "Absent", "Late", "On Leave", "Half Day"];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const resetFilters = {
      department: '',
      position: '',
      shift: '',
      status: '',
      dateRange: { start: null, end: null }
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const inputClasses = "w-full px-2 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
  const labelClasses = "block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300";

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center mb-3">
        <FaFilter className="text-blue-500 dark:text-blue-400 mr-2" />
        <h3 className="font-medium text-gray-800 dark:text-white">Filter Attendance Records</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <label className={labelClasses}>Department</label>
          <select 
            className={inputClasses}
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
          >
            <option value="">All Departments</option>
            {DEPARTMENT_OPTIONS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>Position</label>
          <select 
            className={inputClasses}
            value={filters.position}
            onChange={(e) => handleFilterChange('position', e.target.value)}
          >
            <option value="">All Positions</option>
            {POSITION_OPTIONS.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>Shift</label>
          <select 
            className={inputClasses}
            value={filters.shift}
            onChange={(e) => handleFilterChange('shift', e.target.value)}
          >
            <option value="">All Shifts</option>
            {SHIFT_OPTIONS.map(shift => (
              <option key={shift} value={shift}>{shift}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>Status</label>
          <select 
            className={inputClasses}
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>Date Range</label>
          <DatePicker
            selectsRange={true}
            startDate={filters.dateRange.start}
            endDate={filters.dateRange.end}
            onChange={(update) => handleFilterChange('dateRange', {
              start: update[0],
              end: update[1]
            })}
            className={`${inputClasses} ${isDarkMode ? 'dark-datepicker' : ''}`}
            placeholderText="Select date range"
            isClearable
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button 
          onClick={resetFilters}
          className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-md transition-colors flex items-center gap-1"
        >
          <FaUndo size={12} /> Reset Filters
        </button>
      </div>
    </div>
  );
};

export default AttendanceFilters;