import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { differenceInMinutes } from 'date-fns';

// Modify the calculateOvertime function to remove status
const calculateOvertime = (checkIn, checkOut, shift) => {
  if (!checkIn || !checkOut) return { hours: 0, rate: 1.5 };

  // Convert times to Date objects for the current day
  const today = new Date();
  const [startHour, startMinute] = checkIn.split(':').map(Number);
  const [endHour, endMinute] = checkOut.split(':').map(Number);
  
  const startTime = new Date(today.setHours(startHour, startMinute, 0));
  const endTime = new Date(today.setHours(endHour, endMinute, 0));

  // Handle overnight shifts
  if (endTime < startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  // Calculate total hours worked
  const totalMinutes = differenceInMinutes(endTime, startTime);
  const totalHours = totalMinutes / 60;

  // Calculate overtime based on shift type
  let overtime = 0;
  let rate = 1.5; // Default overtime rate

  // Standard working hours
  const standardHours = 8;

  if (shift === 'Night') {
    // Night shift overtime rules
    if (totalHours > standardHours) {
      overtime = totalHours - standardHours;
      if (totalHours > 12) {
        rate = 2.0; // Double time
      }
    }
  } else {
    // Regular shift overtime rules
    if (totalHours > standardHours) {
      overtime = totalHours - standardHours;
      if (totalHours > 12) {
        rate = 2.0; // Double time
      }
    }
  }

  return {
    hours: parseFloat(overtime.toFixed(2)),
    rate: rate,
    totalHours: parseFloat(totalHours.toFixed(2))
  };
};

const formatTime = (time) => {
  if (!time) return '-';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
};

const AttendanceTable = ({ attendance, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check In</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check Out</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Hours</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Overtime</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {attendance && attendance.length > 0 ? (
            attendance.map((record) => {
              // Calculate overtime for this record
              const overtimeDetails = calculateOvertime(record.checkIn, record.checkOut, record.shift);
              
              return (
                <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.employeeId?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatTime(record.checkIn)}
                    {record.status === 'Absent' && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(Absent)</span>
                    )}
                    {record.status === 'On Leave' && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(On Leave)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatTime(record.checkOut)}
                    {record.status === 'Absent' && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(Absent)</span>
                    )}
                    {record.status === 'On Leave' && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(On Leave)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${record.status === "Present" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                        record.status === "Absent" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                          record.status === "Late" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {overtimeDetails.totalHours} hours
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {overtimeDetails.hours > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white">{overtimeDetails.hours} hours</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          overtimeDetails.rate === 2.0 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {overtimeDetails.rate}x
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onEdit(record)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                    >
                      <FaEdit className="inline" />
                    </button>
                    <button
                      onClick={() => onDelete(record._id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      <FaTrash className="inline" />
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No attendance records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;