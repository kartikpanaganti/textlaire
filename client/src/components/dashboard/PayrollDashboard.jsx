import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCheckCircle, FaHourglassHalf, FaFileInvoiceDollar, FaDownload, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const PayrollDashboard = () => {
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i
  );

  useEffect(() => {
    fetchPayrollData();
  }, [filter]);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/payroll/summary?month=${filter.month}&year=${filter.year}`);
      if (response.data.success) {
        setPayrollData(response.data.data);
      } else {
        setError("Failed to load payroll data");
        // Generate mock data if API fails
        setPayrollData(generateMockData());
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      setError("Error loading payroll data");
      // Generate mock data if API fails
      setPayrollData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    // Generate some realistic mock data for demonstration
    return {
      totalPayroll: 1245000,
      paidAmount: 980000,
      pendingAmount: 265000,
      totalEmployees: 85,
      paymentStatusCount: {
        Paid: 65,
        Pending: 15,
        Processing: 3,
        Failed: 2
      },
      departmentBreakdown: [
        { department: 'Engineering', amount: 540000 },
        { department: 'Sales', amount: 230000 },
        { department: 'Marketing', amount: 180000 },
        { department: 'HR', amount: 120000 },
        { department: 'Finance', amount: 175000 }
      ],
      recentPayments: [
        { employeeId: 'EMP1001', name: 'John Doe', amount: 85000, date: '2025-04-28', status: 'Paid' },
        { employeeId: 'EMP1024', name: 'Jane Smith', amount: 78000, date: '2025-04-28', status: 'Paid' },
        { employeeId: 'EMP1042', name: 'Bob Johnson', amount: 92000, date: '2025-04-27', status: 'Paid' },
        { employeeId: 'EMP1056', name: 'Alice Williams', amount: 88000, date: '2025-04-26', status: 'Paid' }
      ],
      pendingPayments: [
        { employeeId: 'EMP1010', name: 'Mike Brown', amount: 76000, status: 'Pending' },
        { employeeId: 'EMP1018', name: 'Sarah Davis', amount: 81000, status: 'Pending' },
        { employeeId: 'EMP1033', name: 'Chris Wilson', amount: 71000, status: 'Processing' }
      ]
    };
  };

  // Prepare chart data for status breakdown
  const statusChartData = {
    labels: payrollData ? Object.keys(payrollData.paymentStatusCount) : [],
    datasets: [
      {
        data: payrollData ? Object.values(payrollData.paymentStatusCount) : [],
        backgroundColor: [
          '#10B981', // Green for Paid
          '#F59E0B', // Yellow for Pending
          '#3B82F6', // Blue for Processing
          '#EF4444'  // Red for Failed
        ],
        borderWidth: 1
      }
    ]
  };

  // Prepare chart data for department breakdown
  const departmentChartData = {
    labels: payrollData ? payrollData.departmentBreakdown.map(item => item.department) : [],
    datasets: [
      {
        label: 'Department Payroll Amount',
        data: payrollData ? payrollData.departmentBreakdown.map(item => item.amount) : [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }
    ]
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: parseInt(value)
    }));
  };

  const exportToExcel = () => {
    // In a real app, this would generate an Excel file with payroll data
    alert('This would download an Excel file with the current payroll data');
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
            name="month"
            value={filter.month}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
          <select
            name="year"
            value={filter.year}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
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
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Payroll</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{payrollData ? formatCurrency(payrollData.totalPayroll) : 'N/A'}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <FaMoneyBillWave className="text-green-500 dark:text-green-400 text-xl" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{payrollData ? payrollData.totalEmployees : 0} employees</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Paid Amount</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{payrollData ? formatCurrency(payrollData.paidAmount) : 'N/A'}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FaCheckCircle className="text-blue-500 dark:text-blue-400 text-xl" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {payrollData ? Math.round((payrollData.paidAmount / payrollData.totalPayroll) * 100) : 0}% of total
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Amount</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{payrollData ? formatCurrency(payrollData.pendingAmount) : 'N/A'}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <FaHourglassHalf className="text-yellow-500 dark:text-yellow-400 text-xl" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {payrollData && payrollData.pendingPayments ? payrollData.pendingPayments.length : 0} payrolls pending
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Salary</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {payrollData && payrollData.totalEmployees ? 
                  formatCurrency(payrollData.totalPayroll / payrollData.totalEmployees) : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <FaFileInvoiceDollar className="text-purple-500 dark:text-purple-400 text-xl" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Company average</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Payment Status</h3>
          <div className="h-64">
            {payrollData ? (
              <Doughnut 
                data={statusChartData} 
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
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Department Breakdown</h3>
          <div className="h-64">
            {payrollData ? (
              <Bar 
                data={departmentChartData} 
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

      {/* Recent Payments and Pending Payments Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Payments</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payrollData && payrollData.recentPayments ? (
                  payrollData.recentPayments.map((payment, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{payment.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{payment.employeeId}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(payment.date), 'dd MMM yyyy')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">No recent payments</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Pending Payments</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payrollData && payrollData.pendingPayments ? (
                  payrollData.pendingPayments.map((payment, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{payment.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{payment.employeeId}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">No pending payments</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollDashboard;
