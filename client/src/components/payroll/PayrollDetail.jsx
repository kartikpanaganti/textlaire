import React, { useState } from 'react';
import { FaFileDownload, FaMoneyBillWave, FaCalendarAlt, FaClock, FaSave } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const PayrollDetail = ({ payroll, onGeneratePayslip, onUpdate }) => {
  const [editedPayroll, setEditedPayroll] = useState(payroll || {});
  const [isSaving, setIsSaving] = useState(false);

  if (!payroll) return null;

  const formatCurrency = (amount) => {
    // Ensure amount is a number and fixed to exactly 2 decimal places
    const numericValue = parseFloat(amount || 0);
    return `₹${numericValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Function to handle payslip generation
  const handleGeneratePayslip = () => {
    onGeneratePayslip(payroll);
  };

  const getMonthName = (monthNum) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNum - 1];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedPayroll({
      ...editedPayroll,
      [name]: value
    });
  };

  // Handle allowance changes
  const handleAllowanceChange = (key, value) => {
    setEditedPayroll({
      ...editedPayroll,
      allowances: {
        ...editedPayroll.allowances,
        [key]: parseFloat(value)
      }
    });
  };

  // Handle deduction changes
  const handleDeductionChange = (category, key, value) => {
    setEditedPayroll({
      ...editedPayroll,
      deductions: {
        ...editedPayroll.deductions,
        [category]: {
          ...editedPayroll.deductions[category],
          [key]: parseFloat(value)
        }
      }
    });
  };

  // Save changes
  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put(`/api/payroll/${editedPayroll._id}`, editedPayroll);
      if (response.data.success) {
        toast.success('Payroll updated successfully');
        if (onUpdate) onUpdate(response.data.data);
      } else {
        toast.error('Failed to update payroll');
      }
    } catch (error) {
      console.error('Error updating payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to update payroll');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Payslip: {getMonthName(payroll.month)} {payroll.year}
          </h3>
          <p className="text-sm text-gray-500">
            Employee: {payroll.employeeDetails?.name || 'N/A'} ({payroll.employeeDetails?.employeeID || 'No ID'})
          </p>
          <p className="text-sm text-gray-500">
            Department: {payroll.employeeDetails?.department || 'N/A'} | Position: {payroll.employeeDetails?.position || 'N/A'}
          </p>
        </div>
        <div className="mt-2 md:mt-0 flex space-x-2">
          <button
            onClick={saveChanges}
            disabled={isSaving}
            className="px-3 py-1.5 bg-green-600 text-white rounded-md flex items-center gap-1 text-sm hover:bg-green-700 disabled:bg-gray-400"
          >
            <FaSave /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleGeneratePayslip}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md flex items-center gap-1 text-sm hover:bg-blue-700"
          >
            <FaFileDownload /> Download Payslip
          </button>
        </div>
      </div>

      {/* Status Information */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="mb-3 sm:mb-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Status</p>
            <div className="mt-1 relative">
              <select 
                name="paymentStatus"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md transition-colors duration-200"
                value={editedPayroll.paymentStatus || 'Pending'}
                onChange={handleInputChange}
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
          <div className="mb-3 sm:mb-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</p>
            <div className="mt-1 relative">
              <select 
                name="paymentMethod"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md transition-colors duration-200"
                value={editedPayroll.paymentMethod || 'Bank Transfer'}
                onChange={handleInputChange}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Digital Wallet">Digital Wallet</option>
                <option value="UPI">UPI</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="mb-3 sm:mb-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Date</p>
            <div className="mt-1">
              <input 
                type="date" 
                name="paymentDate"
                className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md transition-colors duration-200"
                value={editedPayroll.paymentDate ? new Date(editedPayroll.paymentDate).toISOString().split('T')[0] : ''}
                onChange={handleInputChange}
              />
              {!editedPayroll.paymentDate && <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">Not paid yet</p>}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payroll Generated On</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{formatDate(payroll.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Main payroll details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Earnings */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Earnings</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Basic Salary</span>
              <div className="flex items-center">
                <input 
                  type="number" 
                  name="basicSalary"
                  className="w-24 text-right text-sm font-medium border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={editedPayroll.basicSalary}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>
            </div>
            
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Allowances</h5>
            {Object.entries(editedPayroll.allowances || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center pl-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    value={value}
                    onChange={(e) => handleAllowanceChange(key, e.target.value)}
                    step="0.01"
                  />
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overtime</span>
                <div className="flex items-center ml-2">
                  <input 
                    type="number" 
                    className="w-12 text-center text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    value={editedPayroll.overtime?.hours || 0}
                    onChange={(e) => {
                      setEditedPayroll({
                        ...editedPayroll,
                        overtime: {
                          ...editedPayroll.overtime,
                          hours: parseFloat(e.target.value)
                        }
                      });
                    }}
                    step="0.5"
                  />
                  <span className="mx-1 text-xs text-gray-500 dark:text-gray-400">hrs @</span>
                  <input 
                    type="number" 
                    className="w-16 text-center text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    value={editedPayroll.overtime?.rate || 1.5}
                    onChange={(e) => {
                      setEditedPayroll({
                        ...editedPayroll,
                        overtime: {
                          ...editedPayroll.overtime,
                          rate: parseFloat(e.target.value)
                        }
                      });
                    }}
                    step="0.1"
                  />
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">/hr</span>
                </div>
              </div>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={(editedPayroll.overtime?.amount || 0).toFixed(2)}
                onChange={(e) => {
                  setEditedPayroll({
                    ...editedPayroll,
                    overtime: {
                      ...editedPayroll.overtime,
                      amount: parseFloat(e.target.value)
                    }
                  });
                }}
                step="0.01"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bonus</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.bonus || 0}
                onChange={(e) => {
                  setEditedPayroll({
                    ...editedPayroll,
                    bonus: parseFloat(e.target.value)
                  });
                }}
                step="0.01"
              />
            </div>
            
            <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Gross Earnings</span>
              <span className="text-base font-bold text-gray-800 dark:text-white">{formatCurrency(editedPayroll.grossSalary)}</span>
            </div>
          </div>
        </div>
        
        {/* Right column - Deductions */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Deductions</h4>
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Statutory Deductions</h5>
            {Object.entries(editedPayroll.deductions?.statutory || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center pl-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <input 
                  type="number" 
                  className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={value}
                  onChange={(e) => handleDeductionChange('statutory', key, e.target.value)}
                  step="0.01"
                />
              </div>
            ))}
            
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Other Deductions</h5>
            {Object.entries(editedPayroll.deductions?.other || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center pl-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <input 
                  type="number" 
                  className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={value}
                  onChange={(e) => handleDeductionChange('other', key, e.target.value)}
                  step="0.01"
                />
              </div>
            ))}
            
            <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Deductions</span>
              <span className="text-base font-bold text-gray-800 dark:text-white">{formatCurrency(editedPayroll.totalDeductions)}</span>
            </div>
            
            <div className="mt-5 pt-3 border-t-2 border-gray-300 dark:border-gray-600 flex justify-between items-center">
              <span className="text-base font-medium text-gray-800 dark:text-gray-200">Net Salary</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(editedPayroll.netSalary)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Remarks section */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">Payment Remarks</h4>
        <textarea
          name="remarks"
          value={editedPayroll.remarks || ''}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
          placeholder="Add any payment remarks or notes here..."
        />
      </div>
    </div>
  );
};

export default PayrollDetail;
