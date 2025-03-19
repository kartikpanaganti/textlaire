import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from 'date-fns';
import { 
  FaCalendarAlt, FaUserCheck, FaChartBar, FaSpinner, 
  FaUsers, FaBoxes, FaMoneyBillWave, FaChartLine, FaTachometerAlt,
  FaUsersCog, FaWarehouse, FaChartPie, FaTh, FaHistory
} from "react-icons/fa";
import AttendanceAnalytics from "../components/dashboard/AttendanceAnalytics";
import { toast } from "react-toastify";
import apiClient from "../api/axiosConfig";

function Dashboard() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateRange, setDateRange] = useState('today');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('attendance');
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );
  const [contentHeight, setContentHeight] = useState(null);
  const dashboardRef = useRef(null);
  const headerRef = useRef(null);

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

  useEffect(() => {
    if (localStorage.getItem("isAuthenticated") !== "true") {
      navigate("/", { replace: true });
    } else {
      fetchAttendanceData();
    }
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    if (activeTab !== 'attendance') return;
    
    setLoading(true);
    try {
      const response = await apiClient.get('/attendance');
      
      // Filter attendance data based on selected filters
      let filteredAttendance = [...response.data];
      
      // Filter by date
      if (dateRange === 'today') {
        filteredAttendance = filteredAttendance.filter(record =>
          record.date.substring(0, 10) === selectedDate
        );
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredAttendance = filteredAttendance.filter(record =>
          new Date(record.date) >= weekAgo
        );
      } else if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filteredAttendance = filteredAttendance.filter(record =>
          new Date(record.date) >= monthAgo
        );
      }
      
      // Filter by department if not 'all'
      if (departmentFilter !== 'all') {
        filteredAttendance = filteredAttendance.filter(record =>
          record.department?.toLowerCase() === departmentFilter
        );
      }
      
      setAttendance(filteredAttendance);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      toast.error("Failed to fetch attendance data");
      
      // Generate mock data for demonstration
      const mockData = generateMockAttendanceData();
      setAttendance(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for demonstration
  const generateMockAttendanceData = () => {
    const departments = ['IT', 'HR', 'Finance', 'Operations', 'Sales'];
    const statuses = ['Present', 'Absent', 'Late', 'On Leave'];
    const mockData = [];
    
    // Generate between 20-50 records
    const count = Math.floor(Math.random() * 30) + 20;
    
    for (let i = 0; i < count; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const workFromHome = status === 'Present' && Math.random() > 0.7;
      
      mockData.push({
        id: i + 1,
        employeeId: `EMP${1000 + i}`,
        name: `Employee ${i + 1}`,
        department,
        status,
        workFromHome,
        checkInTime: status === 'Present' || status === 'Late' ? `0${Math.floor(Math.random() * 3) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
        checkOutTime: status === 'Present' ? `1${Math.floor(Math.random() * 2) + 6}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
        date: selectedDate
      });
    }
    
    return mockData;
  };

  // Fetch attendance data when tab, date, or filters change
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceData();
    }
  }, [activeTab, selectedDate, dateRange, departmentFilter]);

  // Dashboard tabs
  const dashboardTabs = [
    { id: 'attendance', label: 'Attendance', icon: <FaUserCheck /> },
    { id: 'workforce', label: 'Workforce', icon: <FaUsers />, comingSoon: true },
    { id: 'inventory', label: 'Inventory', icon: <FaBoxes />, comingSoon: true },
    { id: 'finance', label: 'Finance', icon: <FaMoneyBillWave />, comingSoon: true },
    { id: 'analytics', label: 'Analytics', icon: <FaChartLine />, comingSoon: true }
  ];

  // Placeholder data for future dashboards
  const placeholderData = {
    workforce: {
      totalEmployees: 125,
      departments: 8,
      newHires: 5,
      onLeave: 3
    },
    inventory: {
      totalItems: 1250,
      categories: 15,
      lowStock: 8,
      recentTransactions: 24
    },
    finance: {
      revenue: '$125,000',
      expenses: '$85,000',
      profit: '$40,000',
      pendingInvoices: 12
    }
  };

  // Calculate available content height
  useEffect(() => {
    const updateContentHeight = () => {
      if (dashboardRef.current && headerRef.current) {
        const viewportHeight = window.innerHeight;
        const headerHeight = headerRef.current.offsetHeight;
        // Reduce margin to give more space to content
        const availableHeight = viewportHeight - headerHeight - 12; // Reduced from 16px
        setContentHeight(availableHeight);
      }
    };

    updateContentHeight();
    window.addEventListener('resize', updateContentHeight);
    
    return () => {
      window.removeEventListener('resize', updateContentHeight);
    };
  }, []);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col h-screen-dynamic responsive-height-container" ref={dashboardRef}>
      {/* Header - Make it more compact */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 m-1 sm:m-2 mb-1 responsive-height-header reduce-padding-on-small-height" ref={headerRef}>
        <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:items-center">
          <div className="flex items-center">
            <FaTh className="text-blue-500 mr-1" /> 
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white compact-on-small-height">
              Management Dashboard
            </h1>
          </div>
          
          {/* Tabs in header */}
          <div className="flex overflow-x-auto sm:ml-4 no-scrollbar">
            {dashboardTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'attendance') {
                    fetchAttendanceData();
                  }
                }}
                className={`px-2 py-0.5 mr-1 rounded-full flex items-center gap-1 text-xs transition-colors relative whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                disabled={tab.comingSoon}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.comingSoon && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded-full text-[0.6rem]">Soon</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content and Side Panel */}
      <div 
        className="flex-1 flex flex-col lg:flex-row gap-2 mx-1 sm:mx-2 mb-1 sm:mb-2 overflow-hidden responsive-height-content reduce-margin-on-small-height"
        style={{ height: contentHeight ? `${contentHeight}px` : 'auto' }}
      >
        {/* Main Dashboard Content */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 overflow-y-auto overflow-x-hidden scrollbar-thin reduce-padding-on-small-height min-w-0">
          {activeTab === 'attendance' && (
            <div className="flex flex-col h-full min-w-0">
              <div className="flex flex-wrap gap-1 justify-between items-center mb-1 responsive-height-header">
                <h2 className="text-base font-semibold flex items-center text-gray-800 dark:text-white compact-on-small-height">
                  <FaChartBar className="mr-1 text-blue-500" /> Attendance Overview
                </h2>
                <div className="flex items-center gap-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt className="text-blue-500 dark:text-blue-400" size={10} />
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs py-0.5 px-1"
                    >
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                    </select>
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs py-0.5 px-1"
                  />
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs py-0.5 px-1"
                  >
                    <option value="all">All Departments</option>
                    <option value="it">IT</option>
                    <option value="hr">HR</option>
                    <option value="finance">Finance</option>
                    <option value="operations">Operations</option>
                    <option value="sales">Sales</option>
                  </select>
                  <button
                    onClick={() => navigate('/attendance')}
                    className="px-1.5 py-0.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 text-xs whitespace-nowrap"
                  >
                    <FaUserCheck size={10} /> Manage
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex items-stretch overflow-y-auto overflow-x-hidden responsive-height-content min-w-0">
                {loading ? (
                  <div className="flex justify-center items-center py-10 w-full">
                    <FaSpinner className="animate-spin text-3xl text-blue-500" />
                  </div>
                ) : attendance.length > 0 ? (
                  <div className="w-full min-w-0">
                    <AttendanceAnalytics 
                      attendanceData={attendance} 
                      isDarkMode={isDarkMode}
                      dateRange={dateRange}
                      departmentFilter={departmentFilter}
                      onRefresh={fetchAttendanceData}
                      containerHeight={contentHeight ? contentHeight - 70 : undefined} // Reduced from 100 to give more space to charts
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-10 w-full">
                    <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-center max-w-lg text-sm">
                      No attendance records found for {selectedDate}. Please select a different date or add attendance records.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workforce Tab */}
          {activeTab === 'workforce' && (
            <div className="flex flex-col h-full">
              <h2 className="text-lg font-semibold flex items-center text-gray-800 dark:text-white mb-3">
                <FaUsers className="mr-2 text-blue-500" /> Workforce Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-white">Employee Distribution</h3>
                  <div className="h-56 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Employee distribution chart will appear here</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-white">Department Overview</h3>
                  <div className="h-56 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Department overview chart will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raw Material Inventory Tab */}
          {activeTab === 'rawmaterialinventory' && (
            <div className="flex flex-col h-full">
              <h2 className="text-lg font-semibold flex items-center text-gray-800 dark:text-white mb-3">
                <FaBoxes className="mr-2 text-blue-500" /> Raw Material Inventory
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-white">Inventory Levels</h3>
                  <div className="h-56 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Inventory levels chart will appear here</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-white">Stock Status</h3>
                  <div className="h-56 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Stock status chart will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel with Activity and Status - Make it narrower */}
        <div className="lg:w-64 flex flex-col gap-2 overflow-hidden min-w-0">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md flex-1 overflow-hidden flex flex-col reduce-padding-on-small-height">
            <h2 className="text-sm font-semibold mb-1 text-gray-800 dark:text-white flex items-center compact-on-small-height">
              <FaHistory className="mr-1 text-blue-500" size={12} /> Recent Activity
            </h2>
            <div className="space-y-1 overflow-y-auto flex-1 scrollbar-thin">
              <div className="border-l-4 border-green-500 pl-2 py-0.5">
                <p className="text-xs text-gray-600 dark:text-gray-300">Today</p>
                <p className="text-xs text-gray-800 dark:text-white">Attendance recorded for {attendance.length} employees</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-2 py-0.5">
                <p className="text-xs text-gray-600 dark:text-gray-300">Yesterday</p>
                <p className="text-xs text-gray-800 dark:text-white">New employee added to the system</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-2 py-0.5">
                <p className="text-xs text-gray-600 dark:text-gray-300">Last Week</p>
                <p className="text-xs text-gray-800 dark:text-white">Monthly attendance report generated</p>
              </div>
            </div>
          </div>
          
          {/* System Status */}
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md reduce-padding-on-small-height">
            <h2 className="text-sm font-semibold mb-1 text-gray-800 dark:text-white flex items-center compact-on-small-height">
              <FaTachometerAlt className="mr-1 text-blue-500" size={12} /> System Status
            </h2>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-700 dark:text-gray-300">Database</span>
                <span className="px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-700 dark:text-gray-300">API Services</span>
                <span className="px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-700 dark:text-gray-300">Notification System</span>
                <span className="px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-700 dark:text-gray-300">Last Update</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;