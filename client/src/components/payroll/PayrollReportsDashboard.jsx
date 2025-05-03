import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { FaDownload, FaCalendarAlt, FaBuilding, FaChartPie, FaChartBar, FaChartLine, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const PayrollReportsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'), // Jan 1st of current year
    endDate: format(new Date(), 'yyyy-MM-dd'), // Today
  });
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  // List of departments (should be fetched from API in production)
  const departments = [
    { value: '', label: 'All Departments' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'HR', label: 'HR' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Customer Support', label: 'Customer Support' },
    { value: 'Product', label: 'Product' },
    { value: 'Design', label: 'Design' },
    { value: 'Research', label: 'Research' },
    { value: 'Legal', label: 'Legal' },
    { value: 'Inventory & Raw Materials', label: 'Inventory & Raw Materials' }
  ];

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedDepartment]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/payroll/reports', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          department: selectedDepartment
        }
      });

      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        toast.error('Failed to fetch report data: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error(error.response?.data?.message || 'An error occurred while fetching reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (!reportData) return;

    try {
      const payrollData = reportData.payrolls.map(p => ({
        'Employee ID': p.employeeDetails.employeeID,
        'Employee Name': p.employeeDetails.name,
        'Department': p.employeeDetails.department,
        'Position': p.employeeDetails.position,
        'Month': p.month,
        'Year': p.year,
        'Basic Salary': p.basicSalary,
        'Allowances': Object.values(p.allowances).reduce((sum, val) => sum + val, 0),
        'Deductions': Object.values(p.deductions).reduce((sum, val) => sum + val, 0),
        'Bonus': p.bonus,
        'Tax': p.deductions.incomeTax,
        'Net Salary': p.netSalary,
        'Payment Status': p.paymentStatus,
        'Payment Date': p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(payrollData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payroll Report');

      // Generate filename with date range
      const fileName = `Payroll_Report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Report exported as ${fileName}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export report to Excel');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no data yet
  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
        <FaChartPie className="text-5xl mb-4" />
        <p>No report data available. Please adjust filters and try again.</p>
      </div>
    );
  }

  // Chart data preparation for department distribution
  const departmentChartData = {
    labels: Object.keys(reportData.analytics.salaryByDepartment),
    datasets: [
      {
        label: 'Total Salary by Department',
        data: Object.values(reportData.analytics.salaryByDepartment).map(d => d.total),
        backgroundColor: [
          '#4299e1', '#48bb78', '#f6ad55', '#f56565', '#9f7aea',
          '#ed64a6', '#38b2ac', '#667eea', '#f687b3', '#68d391',
          '#c53030', '#4fd1c5', '#9f7aea'
        ],
        hoverOffset: 4
      }
    ]
  };

  // Chart data for monthly trend
  const trendChartData = {
    labels: reportData.analytics.salaryTrend.map(t => t.period),
    datasets: [
      {
        label: 'Total Salary',
        data: reportData.analytics.salaryTrend.map(t => t.totalSalary),
        borderColor: '#4299e1',
        backgroundColor: 'rgba(66, 153, 225, 0.2)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Tax Deductions',
        data: reportData.analytics.salaryTrend.map(t => t.taxes),
        borderColor: '#f56565',
        backgroundColor: 'rgba(245, 101, 101, 0.2)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Bonus',
        data: reportData.analytics.salaryTrend.map(t => t.bonus),
        borderColor: '#48bb78',
        backgroundColor: 'rgba(72, 187, 120, 0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  // Chart data for payment status distribution
  const paymentStatusChartData = {
    labels: Object.keys(reportData.analytics.paymentStatusDistribution),
    datasets: [
      {
        label: 'Payment Status',
        data: Object.values(reportData.analytics.paymentStatusDistribution),
        backgroundColor: [
          '#48bb78', // Paid - Green
          '#f6ad55', // Pending - Orange
          '#f56565', // Failed - Red
          '#4299e1'  // Processing - Blue
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">
          Payroll Reports & Analytics
        </h2>
        
        {/* Export button */}
        <button
          onClick={handleExportToExcel}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
        >
          <FaFileExcel className="mr-2" />
          Export to Excel
        </button>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCalendarAlt className="text-gray-400" />
            </div>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCalendarAlt className="text-gray-400" />
            </div>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Department
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaBuilding className="text-gray-400" />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            >
              {departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500'}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'departments' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500'}`}
          onClick={() => setActiveTab('departments')}
        >
          Departments
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'trends' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500'}`}
          onClick={() => setActiveTab('trends')}
        >
          Salary Trends
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Total Payroll</h3>
                <p className="text-3xl font-bold">₹{reportData.analytics.totalPayroll.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p className="text-sm mt-2">{reportData.analytics.totalEmployees} employees</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Average Salary</h3>
                <p className="text-3xl font-bold">₹{reportData.analytics.avgSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p className="text-sm mt-2">Per employee</p>
              </div>
              
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Tax Deductions</h3>
                <p className="text-3xl font-bold">₹{reportData.analytics.taxDeductions.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p className="text-sm mt-2">Total for period</p>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Bonus Distributed</h3>
                <p className="text-3xl font-bold">₹{reportData.analytics.bonusDistributed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p className="text-sm mt-2">Total incentives</p>
              </div>
            </div>

            {/* Payment Status Chart */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Payment Status Distribution</h3>
              <div className="h-72 w-full">
                <Pie data={paymentStatusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
              </div>
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Salary Distribution by Department</h3>
              <div className="h-80 w-full">
                <Pie data={departmentChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employees</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Payroll</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Average Salary</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(reportData.analytics.salaryByDepartment).map(([dept, data]) => (
                    <tr key={dept} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{dept}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{data.employees}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{data.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{data.average.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Monthly Salary, Tax & Bonus Trend</h3>
              <div className="h-80 w-full">
                <Line data={trendChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Average Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tax Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bonus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employees</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.analytics.salaryTrend.map((trend) => (
                    <tr key={trend.period} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{trend.period}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{trend.totalSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{trend.averageSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{trend.taxes.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{trend.bonus.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{trend.employees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollReportsDashboard;
