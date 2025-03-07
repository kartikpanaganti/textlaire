import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const AttendanceForm = ({ onSubmit, onClose, editRecord, employees }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    status: 'Present',
    checkIn: '',
    checkOut: '',
    date: new Date().toISOString().split('T')[0],
    shift: 'Day',
    breakTime: '',
    overtime: 0,
    workFromHome: false,
    notes: '',
    location: { lat: 0, lng: 0 }
  });

  useEffect(() => {
    if (editRecord) {
      setFormData({
        employeeId: editRecord.employeeId._id,
        status: editRecord.status,
        checkIn: editRecord.checkIn,
        checkOut: editRecord.checkOut,
        date: editRecord.date.substring(0, 10),
        shift: editRecord.shift,
        breakTime: editRecord.breakTime,
        overtime: editRecord.overtime,
        workFromHome: editRecord.workFromHome,
        notes: editRecord.notes,
        location: editRecord.location
      });
    }
  }, [editRecord]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {editRecord ? 'Edit Attendance' : 'Add Attendance'}
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Employee</label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Check In</label>
            <input
              type="time"
              name="checkIn"
              value={formData.checkIn}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Check Out</label>
            <input
              type="time"
              name="checkOut"
              value={formData.checkOut}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Shift</label>
            <select
              name="shift"
              value={formData.shift}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Day">Day</option>
              <option value="Night">Night</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="workFromHome"
              checked={formData.workFromHome}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Work From Home</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows="3"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {editRecord ? 'Update' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttendanceForm;
