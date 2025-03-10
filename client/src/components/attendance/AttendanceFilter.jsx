import React from 'react';

const AttendanceFilter = ({ onSearch, onStatusFilter }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search by employee name..."
          onChange={(e) => onSearch(e.target.value)}
          className="rounded border-gray-300 w-full px-4 py-2"
        />
      </div>

      <div className="flex-1">
        <select
          onChange={(e) => onStatusFilter(e.target.value)}
          className="rounded border-gray-300 w-full px-4 py-2"
          defaultValue="all"
        >
          <option value="all">All Status</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late</option>
          <option value="On Leave">On Leave</option>
        </select>
      </div>
    </div>
  );
};

export default AttendanceFilter;
