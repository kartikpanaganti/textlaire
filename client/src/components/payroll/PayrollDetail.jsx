import React, { useState, useEffect } from 'react';
import { FaFileDownload, FaMoneyBillWave, FaCalendarAlt, FaClock, FaSave, FaLock, FaUnlock } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const PayrollDetail = ({ payroll, onGeneratePayslip, onUpdate, isAdmin = false }) => {
  // Helper to get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };
  
  // Apply initial fixes to attendance data
  const fixedPayroll = payroll ? {
    ...payroll,
    attendanceSummary: {
      ...payroll.attendanceSummary,
      totalWorkingDays: getDaysInMonth(payroll.month, payroll.year)
    }
  } : {};
  
  // Ensure payroll has all necessary properties initialized
  const initializedPayroll = {
    ...fixedPayroll,
    basicSalary: fixedPayroll?.basicSalary || 5999,
    grossSalary: fixedPayroll?.grossSalary || 1857.75,
    netSalary: fixedPayroll?.netSalary || 494.40,
    allowances: {
      houseRent: 2399.6,
      medical: 599.9,
      travel: 299.95,
      food: 299.95,
      special: 0,
      other: 0,
      ...(fixedPayroll?.allowances || {})
    },
    deductions: {
      professionalTax: 150,
      incomeTax: 0, 
      providentFund: 719.88,
      healthInsurance: 299.95,
      loanRepayment: 0,
      absentDeduction: 0,
      lateDeduction: 193.52,
      other: 0,
      ...(fixedPayroll?.deductions || {})
    },
    overtime: {
      hours: 0,
      rate: 1.5,
      amount: 0,
      ...(fixedPayroll?.overtime || {})
    },
    bonus: 0,
    leaveDeduction: 0,
    ...(fixedPayroll || {})
  };
  
  const [editedPayroll, setEditedPayroll] = useState(initializedPayroll || {});
  const [isSaving, setIsSaving] = useState(false);
  const [adminOverride, setAdminOverride] = useState(false);
  const [originalPayroll, setOriginalPayroll] = useState(initializedPayroll || {});

  if (!payroll) return null;

  // Check if payroll is editable based on status
  const isEditable = () => {
    // If admin override is enabled, always allow editing
    if (adminOverride && isAdmin) return true;
    return !['Processing', 'Paid'].includes(editedPayroll.paymentStatus);
  };

  const formatCurrency = (amount) => {
    // Ensure amount is a number and fixed to exactly 2 decimal places
    const numericValue = parseFloat(amount || 0);
    return `₹${numericValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Function to toggle admin override
  const toggleAdminOverride = () => {
    if (!isAdmin) {
      toast.error('Only administrators can override locked payrolls');
      return;
    }
    setAdminOverride(!adminOverride);
    toast.success(adminOverride ? 'Admin override disabled' : 'Admin override enabled - you can now edit locked payrolls');
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
    // Allow all changes regardless of status
    setEditedPayroll({
      ...editedPayroll,
      [name]: value
    });
  };

  // Handle allowance changes
  const handleAllowanceChange = (key, value) => {
    // Allow all changes regardless of status
    setEditedPayroll({
      ...editedPayroll,
      allowances: {
        ...editedPayroll.allowances,
        [key]: parseFloat(value)
      }
    });
  };

  // Handle deduction changes
  const handleDeductionChange = (key, value) => {
    console.log(`Updating deduction: ${key} to ${value}`);
    
    // Create deductions object if it doesn't exist
    if (!editedPayroll.deductions) {
      editedPayroll.deductions = {};
    }
    
    // Allow all changes regardless of status
    setEditedPayroll({
      ...editedPayroll,
      deductions: {
        ...editedPayroll.deductions,
          [key]: parseFloat(value)
        }
    });
    
    // Log the updated state after change
    setTimeout(() => {
      console.log("Updated deductions:", editedPayroll.deductions);
    }, 100);
  };

  // Handle leave deduction change
  const handleLeaveDeductionChange = (value) => {
    // Allow all changes regardless of status
    setEditedPayroll({
      ...editedPayroll,
      leaveDeduction: parseFloat(value)
    });
  };

  // Handle Late Deduction specifically
  const handleLateDeductionChange = (value) => {
    console.log(`Directly updating lateDeduction to: ${value}`);
    
    // Create a new object with updated late deduction
    const updatedPayroll = { 
      ...editedPayroll,
      deductions: {
        ...(editedPayroll.deductions || {}),
        lateDeduction: parseFloat(value || 0)
      }
    };
    
    // Set state with new object
    setEditedPayroll(updatedPayroll);
    
    // Log the change
    console.log("Payroll updated with new lateDeduction:", updatedPayroll.deductions);
  };

  // Calculate total deductions
  const calculateTotalDeductions = () => {
    let total = 0;
    
    // Sum up all deductions from deductions object
    if (editedPayroll.deductions) {
      console.log("Calculating deductions from:", editedPayroll.deductions);
      Object.entries(editedPayroll.deductions).forEach(([key, value]) => {
        console.log(`Adding deduction: ${key} = ${value}`);
        total += parseFloat(value || 0);
      });
    }
    
    // Add leave deduction
    total += parseFloat(editedPayroll.leaveDeduction || 0);
    
    console.log("Total deductions calculated:", total.toFixed(2));
    return total.toFixed(2);
  };

  // Calculate net salary
  const calculateNetSalary = () => {
    const grossSalary = parseFloat(editedPayroll.grossSalary || 0);
    const totalDeductions = parseFloat(calculateTotalDeductions());
    return (grossSalary - totalDeductions).toFixed(2);
  };

  // Calculate prorated salary based on days worked
  const calculateProratedSalary = (payrollData = editedPayroll) => {
    // Get actual days in the month
    const daysInMonth = getDaysInMonth(payrollData.month, payrollData.year);
    
    // Get the working days
    const workingDays = payrollData.attendanceSummary?.workingDays || 0;
    
    // Calculate the prorated factor
    const proratedFactor = workingDays / daysInMonth;
    
    // Calculate the prorated gross salary
    const fullMonthSalary = parseFloat(payrollData.basicSalary || 0);
    
    // Add allowances
    let totalAllowances = 0;
    if (payrollData.allowances) {
      Object.values(payrollData.allowances).forEach(value => {
        totalAllowances += parseFloat(value || 0);
      });
    }
    
    // Add bonus and overtime
    const bonus = parseFloat(payrollData.bonus || 0);
    const overtime = parseFloat(payrollData.overtime?.amount || 0);
    
    // Calculate total full month gross
    const fullMonthGross = fullMonthSalary + totalAllowances + bonus + overtime;
    
    // Apply proration if needed
    if (workingDays < daysInMonth) {
      const proratedGross = fullMonthGross * proratedFactor;
      return proratedGross.toFixed(2);
    } else {
      return fullMonthGross.toFixed(2);
    }
  };

  // Update gross salary based on prorated calculation
  const updateGrossSalary = () => {
    // Make sure we're using attendance data with the correct total days
    const fixedAttendanceData = fixAttendanceSummary(editedPayroll);
    const updatedPayroll = {
      ...editedPayroll,
      attendanceSummary: fixedAttendanceData
    };
    
    // Calculate prorated salary using the fixed data
    const proratedGross = calculateProratedSalary(updatedPayroll);
    
    // Update state with both the fixed attendance and new gross salary
    setEditedPayroll(prev => ({
      ...prev,
      attendanceSummary: fixedAttendanceData,
      grossSalary: proratedGross
    }));
  };

  // Function to fix attendance summary
  const fixAttendanceSummary = (payrollData) => {
    // Calculate total days in month
    const daysInMonth = getDaysInMonth(payrollData.month, payrollData.year);
    
    // Get current attendance data
    const present = payrollData.attendanceSummary?.present || 0;
    const absent = payrollData.attendanceSummary?.absent || 0;
    const late = payrollData.attendanceSummary?.late || 0;
    const onLeave = payrollData.attendanceSummary?.onLeave || 0;
    
    // Calculate working days (present + late)
    const workingDays = present + late;
    
    // Return updated attendance summary
    return {
      ...payrollData.attendanceSummary,
      workingDays: workingDays,
      totalWorkingDays: daysInMonth
    };
  };

  // Initialize payroll with correct attendance data when component loads
  useEffect(() => {
    // Fix attendance summary if needed
    const fixedAttendanceSummary = fixAttendanceSummary(editedPayroll);
    
    // Only update if totalWorkingDays is different from actual days in month
    const daysInMonth = getDaysInMonth(editedPayroll.month, editedPayroll.year);
    if (editedPayroll.attendanceSummary?.totalWorkingDays !== daysInMonth) {
      setEditedPayroll(prev => ({
        ...prev,
        attendanceSummary: fixedAttendanceSummary
      }));
    }
  }, []);  // Empty dependency array ensures this runs only once on mount

  // On component mount and when basic details change, update gross salary
  useEffect(() => {
    updateGrossSalary();
  }, [
    editedPayroll.basicSalary, 
    editedPayroll.allowances, 
    editedPayroll.bonus, 
    editedPayroll.overtime?.amount,
    editedPayroll.attendanceSummary?.workingDays
  ]);

  // Check if payment info has been changed
  const hasPaymentInfoChanged = () => {
    return (
      editedPayroll.paymentStatus !== originalPayroll.paymentStatus ||
      editedPayroll.paymentMethod !== originalPayroll.paymentMethod ||
      editedPayroll.paymentDate !== originalPayroll.paymentDate ||
      editedPayroll.remarks !== originalPayroll.remarks
    );
  };

  // Save changes
  const saveChanges = async () => {
    setIsSaving(true);
    try {
      // Create payroll object with corrected attendance data
      const payrollToSave = { 
        ...editedPayroll,
        attendanceSummary: fixAttendanceSummary(editedPayroll)
      };
      
      console.log("Saving payroll with deductions:", JSON.stringify(payrollToSave.deductions));
      console.log("Saving payroll with fixed attendance:", JSON.stringify(payrollToSave.attendanceSummary));
      
      // If admin is using override to save a Processing/Paid payroll, log this action
      if (adminOverride && isAdmin && ['Processing', 'Paid'].includes(payrollToSave.paymentStatus)) {
        payrollToSave.adminOverrideLog = {
          timestamp: new Date().toISOString(),
          action: 'Modified payroll in ' + payrollToSave.paymentStatus + ' status'
        };
      }
      
      const response = await axios.put(`/api/payroll/${editedPayroll._id}`, payrollToSave);
      if (response.data.success) {
        toast.success('Payroll updated successfully');
        // Update original payroll to track future changes
        setOriginalPayroll({...payrollToSave});
        
        // Also update the edited payroll to reflect the fixed attendance data
        setEditedPayroll(payrollToSave);
        
        // Confirm the saved data
        console.log("Server responded with updated payroll:", response.data.data);
        
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
          {isAdmin && ['Processing', 'Paid'].includes(editedPayroll.paymentStatus) && (
            <button
              onClick={toggleAdminOverride}
              className={`px-3 py-1.5 ${adminOverride ? 'bg-red-600' : 'bg-yellow-600'} text-white rounded-md flex items-center gap-1 text-sm hover:${adminOverride ? 'bg-red-700' : 'bg-yellow-700'}`}
            >
              {adminOverride ? <FaUnlock /> : <FaLock />} {adminOverride ? 'Disable Override' : 'Admin Override'}
            </button>
          )}
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
      
      {!isEditable() && !adminOverride && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                This payroll is in <strong>{editedPayroll.paymentStatus}</strong> status. All changes will be saved when you click "Save Changes".
              </p>
            </div>
          </div>
        </div>
      )}
      
      {adminOverride && isAdmin && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Admin Override Active</strong> - You can now edit this {editedPayroll.paymentStatus} payroll. Please use with caution.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">Attendance Summary</h4>
        <div className="grid grid-cols-5 gap-3">
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Present</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {editedPayroll.attendanceSummary?.present || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Absent</div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {editedPayroll.attendanceSummary?.absent || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Late</div>
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {editedPayroll.attendanceSummary?.late || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">On Leave</div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {editedPayroll.attendanceSummary?.onLeave || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Working Days</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {editedPayroll.attendanceSummary?.workingDays || 0}/{editedPayroll.attendanceSummary?.totalWorkingDays || getDaysInMonth(editedPayroll.month, editedPayroll.year)}
            </div>
          </div>
        </div>
        
        {/* Attendance Progress Bar */}
        <div className="mt-3">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex justify-between">
            <span>Attendance Rate</span>
            <span>
              {Math.round(((editedPayroll.attendanceSummary?.present || 0) / 
                (editedPayroll.attendanceSummary?.totalWorkingDays || getDaysInMonth(editedPayroll.month, editedPayroll.year))) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" 
              style={{ 
                width: `${Math.round(((editedPayroll.attendanceSummary?.present || 0) / 
                  (editedPayroll.attendanceSummary?.totalWorkingDays || getDaysInMonth(editedPayroll.month, editedPayroll.year))) * 100)}%` 
              }}
            ></div>
          </div>
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
                onChange={(e) => {
                  const newStatus = e.target.value;
                  
                  // Special case for admin override - allow any status change
                  if (adminOverride && isAdmin) {
                    handleInputChange(e);
                    return;
                  }
                  
                  // Special handling when changing to "Processing" or "Paid"
                  if ((newStatus === 'Processing' || newStatus === 'Paid') && 
                      editedPayroll.paymentStatus === 'Pending') {
                    // User warning about locking payroll
                    if (window.confirm(`Setting status to ${newStatus} will lock other future edits of this status. Continue?`)) {
                      handleInputChange(e);
                    }
                  } else {
                    handleInputChange(e);
                  }
                }}
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
            {/* List all standard deductions separately */}
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Professional Tax</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.professionalTax || 0}
                onChange={(e) => {
                  setEditedPayroll({
                    ...editedPayroll,
                    deductions: {
                      ...(editedPayroll.deductions || {}),
                      professionalTax: parseFloat(e.target.value || 0)
                    }
                  });
                }}
                step="0.01"
              />
            </div>
            
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Income Tax</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.incomeTax || 0}
                onChange={(e) => {
                  setEditedPayroll({
                    ...editedPayroll,
                    deductions: {
                      ...(editedPayroll.deductions || {}),
                      incomeTax: parseFloat(e.target.value || 0)
                    }
                  });
                }}
                step="0.01"
              />
            </div>
            
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Provident Fund</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.providentFund || 0}
                onChange={(e) => {
                  setEditedPayroll({
                    ...editedPayroll,
                    deductions: {
                      ...(editedPayroll.deductions || {}),
                      providentFund: parseFloat(e.target.value || 0)
                    }
                  });
                }}
                step="0.01"
              />
            </div>
            
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Health Insurance</span>
                <input 
                  type="number" 
                  className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.healthInsurance || 0}
                onChange={(e) => {
                  setEditedPayroll({
                    ...editedPayroll,
                    deductions: {
                      ...(editedPayroll.deductions || {}),
                      healthInsurance: parseFloat(e.target.value || 0)
                    }
                  });
                }}
                  step="0.01"
                />
              </div>
            
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Other Deductions</h5>
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Loan Repayment</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.loanRepayment || 0}
                onChange={(e) => {
                  setEditedPayroll({
                    ...editedPayroll,
                    deductions: {
                      ...(editedPayroll.deductions || {}),
                      loanRepayment: parseFloat(e.target.value || 0)
                    }
                  });
                }}
                step="0.01"
              />
            </div>
            
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Absent Deduction</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.absentDeduction || 0}
                onChange={(e) => {
                  setEditedPayroll({
                    ...editedPayroll,
                    deductions: {
                      ...(editedPayroll.deductions || {}),
                      absentDeduction: parseFloat(e.target.value || 0)
                    }
                  });
                }}
                step="0.01"
              />
            </div>
            
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Late Deduction</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.lateDeduction || 0}
                onChange={(e) => handleLateDeductionChange(e.target.value)}
                step="0.01"
              />
            </div>
            
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Other</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.other || 0}
                onChange={(e) => {
                  setEditedPayroll({
                    ...editedPayroll,
                    deductions: {
                      ...(editedPayroll.deductions || {}),
                      other: parseFloat(e.target.value || 0)
                    }
                  });
                }}
                step="0.01"
              />
            </div>
            
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Leave Deduction</span>
                <input 
                  type="number" 
                  className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.leaveDeduction || 0}
                onChange={(e) => handleLeaveDeductionChange(e.target.value)}
                  step="0.01"
                />
              </div>
            
            <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Deductions</span>
              <span className="text-base font-bold text-gray-800 dark:text-white">{formatCurrency(calculateTotalDeductions())}</span>
            </div>
            
            <div className="mt-5 pt-3 border-t-2 border-gray-300 dark:border-gray-600 flex justify-between items-center">
              <span className="text-base font-medium text-gray-800 dark:text-gray-200">Net Salary</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(calculateNetSalary())}</span>
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
