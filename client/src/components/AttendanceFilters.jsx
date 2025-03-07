import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AttendanceFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    department: '',
    position: '',
    shift: '',
    status: '',
    dateRange: {
      start: null,
      end: null
    }
  });

  const DEPARTMENT_OPTIONS = ["Weaving", "Dyeing", "Printing", "Quality Control", "Packaging", "Maintenance"];
  const POSITION_OPTIONS = ["Machine Operator", "Quality Inspector", "Supervisor", "Technician", "Helper"];
  const SHIFT_OPTIONS = ["Morning (6AM-2PM)", "Afternoon (2PM-10PM)", "Night (10PM-6AM)"];
  const STATUS_OPTIONS = ["Present", "Absent", "Late", "On Leave"];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <select 
            className="w-full border rounded-lg p-2"
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
          <label className="block text-sm font-medium mb-1">Position</label>
          <select 
            className="w-full border rounded-lg p-2"
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
          <label className="block text-sm font-medium mb-1">Shift</label>
          <select 
            className="w-full border rounded-lg p-2"
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
          <label className="block text-sm font-medium mb-1">Status</label>
          <select 
            className="w-full border rounded-lg p-2"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date Range</label>
          <DatePicker
            selectsRange={true}
            startDate={filters.dateRange.start}
            endDate={filters.dateRange.end}
            onChange={(update) => handleFilterChange('dateRange', {
              start: update[0],
              end: update[1]
            })}
            className="w-full border rounded-lg p-2"
            placeholderText="Select date range"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button 
          onClick={() => {
            const resetFilters = {
              department: '',
              position: '',
              shift: '',
              status: '',
              dateRange: { start: null, end: null }
            };
            setFilters(resetFilters);
            onFilterChange(resetFilters);
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default AttendanceFilters;
