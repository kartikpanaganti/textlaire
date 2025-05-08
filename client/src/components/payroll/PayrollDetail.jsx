import React, { useState, useEffect } from 'react';
import { FaFileDownload, FaMoneyBillWave, FaCalendarAlt, FaClock, FaSave, FaLock, FaUnlock, FaSync } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const PayrollDetail = ({ payroll, onGeneratePayslip, onUpdate, isAdmin = false }) => {
  // Helper to get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };
  
  // Function to fix attendance summary and calculate fixed deductions
  const fixAttendanceSummary = (payrollData) => {
    // Calculate total days in month
    const daysInMonth = getDaysInMonth(payrollData.month, payrollData.year);
    
    // Get current attendance data
    const present = payrollData.attendanceSummary?.present || 0;
    const absent = payrollData.attendanceSummary?.absent || 0;
    const late = payrollData.attendanceSummary?.late || 0;
    const onLeave = payrollData.attendanceSummary?.onLeave || 0;
    
    // Get the working days (present + late)
    const workingDays = present + late;
    
    // Get the total days in month for proration
    const workingDaysFactor = Math.max(workingDays / daysInMonth, 0.1); // At least 10% to avoid zero deductions
    
    // fixed deduction rates
    const absentDeduction = absent * 100;  // 100 rupees per day
    const lateDeduction = late * 25;       // 25 rupees per day
    const leaveDeduction = onLeave * 45;   // 45 rupees per day
    
    // Set statutory deductions with new values (prorated based on working days)
    const professionalTax = Math.round(15 * workingDaysFactor);    // 15 rupees (prorated)
    const incomeTax = 0;                                            // 0 rupees (not prorated)
    const providentFund = Math.round(48 * workingDaysFactor);      // 48 rupees (prorated)
    const healthInsurance = Math.round(20 * workingDaysFactor);    // 20 rupees (prorated)
    
    // Update deductions in payroll data
    if (!payrollData.deductions) payrollData.deductions = {};
    payrollData.deductions.absentDeduction = absentDeduction;
    payrollData.deductions.lateDeduction = lateDeduction;
    payrollData.deductions.professionalTax = professionalTax;
    payrollData.deductions.incomeTax = incomeTax;
    payrollData.deductions.providentFund = providentFund;
    payrollData.deductions.healthInsurance = healthInsurance;
    payrollData.leaveDeduction = leaveDeduction;
    
    // Return updated attendance summary
    return {
      ...payrollData.attendanceSummary,
      workingDays: workingDays,
      totalWorkingDays: daysInMonth
    };
  };
  
  // Function to validate statutory deductions
  const validateStatutoryDeductions = () => {
    // No need for strict validation on prorated statutory deductions
    // Just check if they exist and are non-negative
    const deductions = editedPayroll.deductions || {};
    const validProfessionalTax = deductions.professionalTax >= 0;
    const validProvidentFund = deductions.providentFund >= 0;
    const validHealthInsurance = deductions.healthInsurance >= 0;
    
    return validProfessionalTax && validProvidentFund && validHealthInsurance;
  };
  
  // Apply initial fixes to attendance data and calculate fixed deductions
  const fixedPayroll = payroll ? {
    ...payroll,
    attendanceSummary: fixAttendanceSummary(payroll)
  } : {};
  
  // Ensure payroll has all necessary properties initialized
  const initializedPayroll = {
    ...fixedPayroll,
    basicSalary: fixedPayroll?.basicSalary || 15300, // Default monthly salary package if not provided
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
      professionalTax: 15,  // 15 rupees
      incomeTax: 0,        // 0 rupees
      providentFund: 48,   // 48 rupees
      healthInsurance: 20, // 20 rupees
      loanRepayment: 0,
      absentDeduction: 0,
      lateDeduction: 0,
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
    if (!isEditable()) {
      toast.error('This payroll is locked for editing');
      return;
    }
    
    // Calculate fixed leave deduction based on attendance
    const leaveCount = editedPayroll.attendanceSummary?.onLeave || 0;
    const fixedLeaveDeduction = leaveCount * 45; // 45 rupees per leave day
    
    // Use admin override or fixed calculation
    const leaveDeductionValue = adminOverride ? parseFloat(value || 0) : fixedLeaveDeduction;
    
    // Set the deduction value
    setEditedPayroll({
      ...editedPayroll,
      leaveDeduction: leaveDeductionValue
    });
  };
  
  // Handle Late Deduction specifically
  const handleLateDeductionChange = (value) => {
    // For manual overrides by admin when needed
    if (!isEditable()) {
      toast.error('This payroll is locked for editing');
      return;
    }
    
    console.log(`Directly updating lateDeduction to: ${value}`);
    
    // Calculate fixed late deduction based on attendance
    const lateCount = editedPayroll.attendanceSummary?.late || 0;
    const fixedLateDeduction = lateCount * 25; // 25 rupees per late day
    
    // Use admin override or fixed calculation
    const lateDeductionValue = adminOverride ? parseFloat(value || 0) : fixedLateDeduction;
    
    // Create a new object with updated late deduction
    const updatedPayroll = { 
      ...editedPayroll,
      deductions: {
        ...(editedPayroll.deductions || {}),
        lateDeduction: lateDeductionValue
      }
    };
    
    // Set state with new object
    setEditedPayroll(updatedPayroll);
    
    // Update the net salary after changing the deduction
    setTimeout(() => calculateAndUpdateSalary(), 100);
    
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
        let deductionValue = parseFloat(value || 0);
        console.log(`Adding deduction: ${key} = ${deductionValue}`);
        total += deductionValue;
      });
    }
    
    // Add leave deduction
    const leaveDeduction = parseFloat(editedPayroll.leaveDeduction || 0);
    console.log(`Adding leave deduction: ${leaveDeduction}`);
    total += leaveDeduction;
    
    console.log("Total deductions calculated:", total.toFixed(2));
    return parseFloat(total.toFixed(2));
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
    
    // Get the working days (present + late) - make sure they're counted correctly
    const workingDays = (payrollData.attendanceSummary?.present || 0) + (payrollData.attendanceSummary?.late || 0);
    
    // Make sure attendanceSummary.workingDays is updated
    if (payrollData.attendanceSummary) {
      payrollData.attendanceSummary.workingDays = workingDays;
    }
    
    // Calculate the prorated factor with a minimum value to avoid extreme deductions
    const proratedFactor = Math.max(workingDays / daysInMonth, 0.1); // At least 10% to avoid zero salary
    
    // Get the full month basic salary (ensure it's not 0)
    // Use originalSalary from the backend, or fall back to basicSalary if needed
    const originalSalary = parseFloat(payrollData.originalSalary || 0);
    const effectiveBasicSalary = originalSalary > 0 ? originalSalary : 15300;
    
    // Calculate prorated basic salary
    const proratedBasicSalary = effectiveBasicSalary * proratedFactor;
    
    // Add allowances - also prorated
    let totalAllowances = 0;
    if (payrollData.allowances) {
      Object.values(payrollData.allowances).forEach(value => {
        totalAllowances += parseFloat(value || 0);
      });
    }
    
    // Add bonus and overtime (these are not prorated)
    const bonus = parseFloat(payrollData.bonus || 0);
    const overtime = parseFloat(payrollData.overtime?.amount || 0);
    
    // Calculate total gross
    const proratedGross = proratedBasicSalary + totalAllowances + bonus + overtime;
    
    // Store the original full salary for reference
    payrollData.originalSalary = effectiveBasicSalary;
    
    return proratedGross.toFixed(2);
  };
  
  // Function to calculate and update all salary values
  const calculateAndUpdateSalary = () => {
    // First, check if we have backend values already calculated
    // If we do, we'll use those values to ensure consistency across views
    if (originalPayroll && originalPayroll.basicSalary && originalPayroll.grossSalary && originalPayroll.netSalary) {
      console.log("Using backend-provided values for consistency:", {
        basicSalary: originalPayroll.basicSalary,
        grossSalary: originalPayroll.grossSalary,
        netSalary: originalPayroll.netSalary
      });
      
      // Update the edited payroll with these values to ensure consistency
      setEditedPayroll(prev => ({
        ...prev,
        basicSalary: originalPayroll.basicSalary,
        grossSalary: originalPayroll.grossSalary,
        netSalary: originalPayroll.netSalary,
        totalDeductions: originalPayroll.totalDeductions || (originalPayroll.grossSalary - originalPayroll.netSalary)
      }));
      
      return; // Skip the calculation since we're using backend values
    }
    
    // If we don't have backend values, perform the calculation
    // Make sure we're using attendance data with the correct total days
    const fixedAttendanceData = fixAttendanceSummary(editedPayroll);
    const updatedPayroll = {
      ...editedPayroll,
      attendanceSummary: fixedAttendanceData
    };
    
    // Make sure originalSalary exists and is correct
    if (!updatedPayroll.originalSalary || updatedPayroll.originalSalary <= 0) {
      updatedPayroll.originalSalary = 15300; // Default if not set correctly
    }
    
    // Get the working days and total days
    const workingDays = (updatedPayroll.attendanceSummary?.present || 0) + (updatedPayroll.attendanceSummary?.late || 0);
    const daysInMonth = getDaysInMonth(updatedPayroll.month, updatedPayroll.year);
    
    // Calculate proration factor (min 10% to avoid extreme reductions)
    const proratedFactor = Math.max(workingDays / daysInMonth, 0.1);
    
    // Calculate prorated basic salary from original salary
    const proratedBasic = Math.round(updatedPayroll.originalSalary * proratedFactor * 100) / 100;
    
    // Store the prorated basic salary
    updatedPayroll.basicSalary = proratedBasic;
    
    // Update allowances to be prorated from original values
    let totalAllowances = 0;
    if (updatedPayroll.allowances) {
      const allowanceKeys = Object.keys(updatedPayroll.allowances);
      for (const key of allowanceKeys) {
        // Only prorate standard allowances (not special or other which might be fixed bonuses)
        if (['houseRent', 'medical', 'travel', 'food'].includes(key)) {
          // Calculate original allowance values based on percentages of original salary
          let originalValue = 0;
          if (key === 'houseRent') originalValue = updatedPayroll.originalSalary * 0.4; // 40% of original
          else if (key === 'medical') originalValue = updatedPayroll.originalSalary * 0.1; // 10% of original
          else if (key === 'travel') originalValue = updatedPayroll.originalSalary * 0.05; // 5% of original
          else if (key === 'food') originalValue = updatedPayroll.originalSalary * 0.05; // 5% of original
          
          // Prorate the allowance and format to 2 decimal places
          const proratedAllowance = Math.round(originalValue * proratedFactor * 100) / 100;
          updatedPayroll.allowances[key] = proratedAllowance;
          totalAllowances += proratedAllowance;
        } else {
          // Non-standard allowances are not prorated
          totalAllowances += parseFloat(updatedPayroll.allowances[key] || 0);
        }
      }
    }
    
    // Calculate bonus and overtime
    const bonus = parseFloat(updatedPayroll.bonus || 0);
    const overtime = parseFloat(updatedPayroll.overtime?.amount || 0);
    
    // Calculate gross salary as the sum of prorated basic and allowances plus non-prorated components
    const grossSalary = proratedBasic + totalAllowances + bonus + overtime;
    updatedPayroll.grossSalary = Math.round(grossSalary * 100) / 100;
    
    // Calculate leave deduction (₹45/day)
    const leaveCount = updatedPayroll.attendanceSummary?.onLeave || 0;
    updatedPayroll.leaveDeduction = leaveCount * 45;
    
    // Calculate late deduction (₹25/day)
    const lateCount = updatedPayroll.attendanceSummary?.late || 0;
    if (updatedPayroll.deductions) {
      updatedPayroll.deductions.lateDeduction = lateCount * 25;
    }
    
    // Calculate total deductions
    const totalDeductions = parseFloat(calculateTotalDeductions());
    updatedPayroll.totalDeductions = Math.round(totalDeductions * 100) / 100;
    
    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;
    updatedPayroll.netSalary = Math.round(netSalary * 100) / 100;
    
    // Update state with the complete updated payroll
    setEditedPayroll(updatedPayroll);
    
    console.log("Updated salary calculations:", {
      originalSalary: updatedPayroll.originalSalary,
      proratedBasic: proratedBasic,
      totalAllowances: totalAllowances,
      grossSalary: updatedPayroll.grossSalary,
      totalDeductions: updatedPayroll.totalDeductions,
      netSalary: updatedPayroll.netSalary
    });
  };
  
  // Reset edited payroll whenever the original payroll changes
  useEffect(() => {
    if (payroll) {
      console.log("Received original payroll data:", payroll);
      
      // Directly use the backend values if available
      const useBackendValues = true; // Set to true to always use backend values
      
      if (useBackendValues && payroll.basicSalary && payroll.grossSalary && payroll.netSalary) {
        // Apply the attendance summary fix to the payroll
        const fixedAttendance = fixAttendanceSummary(payroll);
        
        // Use all values exactly as they come from the backend
        setEditedPayroll({
          ...payroll,
          attendanceSummary: fixedAttendance
        });
        
        setOriginalPayroll({
          ...payroll,
          attendanceSummary: fixedAttendance
        });
        
        console.log("Using backend values without recalculation:", {
          basicSalary: payroll.basicSalary,
          grossSalary: payroll.grossSalary,
          netSalary: payroll.netSalary
        });
        
        return; // Skip further processing
      }
      
      // If we're not using backend values directly, perform the calculation
      // Apply the attendance summary fix to the payroll and calculate fixed deductions
      const fixedAttendance = fixAttendanceSummary(payroll);
      
      // Use the original salary value provided by the backend, or fall back to basicSalary
      const originalSalary = parseFloat(payroll.originalSalary || 0);
      const effectiveOriginalSalary = originalSalary > 0 ? originalSalary : 15300;
      
      // Calculate fixed deductions based on attendance
      const absentCount = payroll.attendanceSummary?.absent || 0;
      const lateCount = payroll.attendanceSummary?.late || 0;
      const leaveCount = payroll.attendanceSummary?.onLeave || 0;
      
      const absentDeduction = absentCount * 100; // 100 rupees per day
      const lateDeduction = lateCount * 25;     // 25 rupees per day
      const leaveDeduction = leaveCount * 45;   // 45 rupees per day
      
      // Get working days and calculate proration factor
      const workingDays = (payroll.attendanceSummary?.present || 0) + (payroll.attendanceSummary?.late || 0);
      const daysInMonth = getDaysInMonth(payroll.month, payroll.year);
      const workingDaysFactor = Math.max(workingDays / daysInMonth, 0.1); // At least 10% to avoid zero deductions
      
      // Statutory deductions with new values (prorated based on working days)
      const professionalTax = Math.round(15 * workingDaysFactor);    // 15 rupees (prorated)
      const incomeTax = payroll.deductions?.incomeTax || 0;          // Use backend value or 0
      const providentFund = Math.round(48 * workingDaysFactor);      // 48 rupees (prorated)
      const healthInsurance = Math.round(20 * workingDaysFactor);    // 20 rupees (prorated)
      
      const updatedPayroll = {
        ...payroll,
        attendanceSummary: fixedAttendance,
        originalSalary: effectiveOriginalSalary,
        deductions: {
          ...(payroll.deductions || {}),
          absentDeduction: absentDeduction,
          lateDeduction: lateDeduction,
          professionalTax: professionalTax,
          incomeTax: incomeTax,
          providentFund: providentFund,
          healthInsurance: healthInsurance
        },
        leaveDeduction: leaveDeduction
      };
      
      setEditedPayroll(updatedPayroll);
      setOriginalPayroll(updatedPayroll);
      
      // Calculate and update all salary values
      setTimeout(() => calculateAndUpdateSalary(), 100);
    }
  }, [payroll]);
  
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
      // Update the salary calculations before saving
      calculateAndUpdateSalary();
      
      // Make sure we have the fixed attendance data
      const fixedAttendanceData = fixAttendanceSummary(editedPayroll);
      
      // Format all numbers to 2 decimal places for consistency
      const formattedAllowances = {};
      if (editedPayroll.allowances) {
        Object.entries(editedPayroll.allowances).forEach(([key, value]) => {
          formattedAllowances[key] = Math.round(parseFloat(value || 0) * 100) / 100;
        });
      }
      
      const formattedDeductions = {};
      if (editedPayroll.deductions) {
        Object.entries(editedPayroll.deductions).forEach(([key, value]) => {
          formattedDeductions[key] = Math.round(parseFloat(value || 0) * 100) / 100;
        });
      }
      
      // Create payroll object with corrected and formatted data
      const payrollToSave = { 
        ...editedPayroll,
        attendanceSummary: fixedAttendanceData,
        allowances: formattedAllowances,
        deductions: formattedDeductions,
        leaveDeduction: Math.round(parseFloat(editedPayroll.leaveDeduction || 0) * 100) / 100,
        basicSalary: Math.round(parseFloat(editedPayroll.basicSalary || 0) * 100) / 100,
        originalSalary: Math.round(parseFloat(editedPayroll.originalSalary || 0) * 100) / 100,
        grossSalary: Math.round(parseFloat(editedPayroll.grossSalary || 0) * 100) / 100,
        netSalary: Math.round(parseFloat(editedPayroll.netSalary || 0) * 100) / 100,
        totalDeductions: Math.round(parseFloat(editedPayroll.totalDeductions || 0) * 100) / 100
      };
      
      console.log("Saving payroll with deductions:", JSON.stringify(payrollToSave.deductions));
      console.log("Saving payroll with fixed attendance:", JSON.stringify(payrollToSave.attendanceSummary));
      console.log("Saving gross salary:", payrollToSave.grossSalary);
      console.log("Saving net salary:", payrollToSave.netSalary);
      
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

  // Add a function to recalculate payroll from the server
  const handleRecalculate = async () => {
    // Only allow recalculation for pending or processing payrolls
    if (!adminOverride && ['Paid'].includes(editedPayroll.paymentStatus)) {
      toast.error('Cannot recalculate a paid payroll');
      return;
    }
    
    setIsSaving(true);
    try {
      // Call the recalculate API endpoint
      const response = await axios.put(`/api/payroll/recalculate/${editedPayroll._id}`);
      
      if (response.data.success) {
        toast.success('Payroll recalculated successfully');
        
        // Update the payroll with the recalculated data
        const recalculatedPayroll = response.data.data;
        
        // Apply the attendance summary fix to the recalculated data
        const fixedAttendance = fixAttendanceSummary(recalculatedPayroll);
        
        // Make sure we have the original salary set correctly
        const updatedPayroll = {
          ...recalculatedPayroll,
          attendanceSummary: fixedAttendance,
          // Make sure original salary is carried over
          originalSalary: recalculatedPayroll.originalSalary || 15300
        };
        
        // Update local state
        setEditedPayroll(updatedPayroll);
        setOriginalPayroll(updatedPayroll);
        
        // Notify parent component
        if (onUpdate) onUpdate(updatedPayroll);
        
        console.log("Recalculated payroll:", updatedPayroll);
      } else {
        toast.error('Failed to recalculate payroll');
      }
    } catch (error) {
      console.error('Error recalculating payroll:', error);
      toast.error(error.response?.data?.message || 'An error occurred while recalculating');
    } finally {
      setIsSaving(false);
    }
  };

  // Format for displaying allowance values with 2 decimal places
  const formatAllowance = (value) => {
    return parseFloat(value || 0).toFixed(2);
  };

  // Make sure we initialize with correct values after component mounts
  useEffect(() => {
    // Only when the component first mounts
    // Make sure we have the correct attendance data and salary calculations
    if (editedPayroll && Object.keys(editedPayroll).length > 0) {
      // Log current values
      console.log("Component mounted with initial values:", {
        originalSalary: editedPayroll.originalSalary,
        basicSalary: editedPayroll.basicSalary,
        grossSalary: editedPayroll.grossSalary,
        netSalary: editedPayroll.netSalary
      });
    }
  }, []);
  
  // Add back salary recalculation effect when specific values change
  useEffect(() => {
    // Only run after initial render
    if (editedPayroll._id) {
      // Don't recalculate if we're using backend values
      const shouldSkipRecalculation = originalPayroll && 
        originalPayroll.basicSalary && 
        originalPayroll.grossSalary && 
        originalPayroll.netSalary;
        
      if (shouldSkipRecalculation) {
        console.log("Skipping recalculation because we're using backend values");
        return;
      }
      
      // Recalculate when allowances, deductions, or attendance values change
      calculateAndUpdateSalary();
    }
  }, [
    editedPayroll.attendanceSummary?.present,
    editedPayroll.attendanceSummary?.late,
    editedPayroll.allowances,
    editedPayroll.deductions,
    editedPayroll.leaveDeduction
  ]);

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
              className={adminOverride 
                ? "px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-1 text-sm"
                : "px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md flex items-center gap-1 text-sm"
              }
            >
              {adminOverride ? <FaUnlock /> : <FaLock />} {adminOverride ? 'Disable Override' : 'Admin Override'}
            </button>
          )}
          <button
            onClick={saveChanges}
            disabled={isSaving}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md flex items-center gap-1 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave className="mr-1" /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleGeneratePayslip}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md flex items-center gap-1 text-sm hover:bg-indigo-700"
          >
            <FaFileDownload className="mr-1" /> Download Payslip
          </button>
          <button
            onClick={handleRecalculate}
            disabled={isSaving}
            className="px-3 py-1.5 bg-yellow-600 text-white rounded-md flex items-center gap-1 text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSync className="mr-1" /> Recalculate
          </button>
        </div>
      </div>
      
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
              <span className="text-sm text-gray-600 dark:text-gray-400">Basic Salary</span>
              <div className="flex items-center">
                <input 
                  type="number" 
                  name="basicSalary"
                  className="w-24 text-right text-sm font-medium border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={editedPayroll.originalSalary > 0 ? editedPayroll.originalSalary : 15300}
                  onChange={(e) => {
                    // Update the original salary (ensure it's not 0)
                    const newValue = parseFloat(e.target.value) || 15300;
                    setEditedPayroll({
                      ...editedPayroll,
                      originalSalary: newValue,
                      basicSalary: newValue // Set both fields for consistency
                    });
                    // Then update the gross salary based on the new basic salary
                    setTimeout(() => calculateAndUpdateSalary(), 100);
                  }}
                  min="1000"
                  step="0.01"
                  disabled={!adminOverride} // Only allow editing with admin override
                />
              </div>
            </div>
            {/* Show the prorated basic salary based on attendance */}
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Prorated Basic (Working Days: {editedPayroll.attendanceSummary?.workingDays || 0}/{editedPayroll.attendanceSummary?.totalWorkingDays || 31})</span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {formatCurrency(editedPayroll.basicSalary || 0)}
              </span>
            </div>
            
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Allowances (Prorated)</h5>
            {Object.entries(editedPayroll.allowances || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center pl-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    value={formatAllowance(value)}
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
              <span className="text-sm text-gray-600 dark:text-gray-400">Professional Tax (Prorated)</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.professionalTax || 15}
                onChange={(e) => {
                  // Validate the input to ensure it's within the range (100-280)
                  let value = parseFloat(e.target.value || 0);
                  if (value < 100) value = 100;
                  if (value > 280) value = 280;
                  handleDeductionChange('professionalTax', value);
                }}
                min="100"
                max="280"
                step="1"
              />
            </div>
            
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Income Tax</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.incomeTax || 0}
                onChange={(e) => {
                  // Validate the input to ensure it's within the range (0-280)
                  let value = parseFloat(e.target.value || 0);
                  if (value < 0) value = 0;
                  if (value > 280) value = 280;
                  handleDeductionChange('incomeTax', value);
                }}
                min="0"
                max="280"
                step="1"
              />
            </div>
            
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Provident Fund (Prorated)</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.providentFund || 48}
                onChange={(e) => {
                  // Validate the input to ensure it's within the range (100-280)
                  let value = parseFloat(e.target.value || 0);
                  if (value < 100) value = 100;
                  if (value > 280) value = 280;
                  handleDeductionChange('providentFund', value);
                }}
                min="100"
                max="280"
                step="1"
              />
            </div>
            
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Health Insurance (Prorated)</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.healthInsurance || 20}
                onChange={(e) => {
                  // Validate the input to ensure it's within the range (100-280)
                  let value = parseFloat(e.target.value || 0);
                  if (value < 100) value = 100;
                  if (value > 280) value = 280;
                  handleDeductionChange('healthInsurance', value);
                }}
                min="100"
                max="280"
                step="1"
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
              <span className="text-sm text-gray-600 dark:text-gray-400">Absent Deduction (₹100/day)</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.absentDeduction || 0}
                onChange={(e) => {
                  if (!isEditable()) {
                    toast.error('This payroll is locked for editing');
                    return;
                  }
                  
                  // Calculate fixed absent deduction based on attendance
                  const absentCount = editedPayroll.attendanceSummary?.absent || 0;
                  const fixedAbsentDeduction = absentCount * 100; // 100 rupees per absent day
                  
                  // Use admin override or fixed calculation
                  const absentDeductionValue = adminOverride ? parseFloat(e.target.value || 0) : fixedAbsentDeduction;
                  
                  setEditedPayroll({
                    ...editedPayroll,
                    deductions: {
                      ...(editedPayroll.deductions || {}),
                      absentDeduction: absentDeductionValue
                    }
                  });
                }}
                step="0.01"
                disabled={!adminOverride}
              />
            </div>
            
            <div className="flex justify-between items-center pl-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Late Deduction (₹25/day)</span>
              <input 
                type="number" 
                className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.deductions?.lateDeduction || 0}
                onChange={(e) => handleLateDeductionChange(e.target.value)}
                step="0.01"
                disabled={!adminOverride}
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
              <span className="text-sm text-gray-600 dark:text-gray-400">Leave Deduction (₹45/day)</span>
                <input 
                  type="number" 
                  className="w-24 text-right text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={editedPayroll.leaveDeduction || 0}
                onChange={(e) => handleLeaveDeductionChange(e.target.value)}
                  step="0.01"
                  disabled={!adminOverride}
                />
              </div>
            
            <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Deductions</span>
              <span className="text-base font-bold text-gray-800 dark:text-white">{formatCurrency(calculateTotalDeductions())}</span>
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
