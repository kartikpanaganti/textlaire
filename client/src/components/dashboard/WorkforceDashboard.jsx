import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaUsersCog, FaUserTie, FaUserClock, FaCalendarAlt, 
  FaChartPie, FaBuilding, FaMoneyBillWave, FaDownload, FaFilter 
} from 'react-icons/fa';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { format, differenceInYears, differenceInMonths } from 'date-fns';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const WorkforceDashboard = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    department: '',
    status: ''
  });

  const departments = [
    { value: '', label: 'All Departments' },
    { value: 'Production', label: 'Production' },
    { value: 'Quality Control', label: 'Quality Control' },
    { value: 'Inventory & Raw Materials', label: 'Inventory & Raw Materials' },
    { value: 'Workforce & HR', label: 'Workforce & HR' },
    { value: 'Sales & Marketing', label: 'Sales & Marketing' },
    { value: 'Finance & Accounts', label: 'Finance & Accounts' },
    { value: 'Maintenance', label: 'Maintenance' }
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'On Leave', label: 'On Leave' },
    { value: 'Terminated', label: 'Terminated' }
  ];

  useEffect(() => {
    fetchEmployeeData();
  }, [filter]);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      let url = '/api/employees';
      if (filter.department || filter.status) {
        url += '?';
        if (filter.department) url += `department=${encodeURIComponent(filter.department)}&`;
        if (filter.status) url += `status=${encodeURIComponent(filter.status)}`;
      }
      
      const response = await axios.get(url);
      processEmployeeData(response.data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Error loading employee data");
      // Generate mock data if API fails
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const processEmployeeData = (employees) => {
    if (!employees || !Array.isArray(employees)) {
      setError("Invalid employee data received");
      generateMockData();
      return;
    }

    // Calculate various metrics
    const totalEmployees = employees.length;
    
    // Department distribution
    const departmentCounts = {};
    departments.forEach(dept => {
      if (dept.value) departmentCounts[dept.value] = 0;
    });
    
    employees.forEach(emp => {
      if (emp.department) {
        departmentCounts[emp.department] = (departmentCounts[emp.department] || 0) + 1;
      }
    });

    // Work type distribution
    const workTypeCounts = {
      'Full-time': 0,
      'Part-time': 0,
      'Contract': 0,
      'Temporary': 0,
      'Intern': 0
    };
    
    employees.forEach(emp => {
      if (emp.workType) {
        workTypeCounts[emp.workType] = (workTypeCounts[emp.workType] || 0) + 1;
      } else {
        workTypeCounts['Full-time'] += 1; // Default to full-time if not specified
      }
    });

    // Position distribution (top 5)
    const positionCounts = {};
    employees.forEach(emp => {
      if (emp.position) {
        positionCounts[emp.position] = (positionCounts[emp.position] || 0) + 1;
      }
    });
    
    const topPositions = Object.entries(positionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    // Experience levels
    const experienceLevels = {
      'Less than 1 year': 0,
      '1-3 years': 0,
      '3-5 years': 0,
      '5+ years': 0
    };
    
    const now = new Date();
    employees.forEach(emp => {
      if (emp.joiningDate) {
        const joinDate = new Date(emp.joiningDate);
        const years = differenceInYears(now, joinDate);
        
        if (years < 1) experienceLevels['Less than 1 year'] += 1;
        else if (years < 3) experienceLevels['1-3 years'] += 1;
        else if (years < 5) experienceLevels['3-5 years'] += 1;
        else experienceLevels['5+ years'] += 1;
      }
    });

    // Salary distribution and averages
    const salaryData = {
      totalSalary: 0,
      averageSalary: 0,
      medianSalary: 0,
      salaryRanges: {
        'Less than 20k': 0,
        '20k-30k': 0,
        '30k-50k': 0,
        '50k-80k': 0,
        '80k+': 0
      },
      departmentAvgSalaries: {}
    };
    
    // Calculate department averages and salary distribution
    const departmentSalaries = {};
    departments.forEach(dept => {
      if (dept.value) departmentSalaries[dept.value] = [];
    });
    
    employees.forEach(emp => {
      if (emp.salary) {
        salaryData.totalSalary += emp.salary;
        
        // Salary ranges
        if (emp.salary < 20000) salaryData.salaryRanges['Less than 20k'] += 1;
        else if (emp.salary < 30000) salaryData.salaryRanges['20k-30k'] += 1;
        else if (emp.salary < 50000) salaryData.salaryRanges['30k-50k'] += 1;
        else if (emp.salary < 80000) salaryData.salaryRanges['50k-80k'] += 1;
        else salaryData.salaryRanges['80k+'] += 1;
        
        // Department salaries
        if (emp.department && departmentSalaries[emp.department]) {
          departmentSalaries[emp.department].push(emp.salary);
        }
      }
    });
    
    salaryData.averageSalary = salaryData.totalSalary / totalEmployees;
    
    // Calculate department average salaries
    Object.entries(departmentSalaries).forEach(([dept, salaries]) => {
      if (salaries.length > 0) {
        salaryData.departmentAvgSalaries[dept] = salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;
      } else {
        salaryData.departmentAvgSalaries[dept] = 0;
      }
    });
    
    // Calculate median salary
    const allSalaries = employees.map(emp => emp.salary).filter(s => s).sort((a, b) => a - b);
    const midPoint = Math.floor(allSalaries.length / 2);
    if (allSalaries.length % 2 === 0) {
      salaryData.medianSalary = (allSalaries[midPoint - 1] + allSalaries[midPoint]) / 2;
    } else {
      salaryData.medianSalary = allSalaries[midPoint];
    }

    // Recent hires (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentHires = employees
      .filter(emp => new Date(emp.joiningDate) >= threeMonthsAgo)
      .sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate))
      .slice(0, 5)
      .map(emp => ({
        id: emp.employeeID,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        joiningDate: emp.joiningDate
      }));

    // Set the processed data
    setEmployeeData({
      totalEmployees,
      departmentCounts,
      workTypeCounts,
      topPositions,
      experienceLevels,
      salaryData,
      recentHires
    });
  };

  const generateMockData = () => {
    // Generate mock data for demonstration
    setEmployeeData({
      totalEmployees: 125,
      departmentCounts: {
        'Production': 38,
        'Quality Control': 15,
        'Inventory & Raw Materials': 12,
        'Workforce & HR': 8,
        'Sales & Marketing': 22,
        'Finance & Accounts': 14,
        'Maintenance': 16
      },
      workTypeCounts: {
        'Full-time': 95,
        'Part-time': 12,
        'Contract': 10,
        'Temporary': 5,
        'Intern': 3
      },
      topPositions: {
        'Machine Operator': 25,
        'Sales Executive': 18,
        'Textile Worker': 15,
        'Quality Inspector': 12,
        'Accountant': 10
      },
      experienceLevels: {
        'Less than 1 year': 28,
        '1-3 years': 45,
        '3-5 years': 32,
        '5+ years': 20
      },
      salaryData: {
        totalSalary: 7500000,
        averageSalary: 60000,
        medianSalary: 55000,
        salaryRanges: {
          'Less than 20k': 8,
          '20k-30k': 17,
          '30k-50k': 38,
          '50k-80k': 42,
          '80k+': 20
        },
        departmentAvgSalaries: {
          'Production': 45000,
          'Quality Control': 52000,
          'Inventory & Raw Materials': 48000,
          'Workforce & HR': 62000,
          'Sales & Marketing': 68000,
          'Finance & Accounts': 72000,
          'Maintenance': 56000
        }
      },
      recentHires: [
        { id: '125', name: 'John Smith', department: 'Production', position: 'Machine Operator', joiningDate: '2025-03-20' },
        { id: '124', name: 'Sarah Johnson', department: 'Sales & Marketing', position: 'Sales Executive', joiningDate: '2025-03-15' },
        { id: '123', name: 'Michael Brown', department: 'Finance & Accounts', position: 'Accountant', joiningDate: '2025-03-01' },
        { id: '122', name: 'Emily Davis', department: 'Workforce & HR', position: 'HR Executive', joiningDate: '2025-02-22' },
        { id: '121', name: 'Robert Wilson', department: 'Production', position: 'Textile Worker', joiningDate: '2025-02-15' }
      ]
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const exportToExcel = () => {
    // In a real app, this would generate an Excel file with employee data
    alert('This would download an Excel file with the current employee data');
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <FaFilter className="text-gray-500" />
          <select
            name="department"
            value={filter.department}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {departments.map(dept => (
              <option key={dept.value} value={dept.value}>{dept.label}</option>
            ))}
          </select>
          <select
            name="status"
            value={filter.status}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {statuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          <FaDownload /> Export to Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{employeeData ? employeeData.totalEmployees : 0}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FaUsers className="text-blue-500 dark:text-blue-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Salary</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {employeeData ? formatCurrency(employeeData.salaryData.averageSalary) : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <FaMoneyBillWave className="text-green-500 dark:text-green-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Departments</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {employeeData ? Object.keys(employeeData.departmentCounts).length : 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <FaBuilding className="text-purple-500 dark:text-purple-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Recent Hires</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {employeeData ? employeeData.recentHires.length : 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <FaUserClock className="text-orange-500 dark:text-orange-400 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Department Distribution</h3>
          <div className="h-64">
            {employeeData ? (
              <Doughnut 
                data={{
                  labels: Object.keys(employeeData.departmentCounts),
                  datasets: [{
                    data: Object.values(employeeData.departmentCounts),
                    backgroundColor: [
                      '#3B82F6', // blue
                      '#10B981', // green
                      '#F59E0B', // amber
                      '#EC4899', // pink
                      '#8B5CF6', // violet
                      '#6366F1', // indigo
                      '#EF4444'  // red
                    ],
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
                      }
                    }
                  }
                }}
              />
            ) : <p>No data available</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Salary by Department</h3>
          <div className="h-64">
            {employeeData ? (
              <Bar 
                data={{
                  labels: Object.keys(employeeData.salaryData.departmentAvgSalaries),
                  datasets: [{
                    label: 'Average Salary',
                    data: Object.values(employeeData.salaryData.departmentAvgSalaries),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(value);
                        },
                        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
                      },
                      grid: {
                        color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      }
                    },
                    x: {
                      ticks: {
                        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
                      },
                      grid: {
                        color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      }
                    }
                  }
                }}
              />
            ) : <p>No data available</p>}
          </div>
        </div>
      </div>

      {/* Employee Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Experience Levels</h3>
          <div className="h-64">
            {employeeData ? (
              <Doughnut 
                data={{
                  labels: Object.keys(employeeData.experienceLevels),
                  datasets: [{
                    data: Object.values(employeeData.experienceLevels),
                    backgroundColor: [
                      '#10B981', // green
                      '#3B82F6', // blue
                      '#F59E0B', // amber
                      '#EC4899'  // pink
                    ],
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
                      }
                    }
                  }
                }}
              />
            ) : <p>No data available</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Work Type Distribution</h3>
          <div className="h-64">
            {employeeData ? (
              <Doughnut 
                data={{
                  labels: Object.keys(employeeData.workTypeCounts),
                  datasets: [{
                    data: Object.values(employeeData.workTypeCounts),
                    backgroundColor: [
                      '#3B82F6', // blue
                      '#F59E0B', // amber
                      '#EC4899', // pink
                      '#8B5CF6', // violet
                      '#10B981'  // green
                    ],
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
                      }
                    }
                  }
                }}
              />
            ) : <p>No data available</p>}
          </div>
        </div>
      </div>

      {/* Recent Hires */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Hires</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joining Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {employeeData && employeeData.recentHires ? (
                employeeData.recentHires.map((employee, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{employee.id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{employee.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{employee.department}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{employee.position}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(employee.joiningDate), 'dd MMM yyyy')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">No recent hires</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkforceDashboard;
