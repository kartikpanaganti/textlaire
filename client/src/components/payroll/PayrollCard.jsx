import React from 'react';
import { motion } from 'framer-motion';
import { FaFileDownload, FaMoneyBillWave, FaEye, FaTrash } from 'react-icons/fa';

const PayrollCard = ({ 
  payroll, 
  onSelect, 
  onGenerate, 
  onUpdateStatus, 
  onDelete,
  selected,
  handleSelectItem
}) => {
  // Function to format currency
  const formatCurrency = (amount) => {
    const numericValue = parseFloat(amount || 0);
    return `₹${numericValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Function to get status badge style
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-50';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-50';
      case 'Processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-50';
      case 'Failed':
        return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-50';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-50';
    }
  };

  // Get month name
  const getMonthName = (monthNum) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[parseInt(monthNum) - 1] || 'Unknown';
  };

  // Attendance calculation
  const attendancePercentage = payroll.daysPresent / payroll.totalWorkingDays * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
    >
      {/* Card Header with Selection */}
      <div className="relative">
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => handleSelectItem(payroll._id)}
            className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-500 transition duration-150 ease-in-out"
          />
        </div>
        <div className="h-12 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800" />
        <div className="flex justify-between items-center px-4 py-2 -mt-6">
          <div className="bg-white dark:bg-gray-700 rounded-full shadow px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            {payroll.month}/{payroll.year} • {getMonthName(payroll.month)}
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeClass(payroll.paymentStatus)}`}>
            {payroll.paymentStatus}
          </span>
        </div>
      </div>

      {/* Employee Info */}
      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-medium mr-3">
            {payroll.employeeDetails?.name?.substring(0, 2).toUpperCase() || 'N/A'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{payroll.employeeDetails?.name || 'Unknown Employee'}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{payroll.employeeDetails?.department || 'No Department'}</p>
          </div>
        </div>

        {/* Salary Details */}
        <div className="mt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">Basic Salary</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(payroll.originalSalary || payroll.basicSalary)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">Allowances</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatCurrency(payroll.totalAllowances)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">Deductions</span>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">-{formatCurrency(payroll.totalDeductions)}</span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Salary</span>
              <span className="text-base font-bold text-green-600 dark:text-green-400">{formatCurrency(payroll.netSalary)}</span>
            </div>
          </div>
        </div>

        {/* Attendance Data */}
        <div className="mt-3">
          <div className="relative pt-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex justify-between">
              <span>Attendance</span>
              <span>{Math.round(attendancePercentage)}% ({payroll.daysPresent}/{payroll.totalWorkingDays} days)</span>
            </div>
            <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
              <div style={{ width: `${attendancePercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 dark:bg-blue-600"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onSelect(payroll)}
            className="flex items-center justify-center p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            <FaEye className="mr-1" size={14} /> View
          </button>
          <button
            onClick={() => onGenerate(payroll)}
            className="flex items-center justify-center p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
          >
            <FaFileDownload className="mr-1" size={14} /> Payslip
          </button>
          <button
            onClick={() => onUpdateStatus(payroll)}
            className="flex items-center justify-center p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            <FaMoneyBillWave className="mr-1" size={14} /> Pay
          </button>
          <button
            onClick={() => onDelete(payroll._id)}
            className="flex items-center justify-center p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
          >
            <FaTrash className="mr-1" size={14} /> Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PayrollCard;
