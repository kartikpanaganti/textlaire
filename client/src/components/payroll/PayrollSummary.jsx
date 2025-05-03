import React from 'react';
import { FaUsers, FaMoneyBillWave, FaFileInvoiceDollar, FaExclamationTriangle } from 'react-icons/fa';

const PayrollSummary = ({ data }) => {
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  // Safety check - if data is not provided, don't render
  if (!data) return null;

  const {
    totalEmployees,
    processedCount,
    pendingCount,
    processingCount,
    paidCount,
    failedCount,
    notProcessedCount,
    totalPayroll,
    totalNetPayout,
    totalDeductions,
    month,
    year
  } = data;

  // Calculate percentages
  const processedPercentage = totalEmployees > 0 ? Math.round((processedCount / totalEmployees) * 100) : 0;
  const completionPercentage = processedCount > 0 ? Math.round((paidCount / processedCount) * 100) : 0;

  // Stats data
  const stats = [
    {
      id: 1,
      title: 'Employees',
      value: totalEmployees,
      subtext: `${processedCount} payrolls processed (${processedPercentage}%)`,
      icon: <FaUsers className="text-blue-500 dark:text-blue-400" />,
      color: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      id: 2,
      title: 'Total Payroll',
      value: formatCurrency(totalPayroll),
      subtext: `${formatCurrency(totalNetPayout)} net payout`,
      icon: <FaMoneyBillWave className="text-green-500 dark:text-green-400" />,
      color: 'bg-green-100 dark:bg-green-900'
    },
    {
      id: 3,
      title: 'Payment Status',
      value: `${paidCount} / ${processedCount} Paid`,
      subtext: `${completionPercentage}% complete`,
      icon: <FaFileInvoiceDollar className="text-purple-500" />,
      color: 'bg-purple-100'
    },
    {
      id: 4,
      title: 'Pending Actions',
      value: notProcessedCount > 0 ? `${notProcessedCount} not generated` : 'All Generated',
      subtext: pendingCount > 0 ? `${pendingCount} payments pending` : 'No pending payments',
      icon: <FaExclamationTriangle className="text-amber-500" />,
      color: 'bg-amber-100'
    }
  ];

  // Payment status distribution data for the progress bars
  const statusDistribution = [
    {
      name: 'Paid',
      value: paidCount,
      total: processedCount,
      color: 'bg-green-500'
    },
    {
      name: 'Processing',
      value: processingCount,
      total: processedCount,
      color: 'bg-blue-500'
    },
    {
      name: 'Pending',
      value: pendingCount,
      total: processedCount,
      color: 'bg-yellow-500'
    },
    {
      name: 'Failed',
      value: failedCount,
      total: processedCount,
      color: 'bg-red-500'
    }
  ];

  const getMonthName = (monthNum) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNum - 1];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Payroll Summary - {getMonthName(month)} {year}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.id} className={`${stat.color} p-4 rounded-lg flex items-start`}>
            <div className="mr-4 p-3 rounded-full bg-white">{stat.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-lg font-semibold mt-1">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-md font-medium text-gray-700 mb-3">Payment Status Distribution</h3>
        <div className="space-y-3">
          {statusDistribution.map((status) => (
            <div key={status.name} className="flex items-center">
              <span className="text-sm w-24 text-gray-600">{status.name}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2.5 mx-4">
                <div
                  className={`h-2.5 rounded-full ${status.color}`}
                  style={{ width: `${status.total > 0 ? (status.value / status.total) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 min-w-[4rem] text-right">
                {status.value} / {status.total}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PayrollSummary;
