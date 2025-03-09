// AttendanceAnalytics.jsx
import { useMemo, useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { FaSync, FaUserCheck, FaUserTimes, FaUserClock, FaCalendarCheck } from 'react-icons/fa';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const AttendanceAnalytics = ({ 
  attendanceData, 
  isDarkMode, 
  dateRange = 'today', 
  departmentFilter = 'all',
  onRefresh 
}) => {
  const chartContainerRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(180);
  const [chartWidth, setChartWidth] = useState(0);

  // Calculate chart dimensions based on container size
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const updateDimensions = () => {
      const containerWidth = chartContainerRef.current.offsetWidth;
      
      // Set chart dimensions based on container size
      setChartWidth(containerWidth);
      
      // Adjust height based on screen size
      const screenHeight = window.innerHeight;
      if (screenHeight < 800) {
        setChartHeight(160);
      } else if (screenHeight < 1000) {
        setChartHeight(180);
      } else {
        setChartHeight(200);
      }
    };

    // Initial update
    updateDimensions();

    // Add resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(chartContainerRef.current);
    
    // Also listen for window resize
    window.addEventListener('resize', updateDimensions);

    return () => {
      if (chartContainerRef.current) {
        resizeObserver.unobserve(chartContainerRef.current);
      }
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const stats = useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter(record => record.status === "Present").length;
    const absent = attendanceData.filter(record => record.status === "Absent").length;
    const late = attendanceData.filter(record => record.status === "Late").length;
    const onLeave = attendanceData.filter(record => record.status === "On Leave").length;
    const wfh = attendanceData.filter(record => record.workFromHome).length;

    // Calculate percentages
    const presentPercent = total > 0 ? Math.round((present / total) * 100) : 0;
    const absentPercent = total > 0 ? Math.round((absent / total) * 100) : 0;
    const latePercent = total > 0 ? Math.round((late / total) * 100) : 0;
    const leavePercent = total > 0 ? Math.round((onLeave / total) * 100) : 0;
    const wfhPercent = present > 0 ? Math.round((wfh / present) * 100) : 0;

    return { 
      total, present, absent, late, onLeave, wfh,
      presentPercent, absentPercent, latePercent, leavePercent, wfhPercent
    };
  }, [attendanceData]);

  const pieChartData = {
    labels: ['Present', 'Absent', 'Late', 'On Leave'],
    datasets: [{
      data: [stats.present, stats.absent, stats.late, stats.onLeave],
      backgroundColor: [
        'rgba(75, 192, 192, 0.7)',  // Present - Green
        'rgba(255, 99, 132, 0.7)',   // Absent - Red
        'rgba(255, 206, 86, 0.7)',   // Late - Yellow
        'rgba(153, 102, 255, 0.7)',  // Leave - Purple
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    }],
  };

  const barChartData = {
    labels: ['Present', 'Absent', 'Late', 'On Leave'],
    datasets: [{
      label: 'Attendance Count',
      data: [stats.present, stats.absent, stats.late, stats.onLeave],
      backgroundColor: [
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(153, 102, 255, 0.7)',
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { 
          boxWidth: 8, 
          font: { size: 9 },
          color: isDarkMode ? '#e5e7eb' : '#4b5563',
          padding: 5
        } 
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: isDarkMode ? '#e5e7eb' : '#1f2937',
        bodyColor: isDarkMode ? '#e5e7eb' : '#4b5563',
        borderColor: isDarkMode ? '#475569' : '#e5e7eb',
        borderWidth: 1,
        padding: 4,
        boxPadding: 2,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      title: {
        display: true,
        text: `${dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}`,
        color: isDarkMode ? '#e5e7eb' : '#1f2937',
        font: { size: 10, weight: 'bold' },
        padding: { top: 2, bottom: 5 }
      }
    },
  };

  const pieChartOptions = {
    ...chartOptions,
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Status Distribution'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          stepSize: 1, 
          font: { size: 8 },
          color: isDarkMode ? '#e5e7eb' : '#4b5563',
        },
        grid: { 
          display: true,
          color: isDarkMode ? 'rgba(71, 85, 105, 0.2)' : 'rgba(229, 231, 235, 0.5)',
        }
      },
      x: {
        ticks: { 
          font: { size: 8 },
          color: isDarkMode ? '#e5e7eb' : '#4b5563',
        },
        grid: { 
          display: false 
        }
      }
    },
  };

  // Format date range for display
  const getDateRangeText = () => {
    switch(dateRange) {
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      default: return 'Today';
    }
  };

  // Format department filter for display
  const getDepartmentText = () => {
    if (departmentFilter === 'all') return 'All Departments';
    return departmentFilter.charAt(0).toUpperCase() + departmentFilter.slice(1);
  };

  return (
    <div className="flex flex-col w-full h-full" ref={chartContainerRef}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm flex items-center">
          <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900 mr-2">
            <FaUserCheck className="text-blue-600 dark:text-blue-400" size={12} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-800 dark:text-white">Present</h3>
            <div className="flex items-baseline">
              <p className="text-base font-bold text-blue-600 dark:text-blue-400">{stats.present}</p>
              <p className="ml-1 text-xs text-gray-500 dark:text-gray-400">{stats.presentPercent}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm flex items-center">
          <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900 mr-2">
            <FaUserTimes className="text-red-600 dark:text-red-400" size={12} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-800 dark:text-white">Absent</h3>
            <div className="flex items-baseline">
              <p className="text-base font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
              <p className="ml-1 text-xs text-gray-500 dark:text-gray-400">{stats.absentPercent}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm flex items-center">
          <div className="p-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900 mr-2">
            <FaUserClock className="text-yellow-600 dark:text-yellow-400" size={12} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-800 dark:text-white">Late</h3>
            <div className="flex items-baseline">
              <p className="text-base font-bold text-yellow-600 dark:text-yellow-400">{stats.late}</p>
              <p className="ml-1 text-xs text-gray-500 dark:text-gray-400">{stats.latePercent}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm flex items-center">
          <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900 mr-2">
            <FaCalendarCheck className="text-purple-600 dark:text-purple-400" size={12} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-800 dark:text-white">On Leave</h3>
            <div className="flex items-baseline">
              <p className="text-base font-bold text-purple-600 dark:text-purple-400">{stats.onLeave}</p>
              <p className="ml-1 text-xs text-gray-500 dark:text-gray-400">{stats.leavePercent}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">{getDateRangeText()}</span> • 
          <span className="ml-1">{getDepartmentText()}</span> • 
          <span className="ml-1">Total: {stats.total}</span>
        </div>
        <button 
          onClick={onRefresh}
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <FaSync size={8} /> Refresh
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm h-full">
          <div className="chart-container h-full">
            <Pie 
              data={pieChartData} 
              options={pieChartOptions} 
            />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm h-full">
          <div className="chart-container h-full">
            <Bar 
              data={barChartData} 
              options={barChartOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceAnalytics;