import { useState, useEffect } from 'react';
import { FaTimes, FaUserCheck, FaUserTimes, FaClock, FaCalendarAlt, FaBuilding, FaHome, FaStickyNote } from 'react-icons/fa';

const AttendanceForm = ({ onSubmit, onClose, editRecord, employees }) => {
  const [formData, setFormData] = useState({
    employeeId: editRecord?.employeeId._id || '',
    status: editRecord?.status || 'Present',
    checkIn: editRecord?.checkIn || '',
    checkOut: editRecord?.checkOut || '',
    date: editRecord?.date || new Date().toLocaleDateString('en-CA'),
    shift: editRecord?.shift || '',
    breakTime: editRecord?.breakTime || '',
    overtime: editRecord?.overtime || 0,
    workFromHome: editRecord?.workFromHome || false,
    notes: editRecord?.notes || '',
    location: editRecord?.location || { lat: 0, lng: 0 }
  });

  // Check if dark mode is enabled
  const isDarkMode = document.documentElement.classList.contains('dark');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Quick status buttons
  const handleQuickStatus = (status) => {
    setFormData(prev => ({
      ...prev,
      status
    }));
  };

  // Quick time presets
  const applyTimePreset = (preset) => {
    let checkIn = '';
    let checkOut = '';

    switch(preset) {
      case 'morning':
        checkIn = '09:00';
        checkOut = '17:00';
        break;
      case 'afternoon':
        checkIn = '13:00';
        checkOut = '21:00';
        break;
      case 'night':
        checkIn = '21:00';
        checkOut = '05:00';
        break;
      default:
        break;
    }

    setFormData(prev => ({
      ...prev,
      checkIn,
      checkOut
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-800 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          {editRecord ? (
            <>
              <FaUserCheck className="text-blue-500" />
              Edit Attendance
            </>
          ) : (
            <>
              <FaUserCheck className="text-green-500" />
              Add Attendance
            </>
          )}
        </h2>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
          aria-label="Close"
        >
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Employee Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Employee
          </label>
          <select
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Select Employee</option>
            {employees.map(employee => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Selection with Quick Buttons */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              type="button"
              onClick={() => handleQuickStatus('Present')}
              className={`px-3 py-2 rounded-md text-sm flex items-center justify-center gap-1 transition-colors
                ${formData.status === 'Present' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            >
              <FaUserCheck /> Present
            </button>
            <button
              type="button"
              onClick={() => handleQuickStatus('Absent')}
              className={`px-3 py-2 rounded-md text-sm flex items-center justify-center gap-1 transition-colors
                ${formData.status === 'Absent' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            >
              <FaUserTimes /> Absent
            </button>
            <button
              type="button"
              onClick={() => handleQuickStatus('Late')}
              className={`px-3 py-2 rounded-md text-sm flex items-center justify-center gap-1 transition-colors
                ${formData.status === 'Late' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            >
              <FaClock /> Late
            </button>
            <button
              type="button"
              onClick={() => handleQuickStatus('On Leave')}
              className={`px-3 py-2 rounded-md text-sm flex items-center justify-center gap-1 transition-colors
                ${formData.status === 'On Leave' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            >
              <FaCalendarAlt /> On Leave
            </button>
          </div>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="On Leave">On Leave</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>

        {/* Time Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Check In
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                name="checkIn"
                value={formData.checkIn}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={formData.status === 'Absent' || formData.status === 'On Leave'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Check Out
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                name="checkOut"
                value={formData.checkOut}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={formData.status === 'Absent' || formData.status === 'On Leave'}
              />
            </div>
          </div>
        </div>

        {/* Quick Time Presets */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick Time Presets
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyTimePreset('morning')}
              className="px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md text-sm flex-1 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
              disabled={formData.status === 'Absent' || formData.status === 'On Leave'}
            >
              Morning (9-5)
            </button>
            <button
              type="button"
              onClick={() => applyTimePreset('afternoon')}
              className="px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md text-sm flex-1 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
              disabled={formData.status === 'Absent' || formData.status === 'On Leave'}
            >
              Afternoon (1-9)
            </button>
            <button
              type="button"
              onClick={() => applyTimePreset('night')}
              className="px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md text-sm flex-1 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
              disabled={formData.status === 'Absent' || formData.status === 'On Leave'}
            >
              Night (9-5)
            </button>
          </div>
        </div>

        {/* Date and Shift */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Shift
            </label>
            <select
              name="shift"
              value={formData.shift}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="Day">Day</option>
              <option value="Night">Night</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>
        </div>

        {/* Work From Home */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="workFromHome"
            id="workFromHome"
            checked={formData.workFromHome}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label htmlFor="workFromHome" className="ml-2 block text-sm text-gray-900 dark:text-gray-300 flex items-center gap-1">
            <FaHome className="text-blue-500" /> Work From Home
          </label>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <FaStickyNote className="text-yellow-500" /> Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows="3"
          />
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 flex items-center gap-1"
          >
            <FaUserCheck />
            {editRecord ? 'Update' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttendanceForm;
