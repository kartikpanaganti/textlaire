import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import mongoose from 'mongoose';

// Helper function to get the number of days in a month
const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

// Helper function to synchronize payroll data with employee and attendance
const syncPayrollWithAttendance = async (employeeId, month, year) => {
  try {
    // Get employee data
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    // Get attendance records for the month by payrollMonth and payrollYear
    // IMPORTANT: Only get records up to today's date (don't include future dates)
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // JS months are 0-indexed
    const currentDay = today.getDate();
    
    console.log(`Calculating payroll for ${employee.name} for month: ${month}/${year}`);
    console.log(`Current date: ${currentYear}-${currentMonth}-${currentDay}`);
    
    // Check if we're trying to calculate future months
    const isCurrentOrPastMonth = (parseInt(year) < currentYear) || 
                               (parseInt(year) === currentYear && parseInt(month) <= currentMonth);
    
    // For future months, use the employee's full salary instead of returning null
    if (!isCurrentOrPastMonth) {
      console.log(`Calculating future month payroll for ${month}/${year} using full salary`);
      
      // Create a basic payroll with the employee's full salary for future months
      let payroll = await Payroll.findOne({ employeeId, month, year });
      
      if (!payroll) {
        // Create new payroll for future month
        payroll = new Payroll({
          employeeId,
          month: parseInt(month),
          year: parseInt(year),
          employeeDetails: {
            name: employee.name,
            employeeID: employee.employeeID,
            department: employee.department,
            position: employee.position,
            joiningDate: employee.joiningDate,
            bankDetails: {
              bankName: employee.bankDetails?.bankName || employee.bankName || '',
              accountNumber: employee.bankDetails?.accountNumber || employee.accountNumber || '',
              accountHolderName: employee.bankDetails?.accountHolderName || employee.accountHolderName || employee.name || '',
              ifscCode: employee.bankDetails?.ifscCode || employee.ifscCode || ''
            }
          },
          basicSalary: employee.salary, // Use full salary
          originalSalary: employee.salary
        });
        
        // Set attendance for future months - perfect attendance
        const daysInFutureMonth = getDaysInMonth(parseInt(month), parseInt(year));
        payroll.attendanceSummary = {
          present: daysInFutureMonth,
          absent: 0,
          late: 0,
          onLeave: 0,
          workingDays: daysInFutureMonth,
          totalWorkingDays: daysInFutureMonth
        };
        
        // Set standard allowances based on the full salary
        payroll.allowances = {
          houseRent: employee.salary * 0.4, // 40% of basic salary
          medical: employee.salary * 0.1, // 10% of basic salary
          travel: employee.salary * 0.05, // 5% of basic salary
          food: employee.salary * 0.05, // 5% of basic salary
          special: 0,
          other: 0
        };
        
        // Calculate allowance total
        const allowanceTotal = 
          (payroll.allowances.houseRent || 0) +
          (payroll.allowances.medical || 0) +
          (payroll.allowances.travel || 0) +
          (payroll.allowances.food || 0) +
          (payroll.allowances.special || 0) +
          (payroll.allowances.other || 0);
        
        // Set deductions based on the full salary
        const healthInsuranceAmount = Math.min(employee.salary * 0.05, 1000); // 5% of salary up to 1000 max
        
        payroll.deductions = {
          professionalTax: employee.salary > 15000 ? 200 : 150, // Example tax rule
          incomeTax: calculateIncomeTax(employee.salary), // Calculate income tax on full salary
          providentFund: employee.salary * 0.12, // 12% of basic salary
          healthInsurance: healthInsuranceAmount, // Proportional to salary
          loanRepayment: 0,
          absentDeduction: 0,
          lateDeduction: 0,
          other: 0
        };
        
        // Calculate deduction total
        const deductionTotal = 
          (payroll.deductions.professionalTax || 0) +
          (payroll.deductions.incomeTax || 0) +
          (payroll.deductions.providentFund || 0) +
          (payroll.deductions.healthInsurance || 0) +
          (payroll.deductions.loanRepayment || 0) +
          (payroll.deductions.absentDeduction || 0) +
          (payroll.deductions.lateDeduction || 0) +
          (payroll.deductions.other || 0);
        
        // Set overtime and totals
        payroll.overtime = { hours: 0, rate: 1.5, amount: 0 };
        payroll.bonus = 0;
        payroll.leaveDeduction = 0;
        
        // Calculate final figures
        payroll.grossSalary = employee.salary + allowanceTotal;
        payroll.totalDeductions = deductionTotal;
        payroll.netSalary = payroll.grossSalary - payroll.totalDeductions;
        
        // Set payment details
        payroll.paymentStatus = 'Pending';
        payroll.paymentMethod = 'Bank Transfer';
        payroll.lastCalculated = new Date();
        
        await payroll.save();
      }
      
      return payroll;
    }
    
    // Check if the payroll month/year is before the employee's joining date
    const joiningDate = new Date(employee.joiningDate);
    const joiningYear = joiningDate.getFullYear();
    const joiningMonth = joiningDate.getMonth() + 1; // JS months are 0-indexed
    
    console.log(`Employee joining date: ${joiningMonth}/${joiningYear}`);
    
    const isAfterJoining = (parseInt(year) > joiningYear) || 
                           (parseInt(year) === joiningYear && parseInt(month) >= joiningMonth);
    
    // If the requested month is before the employee's joining date, return null
    if (!isAfterJoining) {
      console.log(`Cannot calculate payroll for ${month}/${year} as employee joined in ${joiningMonth}/${joiningYear}`);
      return null;
    }
    
    // Check if this is a past month
    const isPastMonth = (parseInt(year) < currentYear) || 
                     (parseInt(year) === currentYear && parseInt(month) < currentMonth);
    
    console.log(`Month status: ${isPastMonth ? 'Past month' : 'Current month'}`);
    
    // Try different query approaches for historical data
    let attendanceRecords = [];
    
    // First attempt - query by payrollMonth and payrollYear fields
    attendanceRecords = await Attendance.find({
      employeeId: employeeId,
      payrollMonth: parseInt(month),
      payrollYear: parseInt(year)
    });
    
    console.log(`Found ${attendanceRecords.length} records using payrollMonth/payrollYear fields`);
    
    // Second attempt - if no records found, try extracting month/year from date field
    if (attendanceRecords.length === 0) {
      // Get start and end date for the month
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
      
      // Format as YYYY-MM-DD strings
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`Trying date range query: ${startDateStr} to ${endDateStr}`);
      
      // Query by date range
      attendanceRecords = await Attendance.find({
        employeeId: employeeId,
        date: { $gte: startDateStr, $lte: endDateStr }
      });
      
      console.log(`Found ${attendanceRecords.length} records using date range query`);
    }
    
    // For past months, we should include all records
    // For current month, filter to only show up to today
    if (!isPastMonth && parseInt(year) === currentYear && parseInt(month) === currentMonth) {
      attendanceRecords = attendanceRecords.filter(record => {
        if (!record.date) return true;
        const recordDay = parseInt(record.date.split('-')[2]);
        return recordDay <= currentDay;
      });
      console.log(`Filtered current month records up to day ${currentDay}`);
    }
    
    console.log(`Found ${attendanceRecords.length} attendance records for employee ${employee.name} (${employee._id}) for ${month}/${year}`);
    
    // For past months with no attendance records, create demo data to show historical payrolls
    if (isPastMonth && attendanceRecords.length === 0) {
      console.log(`No historical records found for past month ${month}/${year}. Creating demo data.`);
      
      // Get the total days in this month for realistic attendance stats
      const daysInMonth = getDaysInMonth(parseInt(month), parseInt(year));
      
      // For demo purposes - create realistic attendance stats for past months
      // 80% present, 10% absent, 5% late, 5% leave
      const presentCount = Math.floor(daysInMonth * 0.8);
      const absentCount = Math.floor(daysInMonth * 0.1);
      const lateCount = Math.floor(daysInMonth * 0.05);
      const leaveCount = daysInMonth - presentCount - absentCount - lateCount;
      
      console.log(`Created demo attendance for ${month}/${year}: ${presentCount} present, ${absentCount} absent, ${lateCount} late, ${leaveCount} leave`);
      
      // Use these values for attendance summary
      const attendanceSummary = {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        onLeave: leaveCount,
        workingDays: daysInMonth,
        totalWorkingDays: daysInMonth
      };
      
      console.log(`Demo attendance summary: ${JSON.stringify(attendanceSummary)}`);
      return createDemoPayroll(employee, month, year, attendanceSummary);
    }
    
    // Handle missing attendance records for past dates
    const daysInMonth = getDaysInMonth(parseInt(month), parseInt(year));
    
    // Get a list of days that have attendance records
    const recordedDays = attendanceRecords.map(record => {
      return parseInt(record.date.split('-')[2]); // Get day part from YYYY-MM-DD
    });
    
    console.log(`Recorded days: ${recordedDays.join(', ')}`);
    
    // Find missing days (days that should have attendance but don't)
    const maxDay = isPastMonth ? daysInMonth : Math.min(daysInMonth, currentDay);
    const missingDays = [];
    
    for (let day = 1; day <= maxDay; day++) {
      if (!recordedDays.includes(day)) {
        missingDays.push(day);
      }
    }
    
    console.log(`Missing days: ${missingDays.join(', ')}`);
    
    // Count the missing days as "on leave" if they're in the past
    // For current month, only count missing days that are in the past (not today)
    const todayDay = new Date().getDate();
    const missingPastDays = missingDays.filter(day => {
      if (isPastMonth) return true;
      return day < todayDay; // For current month, only count days before today
    });
    
    console.log(`Missing past days (counted as on leave): ${missingPastDays.join(', ')}`);
    
    // For real attendance records, count actual statuses
    const presentDays = attendanceRecords.filter(record => record.status === 'Present').length;
    const absentDays = attendanceRecords.filter(record => record.status === 'Absent').length;
    const lateDays = attendanceRecords.filter(record => record.status === 'Late').length;
    
    // Add missing days as "on leave" days
    const recordedLeaveDays = attendanceRecords.filter(record => record.status === 'On Leave').length;
    const leaveDays = recordedLeaveDays + missingPastDays.length;
    
    // Total recorded days is the sum of all attendance records plus missing days
    const totalRecordedDays = presentDays + absentDays + lateDays + leaveDays;
    
    console.log(`Attendance breakdown - Present: ${presentDays}, Absent: ${absentDays}, Late: ${lateDays}, Leave: ${leaveDays} (including ${missingPastDays.length} missing days)`);
    
    // Use attendance data appropriately for current vs past months
    const attendanceSummary = {
      present: presentDays,
      absent: absentDays,
      late: lateDays,
      onLeave: leaveDays,
      workingDays: totalRecordedDays,
      totalWorkingDays: isPastMonth ? daysInMonth : Math.min(daysInMonth, currentDay)
    };
    
    console.log(`Attendance summary with missing days handled: ${JSON.stringify(attendanceSummary)}`);
    
    // Calculate overtime from actual attendance records only
    const overtimeRecords = attendanceRecords.filter(record => (record.overtimeHours || 0) > 0);
    const totalOvertimeHours = overtimeRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
    const avgOvertimeRate = overtimeRecords.length > 0 ?
      overtimeRecords.reduce((sum, record) => sum + (record.overtimeRate || 1.5), 0) / overtimeRecords.length : 1.5;
    
    // Calculate salary based on attendance (only pay for days present)
    const dailyRate = employee.salary / daysInMonth;
    let adjustedBasicSalary = 0;
    let leaveDeduction = 0;
    let lateDeduction = 0;
    
    // Special case for current month
    if (parseInt(year) === currentYear && parseInt(month) === currentMonth) {
      console.log(`Handling current month (${month}/${year}): Today is day ${currentDay} of the month`);
      
      // For current month, calculate based on days that have passed
      const totalDaysElapsed = currentDay;
      
      // Calculate adjusted salary based on attendance - deduct for missing days and absences
      adjustedBasicSalary = employee.salary * (presentDays / totalDaysElapsed);
      console.log(`Adjusted salary for current month: ${adjustedBasicSalary} (based on ${presentDays}/${totalDaysElapsed} days)`);
      
      // Apply deductions
      lateDeduction = lateDays * (dailyRate * 0.25); // 25% deduction for late arrivals
      leaveDeduction = leaveDays * (dailyRate * 0.5); // 50% deduction for leave days
    } else {
      // For past months - adjust based on full month
      adjustedBasicSalary = employee.salary * (presentDays / daysInMonth);
      console.log(`Adjusted salary for past month: ${adjustedBasicSalary} (based on ${presentDays}/${daysInMonth} days)`);
      
      // Apply deductions
      lateDeduction = lateDays * (dailyRate * 0.25); // 25% deduction for late arrivals
      leaveDeduction = leaveDays * (dailyRate * 0.5); // 50% deduction for leave days
    }
    
    // Find existing payroll or create a new one
    let payroll = await Payroll.findOne({ employeeId, month, year });
    
    if (!payroll) {
      // Create new payroll
      payroll = new Payroll({
        employeeId,
        month,
        year,
        employeeDetails: {
          name: employee.name,
          employeeID: employee.employeeID,
          department: employee.department,
          position: employee.position,
          joiningDate: employee.joiningDate,
          bankDetails: {
            bankName: employee.bankDetails?.bankName || employee.bankName || '',
            accountNumber: employee.bankDetails?.accountNumber || employee.accountNumber || '',
            accountHolderName: employee.bankDetails?.accountHolderName || employee.accountHolderName || employee.name || '',
            ifscCode: employee.bankDetails?.ifscCode || employee.ifscCode || ''
          }
        },
        attendanceSummary,
        basicSalary: adjustedBasicSalary, // Use attendance-adjusted salary
        attendanceRecords: attendanceRecords.map(record => record._id)
      });
    } else {
      // Update existing payroll
      payroll.employeeDetails = {
        name: employee.name,
        employeeID: employee.employeeID,
        department: employee.department,
        position: employee.position,
        joiningDate: employee.joiningDate,
        bankDetails: {
          bankName: employee.bankDetails?.bankName || employee.bankName || '',
          accountNumber: employee.bankDetails?.accountNumber || employee.accountNumber || '',
          accountHolderName: employee.bankDetails?.accountHolderName || employee.accountHolderName || employee.name || '',
          ifscCode: employee.bankDetails?.ifscCode || employee.ifscCode || ''
        }
      };
      payroll.attendanceSummary = attendanceSummary;
      payroll.basicSalary = adjustedBasicSalary; // Use attendance-adjusted salary
      payroll.attendanceRecords = attendanceRecords.map(record => record._id);
    }
    
    // Store the original salary for reference
    payroll.originalSalary = employee.salary;
    
    // Set standard allowances based on the adjusted salary
    payroll.allowances = {
      houseRent: adjustedBasicSalary * 0.4, // 40% of adjusted basic salary
      medical: adjustedBasicSalary * 0.1, // 10% of adjusted basic salary
      travel: adjustedBasicSalary * 0.05, // 5% of adjusted basic salary
      food: adjustedBasicSalary * 0.05, // 5% of adjusted basic salary
      special: 0,
      other: 0
    };
    
    // Set deductions based on the adjusted salary
    const healthInsuranceAmount = Math.min(adjustedBasicSalary * 0.05, 1000); // 5% of salary up to 1000 max
    
    payroll.deductions = {
      professionalTax: adjustedBasicSalary > 15000 ? 200 : 150, // Example tax rule
      incomeTax: calculateIncomeTax(adjustedBasicSalary), // Calculate income tax on adjusted salary
      providentFund: adjustedBasicSalary * 0.12, // 12% of adjusted basic salary
      healthInsurance: healthInsuranceAmount, // Proportional to salary
      loanRepayment: 0, // Can be updated manually if needed
      absentDeduction: 0, // Already adjusted in the basic salary
      lateDeduction: lateDeduction,
      other: 0
    };
    
    // Set leave deduction separately
    payroll.leaveDeduction = leaveDeduction;
    
    // Set overtime based on the adjusted salary
    payroll.overtime = {
      hours: totalOvertimeHours,
      rate: avgOvertimeRate,
      amount: totalOvertimeHours * avgOvertimeRate * (adjustedBasicSalary / (22 * 8)) // Use adjusted salary
    };
    
    // Calculate gross salary and net salary
    const allowanceTotal = 
      (payroll.allowances.houseRent || 0) +
      (payroll.allowances.medical || 0) +
      (payroll.allowances.travel || 0) +
      (payroll.allowances.food || 0) +
      (payroll.allowances.special || 0) +
      (payroll.allowances.other || 0);
    
    const deductionTotal = 
      (payroll.deductions.professionalTax || 0) +
      (payroll.deductions.incomeTax || 0) +
      (payroll.deductions.providentFund || 0) +
      (payroll.deductions.healthInsurance || 0) +
      (payroll.deductions.loanRepayment || 0) +
      (payroll.deductions.lateDeduction || 0) +
      (payroll.deductions.other || 0) +
      (payroll.leaveDeduction || 0);
    
    const overtimeAmount = payroll.overtime.amount || 0;
    
    payroll.grossSalary = adjustedBasicSalary + allowanceTotal + overtimeAmount;
    payroll.totalDeductions = deductionTotal;
    payroll.netSalary = payroll.grossSalary - payroll.totalDeductions;
    
    // Set the last calculation date
    payroll.lastCalculated = new Date();
    
    // Save payroll
    await payroll.save();
    
    return payroll;
  } catch (error) {
    console.error('Error syncing payroll with attendance:', error);
    throw error;
  }
};

// Helper function to create demo payroll for past months with no attendance records
const createDemoPayroll = async (employee, month, year, attendanceSummary) => {
  try {
    console.log(`Creating demo payroll for ${employee.name} for ${month}/${year}`);
    
    // Calculate adjusted salary based on attendance
    const daysInMonth = getDaysInMonth(parseInt(month), parseInt(year));
    const adjustedBasicSalary = employee.salary * (attendanceSummary.present / daysInMonth);
    console.log(`Demo adjusted salary: ${employee.salary} × (${attendanceSummary.present}/${daysInMonth}) = ${adjustedBasicSalary}`);
    
    // Find existing payroll or create a new one
    let payroll = await Payroll.findOne({ 
      employeeId: employee._id, 
      month: parseInt(month), 
      year: parseInt(year) 
    });
    
    if (!payroll) {
      // Create new payroll with demo data
      payroll = new Payroll({
        employeeId: employee._id,
        month: parseInt(month),
        year: parseInt(year),
        employeeDetails: {
          name: employee.name,
          employeeID: employee.employeeID,
          department: employee.department,
          position: employee.position,
          joiningDate: employee.joiningDate,
          bankDetails: {
            bankName: employee.bankDetails?.bankName || employee.bankName || '',
            accountNumber: employee.bankDetails?.accountNumber || employee.accountNumber || '',
            accountHolderName: employee.bankDetails?.accountHolderName || employee.accountHolderName || employee.name || '',
            ifscCode: employee.bankDetails?.ifscCode || employee.ifscCode || ''
          }
        },
        attendanceSummary: attendanceSummary,
        basicSalary: adjustedBasicSalary, // Use attendance-adjusted salary
        originalSalary: employee.salary, // Store original salary for reference
        attendanceRecords: [] // No actual records for demo
      });
    } else {
      // Update existing payroll with demo data
      payroll.employeeDetails = {
        name: employee.name,
        employeeID: employee.employeeID,
        department: employee.department,
        position: employee.position,
        joiningDate: employee.joiningDate,
        bankDetails: {
          bankName: employee.bankDetails?.bankName || employee.bankName || '',
          accountNumber: employee.bankDetails?.accountNumber || employee.accountNumber || '',
          accountHolderName: employee.bankDetails?.accountHolderName || employee.accountHolderName || employee.name || '',
          ifscCode: employee.bankDetails?.ifscCode || employee.ifscCode || ''
        }
      };
      payroll.attendanceSummary = attendanceSummary;
      payroll.basicSalary = adjustedBasicSalary; // Use attendance-adjusted salary
      payroll.originalSalary = employee.salary; // Store original salary for reference
    }
    
    // Set standard allowances based on adjusted salary
    payroll.allowances = {
      houseRent: adjustedBasicSalary * 0.4, // 40% of adjusted basic salary
      medical: adjustedBasicSalary * 0.1, // 10% of adjusted basic salary
      travel: adjustedBasicSalary * 0.05, // 5% of adjusted basic salary
      food: adjustedBasicSalary * 0.05, // 5% of adjusted basic salary
      special: 0,
      other: 0
    };
    
    // For past months, assume some overtime at standard rate
    const overtimeHours = Math.floor(Math.random() * 5); // 0-4 hours of overtime
    
    // Set deductions
    const healthInsuranceAmount = Math.min(employee.salary * 0.05, 1000); // 5% of salary up to 1000 max
    
    payroll.deductions = {
      professionalTax: employee.salary > 15000 ? 200 : 150,
      incomeTax: calculateIncomeTax(employee.salary),
      providentFund: employee.salary * 0.12,
      healthInsurance: healthInsuranceAmount,
      loanRepayment: 0,
      absentDeduction: (attendanceSummary.absent * (employee.salary / attendanceSummary.totalWorkingDays)),
      lateDeduction: (attendanceSummary.late * (employee.salary / attendanceSummary.totalWorkingDays) * 0.25),
      other: 0
    };
    
    // Set overtime
    payroll.overtime = {
      hours: overtimeHours,
      rate: 1.5,
      amount: overtimeHours * 1.5 * (employee.salary / (22 * 8))
    };
    
    // Set the calculation date to be end of the month for past months
    const pastDate = new Date(parseInt(year), parseInt(month), 0); // Last day of the month
    payroll.lastCalculated = pastDate;
    
    // Save payroll
    await payroll.save();
    
    return payroll;
  } catch (error) {
    console.error('Error creating demo payroll:', error);
    throw error;
  }
};

// Helper function to calculate income tax (simplified example)
const calculateIncomeTax = (monthlySalary) => {
  const annualSalary = monthlySalary * 12;
  let tax = 0;
  
  if (annualSalary <= 250000) {
    tax = 0;
  } else if (annualSalary <= 500000) {
    tax = (annualSalary - 250000) * 0.05;
  } else if (annualSalary <= 750000) {
    tax = 12500 + (annualSalary - 500000) * 0.10;
  } else if (annualSalary <= 1000000) {
    tax = 37500 + (annualSalary - 750000) * 0.15;
  } else if (annualSalary <= 1250000) {
    tax = 75000 + (annualSalary - 1000000) * 0.20;
  } else if (annualSalary <= 1500000) {
    tax = 125000 + (annualSalary - 1250000) * 0.25;
  } else {
    tax = 187500 + (annualSalary - 1500000) * 0.30;
  }
  
  // Return monthly tax amount
  return tax / 12;
};

// Helper function for formatting decimal values
const formatToDecimal = (amount) => {
  return Math.round(amount * 100) / 100;
};

// Get all payrolls with filtering options and real-time generation
export const getPayrolls = async (req, res) => {
  try {
    const { month, year, employeeId, status } = req.query;
    
    // Default to current month and year if not specified
    const currentMonth = new Date().getMonth() + 1; // JS months are 0-indexed
    const currentYear = new Date().getFullYear();
    
    const payrollMonth = month ? parseInt(month) : currentMonth;
    const payrollYear = year ? parseInt(year) : currentYear;
    
    // Get all employees for auto-sync of payrolls
    let employees = [];
    if (employeeId) {
      // If employeeId is specified, only get that employee
      const employee = await Employee.findById(employeeId);
      if (employee) employees = [employee];
    } else {
      // Get all employees, not just active ones
      const allEmployees = await Employee.find({});
      
      // Then filter to only include employees who had joined by the requested month/year
      employees = allEmployees.filter(employee => {
        const joiningDate = new Date(employee.joiningDate);
        const joiningYear = joiningDate.getFullYear();
        const joiningMonth = joiningDate.getMonth() + 1; // JS months are 0-indexed
        
        // Employee is valid if they joined on or before the requested month/year
        return (joiningYear < payrollYear) || 
               (joiningYear === payrollYear && joiningMonth <= payrollMonth);
      });
      
      console.log(`Filtered ${allEmployees.length} total employees to ${employees.length} who had joined by ${payrollMonth}/${payrollYear}`);
    }
    
    // Sync payrolls for all retrieved employees
    const syncPromises = employees.map(employee => 
      syncPayrollWithAttendance(employee._id, payrollMonth, payrollYear)
        .catch(err => {
          console.error(`Error syncing payroll for employee ${employee.name}:`, err);
          return null; // Continue with other employees even if one fails
        })
    );
    
    await Promise.all(syncPromises);
    
    // Build filter object for fetching updated payrolls
    const filter = {
      month: payrollMonth,
      year: payrollYear
    };
    
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.paymentStatus = status;
    
    // Only allow admin to see all payrolls, employees can only see their own
    if (req.user && req.user.role !== 'admin') {
      filter.employeeId = req.user.userId;
    }
    
    // Fetch all payrolls that match the filter
    let payrolls = await Payroll.find(filter).sort({ 'employeeDetails.name': 1 });
    
    // Get the valid employee IDs (those who had joined by the requested month)
    const validEmployeeIds = employees.map(emp => emp._id.toString());
    
    // Post-filter the payrolls to only include employees who had joined by the requested month
    // This ensures we don't show payrolls for employees who joined after the requested month
    const filteredPayrolls = payrolls.filter(payroll => {
      return validEmployeeIds.includes(payroll.employeeId.toString());
    });
    
    console.log(`Filtered payrolls from ${payrolls.length} to ${filteredPayrolls.length} based on joining date`);
    
    // Use the filtered payrolls
    payrolls = filteredPayrolls;
    
    return res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls,
      month: payrollMonth,
      year: payrollYear,
      lastCalculated: new Date()
    });
  } catch (error) {
    console.error("Error fetching payrolls:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get a specific payroll by ID
export const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll ID format"
      });
    }
    
    // Find payroll
    const payroll = await Payroll.findById(id);
    
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found"
      });
    }
    
    console.log(`Fetching detailed payroll for ID: ${id}, Employee: ${payroll.employeeId}, Period: ${payroll.month}/${payroll.year}`);
    
    // Sync payroll with current employee and attendance data
    const updatedPayroll = await syncPayrollWithAttendance(payroll.employeeId, payroll.month, payroll.year);
    
    // Our updated syncPayrollWithAttendance now handles future months properly
    // so this conditional is redundant but kept for safety
    if (!updatedPayroll) {
      return res.status(200).json({
        success: true,
        message: "Could not process payroll for this period",
        data: payroll // Return original payroll without updates
      });
    }
    
    return res.status(200).json({
      success: true,
      data: payroll,
      lastCalculated: new Date()
    });
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Generate payroll for a single employee
export const generatePayroll = async (req, res) => {
  try {
    // Only admin can generate payrolls
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admin privileges required"
      });
    }
    
    const { employeeId, month, year, basicSalary, allowances, deductions, overtime, bonus, leaveDeduction } = req.body;
    
    if (!employeeId || !month || !year || !basicSalary) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }
    
    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    
    // Check if payroll already exists for this month/year
    const existingPayroll = await Payroll.findOne({
      employeeId,
      month: parseInt(month),
      year: parseInt(year)
    });
    
    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: "Payroll already exists for this employee in the selected month/year"
      });
    }
    
    // Calculate gross salary
    const allowanceTotal = 
      (allowances?.houseRent || 0) +
      (allowances?.medical || 0) +
      (allowances?.travel || 0) +
      (allowances?.food || 0) +
      (allowances?.special || 0) +
      (allowances?.other || 0);
    
    const deductionTotal = 
      (deductions?.professionalTax || 0) +
      (deductions?.incomeTax || 0) +
      (deductions?.providentFund || 0) +
      (deductions?.healthInsurance || 0) +
      (deductions?.loanRepayment || 0) +
      (deductions?.other || 0);
    
    const overtimeAmount = (overtime?.hours || 0) * (overtime?.rate || 0);
    
    const grossSalary = parseFloat(basicSalary) + allowanceTotal + (bonus || 0) + overtimeAmount;
    const totalDeductions = deductionTotal + (leaveDeduction || 0);
    const netSalary = grossSalary - totalDeductions;
    
    // Determine health insurance amount if not explicitly provided
    const healthInsuranceAmount = deductions?.healthInsurance || Math.min(parseFloat(basicSalary) * 0.05, 1000);
    
    // Create new payroll
    const newPayroll = new Payroll({
      employeeId,
      month: parseInt(month),
      year: parseInt(year),
      basicSalary: parseFloat(basicSalary),
      allowances: {
        houseRent: allowances?.houseRent || 0,
        medical: allowances?.medical || 0,
        travel: allowances?.travel || 0,
        food: allowances?.food || 0,
        special: allowances?.special || 0,
        other: allowances?.other || 0
      },
      deductions: {
        professionalTax: deductions?.professionalTax || 0,
        incomeTax: deductions?.incomeTax || 0,
        providentFund: deductions?.providentFund || 0,
        healthInsurance: deductions?.healthInsurance || healthInsuranceAmount,
        loanRepayment: deductions?.loanRepayment || 0,
        other: deductions?.other || 0
      },
      overtime: {
        hours: parseFloat(overtime?.hours || 0),
        rate: parseFloat(overtime?.rate || 0),
        amount: parseFloat(overtimeAmount.toFixed(2))
      },
      bonus: bonus || 0,
      leaveDeduction: leaveDeduction || 0,
      grossSalary,
      totalDeductions,
      netSalary,
      generatedBy: req.user.userId,
      employeeDetails: {
        name: employee.name,
        employeeID: employee.employeeID,
        department: employee.department,
        position: employee.position,
        joiningDate: employee.joiningDate,
        bankDetails: {
          bankName: employee.bankDetails?.bankName || employee.bankName || '',
          accountNumber: employee.bankDetails?.accountNumber || employee.accountNumber || '',
          accountHolderName: employee.bankDetails?.accountHolderName || employee.accountHolderName || employee.name || '',
          ifscCode: employee.bankDetails?.ifscCode || employee.ifscCode || ''
        }
      }
    });
    
    await newPayroll.save();
    
    return res.status(201).json({
      success: true,
      message: "Payroll generated successfully",
      data: newPayroll
    });
  } catch (error) {
    console.error("Error generating payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Generate payroll for all employees
export const generateBulkPayroll = async (req, res) => {
  try {
    // Only admin can generate payrolls
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admin privileges required"
      });
    }
    
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required"
      });
    }
    
    // Get all employees, not just active ones
    const employees = await Employee.find({});
    
    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No employees found"
      });
    }
    
    // Check which employees already have payrolls for this month/year
    const existingPayrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year)
    }).select('employeeId');
    
    const existingEmployeeIds = existingPayrolls.map(p => p.employeeId.toString());
    
    // Filter out employees who already have payrolls
    const employeesToProcess = employees.filter(emp => 
      !existingEmployeeIds.includes(emp._id.toString())
    );
    
    if (employeesToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All employees already have payrolls for this month/year"
      });
    }
    
    // Generate payrolls for remaining employees
    const payrollsToCreate = employeesToProcess.map(employee => {
      // Use employee.baseSalary or default to 0 if not set
      const basicSalary = employee.baseSalary || 0;
      
      // Calculate auto values based on basic salary
      const houseRent = basicSalary * 0.4; // 40% of basic
      const medical = basicSalary * 0.1; // 10% of basic
      const travel = basicSalary * 0.05; // 5% of basic
      const food = basicSalary * 0.05; // 5% of basic
      const professionalTax = basicSalary > 15000 ? 200 : 150; // Example tax rule
      const providentFund = basicSalary * 0.12; // 12% of basic
      const healthInsuranceAmount = Math.min(basicSalary * 0.05, 1000); // 5% of salary up to 1000 max
      const incomeTax = calculateIncomeTax(basicSalary);
      
      // Calculate totals correctly
      const allowanceTotal = houseRent + medical + travel + food;
      const deductionTotal = professionalTax + providentFund + healthInsuranceAmount + incomeTax;
      
      const grossSalary = basicSalary + allowanceTotal;
      const netSalary = grossSalary - deductionTotal;
      
      // Get the days in this month for attendance summary
      const daysInMonth = getDaysInMonth(parseInt(month), parseInt(year));
      
      return {
        employeeId: employee._id,
        month: parseInt(month),
        year: parseInt(year),
        basicSalary,
        allowances: {
          houseRent,
          medical,
          travel,
          food,
          special: 0,
          other: 0
        },
        deductions: {
          professionalTax,
          providentFund,
          incomeTax,
          healthInsurance: healthInsuranceAmount,
          loanRepayment: 0,
          absentDeduction: 0,
          lateDeduction: 0,
          other: 0
        },
        overtime: {
          hours: 0,
          rate: 1.5,
          amount: 0
        },
        bonus: 0,
        leaveDeduction: 0,
        grossSalary,
        totalDeductions: deductionTotal,
        netSalary,
        attendanceSummary: {
          present: daysInMonth,
          absent: 0,
          late: 0,
          onLeave: 0,
          workingDays: daysInMonth,
          totalWorkingDays: daysInMonth
        },
        generatedBy: req.user.userId,
        employeeDetails: {
          name: employee.name,
          employeeID: employee.employeeID,
          department: employee.department,
          position: employee.position,
          joiningDate: employee.joiningDate,
          bankDetails: {
            bankName: employee.bankDetails?.bankName || employee.bankName || '',
            accountNumber: employee.bankDetails?.accountNumber || employee.accountNumber || '',
            accountHolderName: employee.bankDetails?.accountHolderName || employee.accountHolderName || employee.name || '',
            ifscCode: employee.bankDetails?.ifscCode || employee.ifscCode || ''
          }
        }
      };
    });
    
    // Save all payrolls
    const createdPayrolls = await Payroll.insertMany(payrollsToCreate);
    
    return res.status(201).json({
      success: true,
      message: `Generated ${createdPayrolls.length} payrolls successfully`,
      processed: createdPayrolls.length,
      skipped: existingEmployeeIds.length,
      data: createdPayrolls
    });
  } catch (error) {
    console.error("Error generating bulk payrolls:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Update payroll payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod, remarks, paymentDate } = req.body;
    
    // Find the payroll record
    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found"
      });
    }

    // First, sync with latest attendance data
    await syncPayrollWithAttendance(payroll.employeeId, payroll.month, payroll.year);
    
    // Fetch the updated payroll and then update payment details
    const updatedPayroll = await Payroll.findById(id);
    
    // Update payment details
    updatedPayroll.paymentStatus = paymentStatus;
    if (paymentMethod) updatedPayroll.paymentMethod = paymentMethod;
    if (remarks) updatedPayroll.remarks = remarks;
    
    // Set payment date if provided, or set it to today if status is changing to Paid and no date is provided
    if (paymentDate) {
      updatedPayroll.paymentDate = new Date(paymentDate);
    } else if (paymentStatus === 'Paid' && (updatedPayroll.paymentStatus !== 'Paid' || !updatedPayroll.paymentDate)) {
      updatedPayroll.paymentDate = new Date();
    }
    
    // If status is not Paid, allow clearing the payment date
    if (paymentStatus !== 'Paid' && paymentDate === '') {
      updatedPayroll.paymentDate = null;
    }
    
    await updatedPayroll.save();
    
    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: updatedPayroll
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: error.message
    });
  }
};

// Batch update payment status for multiple payrolls
export const batchUpdatePaymentStatus = async (req, res) => {
  try {
    // Only admin can update payment status
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admin privileges required"
      });
    }
    
    const { payrollIds, paymentStatus, paymentMethod, paymentDate, remarks } = req.body;
    
    if (!payrollIds || !Array.isArray(payrollIds) || payrollIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No payroll IDs provided"
      });
    }
    
    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "Payment status is required"
      });
    }
    
    if (!['Pending', 'Processing', 'Paid', 'Failed'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status"
      });
    }
    
    const updatePromises = payrollIds.map(async (id) => {
      try {
        // Find the payroll
        const payroll = await Payroll.findById(id);
        
        if (!payroll) {
          return { id, success: false, message: "Payroll not found" };
        }
        
        // Update payment details
        payroll.paymentStatus = paymentStatus;
        if (paymentMethod) payroll.paymentMethod = paymentMethod;
        if (remarks) payroll.remarks = remarks;
        
        // Set payment date if provided, or set it to today if status is changing to Paid and no date is provided
        if (paymentDate) {
          payroll.paymentDate = new Date(paymentDate);
        } else if (paymentStatus === 'Paid' && (payroll.paymentStatus !== 'Paid' || !payroll.paymentDate)) {
          payroll.paymentDate = new Date();
        }
        
        // If status is not Paid, allow clearing the payment date
        if (paymentStatus !== 'Paid' && paymentDate === '') {
          payroll.paymentDate = null;
        }
        
        await payroll.save();
        return { id, success: true };
      } catch (error) {
        console.error(`Error updating payroll ${id}:`, error);
        return { id, success: false, message: error.message };
      }
    });
    
    const results = await Promise.all(updatePromises);
    const success = results.every(result => result.success);
    const successCount = results.filter(result => result.success).length;
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: `Successfully updated ${successCount} payroll records`,
        results
      });
    } else {
      return res.status(207).json({
        success: false,
        message: `Updated ${successCount} out of ${payrollIds.length} payroll records`,
        results
      });
    }
  } catch (error) {
    console.error("Error in batch update payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Update payroll details
export const updatePayroll = async (req, res) => {
  try {
    // Only admin can update payroll
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admin privileges required"
      });
    }
    
    const { id } = req.params;
    const {
      basicSalary,
      allowances,
      deductions,
      overtime,
      bonus,
      leaveDeduction,
      paymentStatus,
      paymentMethod,
      paymentDate,
      remarks
    } = req.body;
    
    const payroll = await Payroll.findById(id);
    
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found"
      });
    }
    
    // Allow updates for any status - removed the paid status restriction
    
    // Update fields if provided
    if (basicSalary) payroll.basicSalary = parseFloat(basicSalary);
    
    if (allowances) {
      if (allowances.houseRent !== undefined) payroll.allowances.houseRent = parseFloat(allowances.houseRent);
      if (allowances.medical !== undefined) payroll.allowances.medical = parseFloat(allowances.medical);
      if (allowances.travel !== undefined) payroll.allowances.travel = parseFloat(allowances.travel);
      if (allowances.food !== undefined) payroll.allowances.food = parseFloat(allowances.food);
      if (allowances.special !== undefined) payroll.allowances.special = parseFloat(allowances.special);
      if (allowances.other !== undefined) payroll.allowances.other = parseFloat(allowances.other);
    }
    
    if (deductions) {
      if (deductions.professionalTax !== undefined) payroll.deductions.professionalTax = parseFloat(deductions.professionalTax);
      if (deductions.incomeTax !== undefined) payroll.deductions.incomeTax = parseFloat(deductions.incomeTax);
      if (deductions.providentFund !== undefined) payroll.deductions.providentFund = parseFloat(deductions.providentFund);
      if (deductions.healthInsurance !== undefined) payroll.deductions.healthInsurance = parseFloat(deductions.healthInsurance);
      if (deductions.loanRepayment !== undefined) payroll.deductions.loanRepayment = parseFloat(deductions.loanRepayment);
      if (deductions.other !== undefined) payroll.deductions.other = parseFloat(deductions.other);
    }
    
    if (overtime) {
      if (overtime.hours !== undefined) payroll.overtime.hours = parseFloat(overtime.hours);
      if (overtime.rate !== undefined) payroll.overtime.rate = parseFloat(overtime.rate);
      if (overtime.amount !== undefined) payroll.overtime.amount = parseFloat(overtime.amount);
      else payroll.overtime.amount = parseFloat((payroll.overtime.hours * payroll.overtime.rate).toFixed(2));
    }
    
    if (bonus !== undefined) payroll.bonus = parseFloat(bonus);
    if (leaveDeduction !== undefined) payroll.leaveDeduction = parseFloat(leaveDeduction);
    
    // Update payment information
    if (paymentStatus) payroll.paymentStatus = paymentStatus;
    if (paymentMethod) payroll.paymentMethod = paymentMethod;
    if (paymentDate) payroll.paymentDate = new Date(paymentDate);
    if (remarks !== undefined) payroll.remarks = remarks;
    
    // If status is not Paid and paymentDate is empty string, clear the payment date
    if (paymentStatus !== 'Paid' && paymentDate === '') {
      payroll.paymentDate = null;
    }
    
    // Recalculate gross salary and net salary
    const allowanceTotal = formatToDecimal(
      (payroll.allowances.houseRent || 0) +
      (payroll.allowances.medical || 0) +
      (payroll.allowances.travel || 0) +
      (payroll.allowances.food || 0) +
      (payroll.allowances.special || 0) +
      (payroll.allowances.other || 0)
    );
    
    const deductionTotal = formatToDecimal(
      (payroll.deductions.professionalTax || 0) +
      (payroll.deductions.incomeTax || 0) +
      (payroll.deductions.providentFund || 0) +
      (payroll.deductions.healthInsurance || 0) +
      (payroll.deductions.loanRepayment || 0) +
      (payroll.deductions.other || 0)
    );
    
    payroll.grossSalary = formatToDecimal(
      (payroll.basicSalary || 0) + allowanceTotal + (payroll.bonus || 0) + (payroll.overtime?.amount || 0)
    );
    payroll.totalDeductions = formatToDecimal(deductionTotal + (payroll.leaveDeduction || 0));
    payroll.netSalary = formatToDecimal(payroll.grossSalary - payroll.totalDeductions);
    
    await payroll.save();
    
    return res.status(200).json({
      success: true,
      message: "Payroll updated successfully",
      data: payroll
    });
  } catch (error) {
    console.error("Error updating payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Delete payroll
export const deletePayroll = async (req, res) => {
  try {
    // Only admin can delete payroll
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admin privileges required"
      });
    }
    
    const { id } = req.params;
    
    const payroll = await Payroll.findById(id);
    
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found"
      });
    }
    
    // Don't allow deleting if already paid
    if (payroll.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a payroll that has already been paid"
      });
    }
    
    await Payroll.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: "Payroll deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get payroll summary (for admin dashboard)
export const getPayrollSummary = async (req, res) => {
  try {
    // Removed admin-only check to allow all users to view summary
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required"
      });
    }
    
    const payrollMonth = parseInt(month);
    const payrollYear = parseInt(year);
    
    // Validate month and year formats
    if (isNaN(payrollMonth) || payrollMonth < 1 || payrollMonth > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Month must be between 1-12."
      });
    }
    
    if (isNaN(payrollYear) || payrollYear < 2020 || payrollYear > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid year format. Year must be between 2020-2100."
      });
    }
    
    // Get employees count
    const totalEmployees = await Employee.countDocuments({ status: 'Active' });
    
    // Sync all employee payrolls for the selected month and year
    const employees = await Employee.find({});
    console.log(`Syncing payrolls for ${employees.length} employees for ${payrollMonth}/${payrollYear}`);
    
    // First pass: sync all payrolls
    for (const employee of employees) {
      try {
        // For historical data processing - check if we have attendance records
        const attendanceCount = await Attendance.countDocuments({
          employeeId: employee._id,
          payrollMonth: payrollMonth,
          payrollYear: payrollYear
        });
        
        console.log(`Employee ${employee.name} has ${attendanceCount} attendance records for ${payrollMonth}/${payrollYear}`);
        
        // Even if no attendance records, always attempt to sync the payroll
        // This will ensure we handle historical data properly
        await syncPayrollWithAttendance(employee._id, payrollMonth, payrollYear);
      } catch (error) {
        console.error(`Error syncing payroll for employee ${employee.name}:`, error);
      }
    }
    
    // Get updated payroll stats for the month
    const payrolls = await Payroll.find({
      month: payrollMonth,
      year: payrollYear
    });
    
    const processedCount = payrolls.length;
    
    const pendingCount = payrolls.filter(p => p.paymentStatus === 'Pending').length;
    const processingCount = payrolls.filter(p => p.paymentStatus === 'Processing').length;
    const paidCount = payrolls.filter(p => p.paymentStatus === 'Paid').length;
    const failedCount = payrolls.filter(p => p.paymentStatus === 'Failed').length;
    
    // Calculate financial totals with proper decimal formatting
    const formatToDecimal = (amount) => Math.round(amount * 100) / 100;
    
    const totalPayroll = formatToDecimal(
      payrolls.reduce((sum, p) => sum + p.netSalary, 0)
    );
    
    const totalNetPayout = formatToDecimal(
      payrolls.reduce((sum, p) => sum + p.netSalary, 0)
    );
    
    const totalDeductions = formatToDecimal(
      payrolls.reduce((sum, p) => sum + p.totalDeductions, 0)
    );
    
    return res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        processedCount,
        pendingCount,
        processingCount,
        paidCount,
        failedCount,
        notProcessedCount: totalEmployees - processedCount,
        totalPayroll,
        totalNetPayout,
        totalDeductions,
        month: parseInt(month),
        year: parseInt(year),
        lastCalculated: new Date()
      }
    });
  } catch (error) {
    console.error("Error getting payroll summary:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get payroll reports with analytics data
export const getPayrollReports = async (req, res) => {
  try {
    const { startDate, endDate, department, format } = req.query;
    
    // Parse dates
    const parsedStartDate = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1); // Default to Jan 1 of current year
    const parsedEndDate = endDate ? new Date(endDate) : new Date(); // Default to current date
    
    // Build base query
    let query = {};
    
    // Add date range using month and year fields
    const startMonth = parsedStartDate.getMonth() + 1;
    const startYear = parsedStartDate.getFullYear();
    const endMonth = parsedEndDate.getMonth() + 1;
    const endYear = parsedEndDate.getFullYear();
    
    // Construct query for date range using month/year fields
    if (startYear === endYear) {
      query.year = startYear;
      query.month = { $gte: startMonth, $lte: endMonth };
    } else {
      // Complex condition for multi-year ranges
      query.$or = [
        { year: startYear, month: { $gte: startMonth } },
        { year: { $gt: startYear, $lt: endYear } },
        { year: endYear, month: { $lte: endMonth } }
      ];
    }
    
    // Add department filter if provided
    if (department) {
      query['employeeDetails.department'] = department;
    }
    
    // Fetch payrolls
    const payrolls = await Payroll.find(query).sort({ year: 1, month: 1 });
    
    // Calculate analytics
    const analytics = {
      totalEmployees: new Set(payrolls.map(p => p.employeeId.toString())).size,
      totalPayroll: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
      avgSalary: payrolls.length > 0 ? payrolls.reduce((sum, p) => sum + p.netSalary, 0) / payrolls.length : 0,
      salaryByDepartment: {},
      salaryTrend: [],
      taxDeductions: payrolls.reduce((sum, p) => sum + (p.deductions.incomeTax || 0), 0),
      bonusDistributed: payrolls.reduce((sum, p) => sum + (p.bonus || 0), 0),
    };
    
    // Calculate department-wise salary distribution
    const departments = {};
    payrolls.forEach(payroll => {
      const dept = payroll.employeeDetails.department || 'Unknown';
      if (!departments[dept]) {
        departments[dept] = { count: 0, total: 0 };
      }
      departments[dept].count++;
      departments[dept].total += payroll.netSalary;
    });
    
    // Calculate average by department
    for (const [dept, data] of Object.entries(departments)) {
      analytics.salaryByDepartment[dept] = {
        total: data.total,
        average: data.total / data.count,
        employees: data.count
      };
    }
    
    // Calculate month-wise salary trend
    const monthlyTrend = {};
    payrolls.forEach(payroll => {
      const key = `${payroll.year}-${payroll.month.toString().padStart(2, '0')}`;
      if (!monthlyTrend[key]) {
        monthlyTrend[key] = { total: 0, count: 0, taxes: 0, bonus: 0 };
      }
      monthlyTrend[key].total += payroll.netSalary;
      monthlyTrend[key].count++;
      monthlyTrend[key].taxes += (payroll.deductions.incomeTax || 0);
      monthlyTrend[key].bonus += (payroll.bonus || 0);
    });
    
    // Sort and format the trend data
    analytics.salaryTrend = Object.keys(monthlyTrend)
      .sort()
      .map(key => ({
        period: key,
        totalSalary: monthlyTrend[key].total,
        averageSalary: monthlyTrend[key].total / monthlyTrend[key].count,
        employees: monthlyTrend[key].count,
        taxes: monthlyTrend[key].taxes,
        bonus: monthlyTrend[key].bonus
      }));

    // Payment Status Distribution
    const paymentStatusCount = {
      Paid: payrolls.filter(p => p.paymentStatus === 'Paid').length,
      Pending: payrolls.filter(p => p.paymentStatus === 'Pending').length,
      Failed: payrolls.filter(p => p.paymentStatus === 'Failed').length,
      Processing: payrolls.filter(p => p.paymentStatus === 'Processing').length
    };
    analytics.paymentStatusDistribution = paymentStatusCount;
    
    // If format is 'excel', we'll just return the data
    // Frontend will handle the Excel generation
    
    res.status(200).json({
      success: true,
      data: {
        analytics,
        payrolls
      }
    });
  } catch (error) {
    console.error('Error generating payroll reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payroll reports',
      error: error.message
    });
  }
};

// Calculate tax for an employee's salary
export const calculateTaxBreakdown = async (req, res) => {
  try {
    const { employeeId, financialYear, month, income, deductions } = req.body;
    
    // Validation
    if (!employeeId || !financialYear) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and financial year are required',
      });
    }
    
    // Get employee data
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }
    
    // Parse the financial year (format: 2023-2024)
    const [startYear, endYear] = financialYear.split('-').map(year => parseInt(year));
    
    // Calculate taxable income
    const annualSalary = income ? parseFloat(income) : employee.salary * 12;
    
    // Calculate tax deductions (Section 80C, 80D, etc.)
    const taxDeductions = {
      section80C: parseFloat(deductions?.section80C || 0),
      section80D: parseFloat(deductions?.section80D || 0),
      housingLoanInterest: parseFloat(deductions?.housingLoanInterest || 0),
      educationLoanInterest: parseFloat(deductions?.educationLoanInterest || 0),
      other: parseFloat(deductions?.other || 0)
    };
    
    // Calculate total deductions (capped at appropriate limits as per Indian tax laws)
    // Section 80C capped at 150,000
    const section80CDeduction = Math.min(taxDeductions.section80C, 150000);
    // Section 80D capped at 25,000 (50,000 for senior citizens)
    const section80DDeduction = Math.min(taxDeductions.section80D, 25000);
    // Housing loan interest deduction (capped at 200,000 for self-occupied property)
    const housingLoanDeduction = Math.min(taxDeductions.housingLoanInterest, 200000);
    // Education loan interest deduction (no cap)
    const educationLoanDeduction = taxDeductions.educationLoanInterest;
    // Other deductions
    const otherDeductions = taxDeductions.other;
    
    // Calculate total deductions
    const totalDeductions = section80CDeduction + section80DDeduction + housingLoanDeduction + educationLoanDeduction + otherDeductions;
    
    // Calculate taxable income
    const taxableIncome = Math.max(0, annualSalary - totalDeductions);
    
    // Define tax slabs (Indian tax slabs for FY 2023-24, for example)
    // These should be stored in config and updated yearly
    const taxSlabs = [
      { start: 0, end: 250000, rate: 0 },
      { start: 250000, end: 500000, rate: 0.05 },
      { start: 500000, end: 750000, rate: 0.10 },
      { start: 750000, end: 1000000, rate: 0.15 },
      { start: 1000000, end: 1250000, rate: 0.20 },
      { start: 1250000, end: 1500000, rate: 0.25 },
      { start: 1500000, end: Infinity, rate: 0.30 }
    ];
    
    // Calculate tax for each slab
    let totalTax = 0;
    const taxBreakdown = [];
    
    for (const slab of taxSlabs) {
      if (taxableIncome > slab.start) {
        const slabAmount = Math.min(taxableIncome - slab.start, slab.end - slab.start);
        const slabTax = slabAmount * slab.rate;
        
        totalTax += slabTax;
        
        taxBreakdown.push({
          bracketStart: slab.start,
          bracketEnd: slab.end,
          taxRate: slab.rate,
          taxableAmount: slabAmount,
          taxAmount: slabTax
        });
        
        if (taxableIncome <= slab.end) break;
      }
    }
    
    // Add cess (4% of tax)
    const cess = totalTax * 0.04;
    const finalTaxAmount = totalTax + cess;
    
    // Calculate monthly tax contribution
    const monthlyTax = finalTaxAmount / 12;
    
    // Return tax calculation
    res.status(200).json({
      success: true,
      data: {
        employeeDetails: {
          name: employee.name,
          employeeID: employee.employeeID,
          department: employee.department,
          position: employee.position
        },
        financialYear,
        income: {
          annualSalary,
          deductions: {
            section80C: section80CDeduction,
            section80D: section80DDeduction,
            housingLoanInterest: housingLoanDeduction,
            educationLoanInterest: educationLoanDeduction,
            other: otherDeductions,
            totalDeductions
          },
          taxableIncome
        },
        taxBreakdown,
        taxSummary: {
          totalTax,
          cess,
          finalTaxAmount,
          monthlyTax
        }
      }
    });
  } catch (error) {
    console.error('Error calculating tax breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate tax breakdown',
      error: error.message
    });
  }
};

// Manage bonus and incentives
export const manageBonusIncentives = async (req, res) => {
  try {
    const {
      payrollId,
      bonusDetails,
      description
    } = req.body;

    // Validation
    if (!payrollId) {
      return res.status(400).json({
        success: false,
        message: 'Payroll ID is required'
      });
    }

    // Find the payroll record
    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Initialize bonus details if not present
    if (!payroll.bonusDetails) {
      payroll.bonusDetails = {
        performanceBonus: 0,
        festivalBonus: 0,
        incentives: 0,
        commission: 0,
        oneTimeBonus: 0,
        description: ''
      };
    }

    // Update bonus details
    if (bonusDetails) {
      Object.keys(bonusDetails).forEach(key => {
        if (key in payroll.bonusDetails && key !== 'description') {
          payroll.bonusDetails[key] = parseFloat(bonusDetails[key]) || 0;
        }
      });
    }

    // Update description if provided
    if (description !== undefined) {
      payroll.bonusDetails.description = description;
    }

    // Calculate total bonus
    const totalBonus = (
      (payroll.bonusDetails.performanceBonus || 0) +
      (payroll.bonusDetails.festivalBonus || 0) +
      (payroll.bonusDetails.incentives || 0) +
      (payroll.bonusDetails.commission || 0) +
      (payroll.bonusDetails.oneTimeBonus || 0)
    );

    // Update the total bonus
    payroll.bonus = totalBonus;

    // Save the updated payroll
    await payroll.save();

    res.status(200).json({
      success: true,
      message: 'Bonus and incentives updated successfully',
      data: payroll
    });
  } catch (error) {
    console.error('Error managing bonus and incentives:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bonus and incentives',
      error: error.message
    });
  }
};

// Bulk manage bonus for multiple employees
export const bulkManageBonus = async (req, res) => {
  try {
    const {
      employees,
      bonusType,
      bonusAmount,
      description,
      month,
      year
    } = req.body;

    // Validation
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Employees array is required'
      });
    }

    if (!bonusType || !bonusAmount) {
      return res.status(400).json({
        success: false,
        message: 'Bonus type and amount are required'
      });
    }

    // Ensure bonusType is valid
    const validBonusTypes = ['performanceBonus', 'festivalBonus', 'incentives', 'commission', 'oneTimeBonus'];
    if (!validBonusTypes.includes(bonusType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bonus type'
      });
    }

    // Use current month/year if not provided
    const currentDate = new Date();
    const bonusMonth = month || currentDate.getMonth() + 1;
    const bonusYear = year || currentDate.getFullYear();

    // Results tracking
    const results = {
      success: [],
      failed: []
    };

    // Process each employee
    for (const employeeId of employees) {
      try {
        // Find the payroll record for this employee for the given month/year
        let payroll = await Payroll.findOne({
          employeeId,
          month: bonusMonth,
          year: bonusYear
        });

        // If no payroll exists, we might need to create one or skip
        if (!payroll) {
          // Get employee data
          const employee = await Employee.findById(employeeId);
          if (!employee) {
            results.failed.push({
              employeeId,
              reason: 'Employee not found'
            });
            continue;
          }

          // Only create payroll for current or past months
          const isPastOrCurrentMonth = 
            (bonusYear < currentDate.getFullYear()) || 
            (bonusYear === currentDate.getFullYear() && bonusMonth <= currentDate.getMonth() + 1);

          if (!isPastOrCurrentMonth) {
            results.failed.push({
              employeeId,
              name: employee.name,
              reason: 'Cannot add bonus to future month'
            });
            continue;
          }

          // Create a basic payroll entry
          payroll = new Payroll({
            employeeId,
            month: bonusMonth,
            year: bonusYear,
            employeeDetails: {
              name: employee.name,
              employeeID: employee.employeeID,
              department: employee.department,
              position: employee.position,
              joiningDate: employee.joiningDate,
              bankDetails: {
                bankName: employee.bankDetails?.bankName || employee.bankName || '',
                accountNumber: employee.bankDetails?.accountNumber || employee.accountNumber || '',
                accountHolderName: employee.bankDetails?.accountHolderName || employee.accountHolderName || employee.name || '',
                ifscCode: employee.bankDetails?.ifscCode || employee.ifscCode || ''
              }
            },
            basicSalary: employee.salary,
            paymentStatus: 'Pending'
          });
        }

        // Initialize bonus details if not present
        if (!payroll.bonusDetails) {
          payroll.bonusDetails = {
            performanceBonus: 0,
            festivalBonus: 0,
            incentives: 0,
            commission: 0,
            oneTimeBonus: 0,
            description: ''
          };
        }

        // Update the specified bonus type
        payroll.bonusDetails[bonusType] = parseFloat(bonusAmount) || 0;

        // Append to description if provided
        if (description) {
          const currentDesc = payroll.bonusDetails.description || '';
          payroll.bonusDetails.description = currentDesc 
            ? `${currentDesc}; ${description}` 
            : description;
        }

        // Calculate total bonus
        const totalBonus = (
          (payroll.bonusDetails.performanceBonus || 0) +
          (payroll.bonusDetails.festivalBonus || 0) +
          (payroll.bonusDetails.incentives || 0) +
          (payroll.bonusDetails.commission || 0) +
          (payroll.bonusDetails.oneTimeBonus || 0)
        );

        // Update the total bonus
        payroll.bonus = totalBonus;

        // Save the updated payroll
        await payroll.save();

        results.success.push({
          employeeId,
          name: payroll.employeeDetails.name,
          bonusAmount: parseFloat(bonusAmount),
          totalBonus: payroll.bonus
        });
      } catch (error) {
        console.error(`Error processing bonus for employee ${employeeId}:`, error);
        results.failed.push({
          employeeId,
          reason: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed bonus for ${results.success.length} employees (${results.failed.length} failed)`,
      data: results
    });
  } catch (error) {
    console.error('Error in bulk bonus management:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk bonus',
      error: error.message
    });
  }
};
