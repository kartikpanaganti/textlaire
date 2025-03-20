import { useState } from 'react';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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
      // Now potentially present on weekends too (20% chance)
      const status = isWeekend ? 
        (Math.random() > 0.8 ? 'present' : 'weekend') : 
        Math.random() > 0.1 ? 'present' : 
        Math.random() > 0.5 ? 'absent' : 'late';

      attendanceData.push({
        date,
        status,
        isWeekend,
        checkIn: status === 'present' ? '09:00 AM' : status === 'late' ? '10:15 AM' : null,
        checkOut: status === 'present' ? '05:00 PM' : status === 'late' ? '06:30 PM' : null,
        hours: status === 'present' ? 8 : status === 'late' ? 8.25 : 0
      });
    }

    return attendanceData;
  };

  const attendanceData = generateAttendanceData();
  const totalPresent = attendanceData.filter(day => day.status === 'present').length;
  const totalAbsent = attendanceData.filter(day => day.status === 'absent').length;
  const totalLate = attendanceData.filter(day => day.status === 'late').length;
  const totalHours = attendanceData.reduce((sum, day) => sum + day.hours, 0);
  const weekends = attendanceData.filter(day => day.isWeekend).length;
  const weekendPresent = attendanceData.filter(day => day.isWeekend && day.status === 'present').length;
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const workingDays = daysInMonth - weekends + weekendPresent;
  
  const monthName = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' });

  const changeMonth = (increment) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';
      case 'weekend':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-500 dark:bg-green-600';
      case 'absent':
        return 'bg-red-500 dark:bg-red-600';
      case 'late':
        return 'bg-yellow-500 dark:bg-yellow-600';
      default:
        return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'absent':
        return <FiXCircle className="w-4 h-4" />;
      case 'late':
        return <FiAlertCircle className="w-4 h-4" />;
      case 'weekend':
        return <FiCalendar className="w-4 h-4" />;
      default:
        return <FiCalendar className="w-4 h-4" />;
    }
  };

  const getDayAbbreviation = (dayIndex) => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
  };

  // Array of month names for the date picker
  const months = Array.from({ length: 12 }, (_, i) => 
    new Date(2000, i).toLocaleString('default', { month: 'long' })
  );

  // Array of years for the date picker (current year and 4 years back)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-4">
      {/* Calendar Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Date Picker & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-3 mb-3 sm:mb-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{monthName} {selectedYear}</h3>
            <div className="flex items-center shadow-sm rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => changeMonth(-1)}
                className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex bg-white dark:bg-gray-800">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm border-r border-gray-200 dark:border-gray-700 focus:outline-none"
                >
                  {months.map((month, i) => (
                    <option key={i} value={i}>{month}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => changeMonth(1)}
                className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border-l border-gray-200 dark:border-gray-700"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Compact Stats */}
          <div className="flex flex-wrap gap-2 text-xs bg-white dark:bg-gray-900 p-1.5 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-1.5 px-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <span className="text-gray-800 dark:text-gray-200">{workingDays} days</span>
            </div>
            <div className="flex items-center gap-1.5 px-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-gray-800 dark:text-gray-200">{totalPresent} present</span>
            </div>
            <div className="flex items-center gap-1.5 px-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <span className="text-gray-800 dark:text-gray-200">{totalAbsent} absent</span>
            </div>
            <div className="flex items-center gap-1.5 px-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <span className="text-gray-800 dark:text-gray-200">{totalLate} late</span>
            </div>
            <div className="flex items-center gap-1.5 px-1.5">
              <FiClock className="w-3 h-3 text-purple-500 dark:text-purple-400" />
              <span className="text-gray-800 dark:text-gray-200">{totalHours} hrs</span>
            </div>
          </div>
        </div>
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 text-center py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {[0, 1, 2, 3, 4, 5, 6].map(day => (
            <div key={day} className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {getDayAbbreviation(day).substring(0, 3)}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-[1px] p-2 bg-gray-200 dark:bg-gray-700">
          {Array.from({ length: new Date(selectedYear, selectedMonth, 1).getDay() }, (_, i) => (
            <div key={`empty-${i}`} className="min-h-[70px] bg-gray-50 dark:bg-gray-800" />
          ))}
          
          {attendanceData.map((day, index) => (
            <div
              key={index}
              className={`min-h-[70px] p-2 ${
                day.status === 'weekend' ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
              } relative group hover:z-10 border border-transparent ${
                new Date().toDateString() === day.date.toDateString() 
                  ? 'border-blue-500 dark:border-blue-400' 
                  : day.status === 'weekend' 
                    ? 'hover:border-gray-300 dark:hover:border-gray-600' 
                    : 'hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`text-sm font-medium ${
                  day.status === 'weekend' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-200'
                }`}>
                  {day.date.getDate()}
                </div>
                
                {day.status !== 'weekend' ? (
                  <div className={`${getStatusColor(day.status)} text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium border ${
                    day.status === 'present' ? 'border-green-200 dark:border-green-600' : 
                    day.status === 'absent' ? 'border-red-200 dark:border-red-600' :
                    'border-yellow-200 dark:border-yellow-600'
                  }`}>
                    {getStatusIcon(day.status)}
                  </div>
                ) : (
                  <div className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full font-medium border border-gray-300 dark:border-gray-600">
                    W
                  </div>
                )}
              </div>
              
              {/* Weekend indicator */}
              {day.isWeekend && (
                <div className="mt-1 text-[10px] font-medium text-gray-500 dark:text-gray-500 uppercase">
                  Weekend
                </div>
              )}
              
              {/* Today indicator */}
              {new Date().toDateString() === day.date.toDateString() && (
                <div className="absolute inset-0 border-2 border-blue-500 dark:border-blue-400 pointer-events-none rounded-sm"></div>
              )}
              
              {/* Time information (only for days with check-in data) */}
              {day.checkIn && (
                <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 overflow-hidden bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                  <div className="truncate">{day.checkIn}</div>
                </div>
              )}
              
              {/* Hover tooltip */}
              <div className="absolute -top-1 left-full z-30 ml-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-xs w-42 invisible group-hover:visible transition-all duration-200 border border-gray-200 dark:border-gray-600">
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                {day.isWeekend && (
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Weekend Day
                  </div>
                )}
                <div className={`capitalize font-medium ${
                  day.status === 'present' ? 'text-green-600 dark:text-green-400' :
                  day.status === 'absent' ? 'text-red-600 dark:text-red-400' :
                  day.status === 'late' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {day.status}
                </div>
                {day.checkIn && (
                  <div className="mt-2 space-y-1 text-gray-700 dark:text-gray-300 p-1.5 bg-gray-50 dark:bg-gray-700 rounded border border-gray-100 dark:border-gray-600">
                    <div className="flex justify-between">
                      <span>In:</span>
                      <span className="font-medium">{day.checkIn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Out:</span>
                      <span className="font-medium">{day.checkOut}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours:</span>
                      <span className="font-medium">{day.hours}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTab; 