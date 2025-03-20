import { useState } from 'react';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';

const AttendanceTab = ({ employee }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Generate attendance data for the selected month
  const generateAttendanceData = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const attendanceData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      // Generate random attendance status for demonstration
      const status = isWeekend ? 'weekend' : 
        Math.random() > 0.1 ? 'present' : 
        Math.random() > 0.5 ? 'absent' : 'late';

      attendanceData.push({
        date,
        status,
        checkIn: status === 'present' ? '09:00 AM' : null,
        checkOut: status === 'present' ? '05:00 PM' : null,
        hours: status === 'present' ? 8 : 0
      });
    }

    return attendanceData;
  };

  const attendanceData = generateAttendanceData();
  const totalPresent = attendanceData.filter(day => day.status === 'present').length;
  const totalAbsent = attendanceData.filter(day => day.status === 'absent').length;
  const totalLate = attendanceData.filter(day => day.status === 'late').length;
  const totalHours = attendanceData.reduce((sum, day) => sum + day.hours, 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'weekend':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <FiCheckCircle className="w-5 h-5" />;
      case 'absent':
        return <FiXCircle className="w-5 h-5" />;
      case 'late':
        return <FiAlertCircle className="w-5 h-5" />;
      case 'weekend':
        return <FiCalendar className="w-5 h-5" />;
      default:
        return <FiCalendar className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Present Days</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalPresent}</div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <FiXCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Absent Days</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalAbsent}</div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Late Days</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalLate}</div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <FiClock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Hours</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalHours}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selection */}
      <div className="flex items-center gap-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(2000, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option key={i} value={new Date().getFullYear() - i}>
              {new Date().getFullYear() - i}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Calendar */}
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-100 dark:bg-gray-700 p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
          {Array.from({ length: new Date(selectedYear, selectedMonth, 1).getDay() }, (_, i) => (
            <div key={`empty-${i}`} className="bg-white dark:bg-gray-700" />
          ))}
          {attendanceData.map((day, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-gray-700 p-2 min-h-[100px] flex flex-col items-center justify-center gap-1 ${
                day.status === 'weekend' ? 'bg-gray-50 dark:bg-gray-800' : ''
              }`}
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {day.date.getDate()}
              </div>
              <div className={`flex items-center gap-1 ${getStatusColor(day.status)} px-2 py-1 rounded-full text-xs`}>
                {getStatusIcon(day.status)}
                <span className="capitalize">{day.status}</span>
              </div>
              {day.checkIn && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {day.checkIn} - {day.checkOut}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTab; 