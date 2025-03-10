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
  onRefresh,
  containerHeight
}) => {
  const chartContainerRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(180);
  const [chartWidth, setChartWidth] = useState(0);

  // Calculate chart dimensions based on container size and available height
  useEffect(() => {
    // Define updateDimensions inside useEffect to avoid stale ref issues
    const updateDimensions = () => {
      // Safely check if the ref is available
      if (!chartContainerRef.current) return;
      
      try {
        const containerWidth = chartContainerRef.current.offsetWidth;
        
        // Set chart dimensions based on container size
        setChartWidth(containerWidth);
        
        // Adjust height based on provided containerHeight or screen size
        if (containerHeight) {
          // If containerHeight is provided, use it to calculate chart height
          // Reserve space for other elements (summary cards, etc.)
          const reservedSpace = 80; // Further reduced from 100 to make charts bigger
          const availableHeight = containerHeight - reservedSpace;
          // Increase the chart height by using a larger portion of available height
          const calculatedHeight = Math.max(220, Math.min(availableHeight / 1.5, 400)); // Increased from 180, 1.8, and 350
          setChartHeight(calculatedHeight);
        } else {
          // Fallback to screen-based sizing if containerHeight not provided
          const screenHeight = window.innerHeight;
          if (screenHeight < 800) {
            setChartHeight(220); // Increased from 180
          } else if (screenHeight < 1000) {
            setChartHeight(260); // Increased from 220
          } else {
            setChartHeight(300); // Increased from 250
          }
        }
      } catch (error) {
        console.error("Error updating chart dimensions:", error);
        // Set default values if there's an error
        setChartWidth(window.innerWidth > 768 ? 500 : 300);
        setChartHeight(260); // Increased from 220
      }
    };

    // Initial update - only if ref is available
    if (chartContainerRef.current) {
      updateDimensions();
    }

    // Add resize observer - only if ref is available
    let resizeObserver;
    if (chartContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        // Call updateDimensions via setTimeout to ensure it runs after the DOM has updated
        setTimeout(updateDimensions, 0);
      });
      resizeObserver.observe(chartContainerRef.current);
    }
    
    // Also listen for window resize
    window.addEventListener('resize', updateDimensions);

    return () => {
      // Clean up resize observer
      if (resizeObserver) {
        if (chartContainerRef.current) {
          resizeObserver.unobserve(chartContainerRef.current);
        }
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateDimensions);
    };
  }, [containerHeight]);

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
        },
        // Limit legend items to prevent overflow
        maxItems: 4,
        // Ensure legend fits within container
        maxWidth: chartWidth ? chartWidth - 20 : 300,
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
    // Ensure layout fits within container
    layout: {
      padding: {
        left: 5,
        right: 5,
        top: 5,
        bottom: 5
      }
    }
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
    <div className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden responsive-height-container" ref={chartContainerRef}>
      {/* Summary Cards - Make them more compact to allow more space for charts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-1 responsive-height-header">
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm flex items-center reduce-padding-on-small-height">
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
        
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm flex items-center reduce-padding-on-small-height">
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
        
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm flex items-center reduce-padding-on-small-height">
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
        
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm flex items-center reduce-padding-on-small-height">
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

      {/* Charts Section - Make this scrollable if needed but prevent horizontal scrolling */}
      <div className="flex flex-col md:flex-row gap-2 flex-1 overflow-y-auto overflow-x-hidden responsive-height-content">
        {/* Attendance Status Distribution */}
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 reduce-padding-on-small-height">
          <h3 className="text-xs font-semibold mb-0 text-gray-800 dark:text-white compact-on-small-height">Status Distribution</h3>
          <div className="chart-container w-full" style={{ 
            height: `${chartHeight}px`, 
            maxHeight: containerHeight ? `${containerHeight / 1.5}px` : '400px', // Increased from 1.8 and 350px
            minWidth: 0,
            minHeight: '260px' // Increased from 220px
          }}>
            <Pie data={pieChartData} options={{
              ...pieChartOptions,
              maintainAspectRatio: false,
              responsive: true
            }} />
          </div>
        </div>
        
        {/* Department Distribution */}
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 reduce-padding-on-small-height">
          <h3 className="text-xs font-semibold mb-0 text-gray-800 dark:text-white compact-on-small-height">Department Breakdown</h3>
          <div className="chart-container w-full" style={{ 
            height: `${chartHeight}px`, 
            maxHeight: containerHeight ? `${containerHeight / 1.5}px` : '400px', // Increased from 1.8 and 350px
            minWidth: 0,
            minHeight: '260px' // Increased from 220px
          }}>
            <Bar data={barChartData} options={{
              ...barChartOptions,
              maintainAspectRatio: false,
              responsive: true
            }} />
          </div>
        </div>
      </div>
      
      {/* Additional Analytics Section - Hide on smaller screens to give more space to charts */}
      <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto overflow-x-hidden hide-on-small-height">
        {/* Additional analytics content can go here */}
      </div>
    </div>
  );
};

export default AttendanceAnalytics;