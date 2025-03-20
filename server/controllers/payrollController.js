import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import mongoose from 'mongoose';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';

// Helper function to get attendance statistics for employee in a given month/year
const getAttendanceStats = async (employeeId, month, year) => {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  
  // Convert to ISO format strings for query
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  
  const attendanceRecords = await Attendance.find({
    employeeId,
    date: { 
      $gte: startDateStr, 
      $lte: endDateStr 
    }
  });
  
  // Count working days (excluding weekends)
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  const workingDays = daysInMonth.filter(day => !isWeekend(day)).length;
  
  // Count different attendance statuses
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let leaveDays = 0;
  
  attendanceRecords.forEach(record => {
    switch(record.status) {
      case 'Present':
        presentDays++;
        break;
      case 'Absent':
        absentDays++;
        break;
      case 'Late':
        lateDays++;
        break;
      case 'On Leave':
        leaveDays++;
        break;
    }
  });
  
  // If an employee doesn't have an attendance record for a working day, 
  // we'll count it as absent unless it's already counted
  const recordedDays = presentDays + absentDays + lateDays + leaveDays;
  if (recordedDays < workingDays) {
    absentDays += (workingDays - recordedDays);
  }
  
  return {
    workingDays,
    presentDays,
    absentDays,
    lateDays,
    leaveDays
  };
};

// Calculate salary based on employee details and attendance
const calculateSalary = (employee, attendanceStats, bonusAmount = 0, deductions = 0) => {
  const { salary } = employee;
  const { workingDays, presentDays, lateDays } = attendanceStats;
  
  // Calculate daily rate
  const dailyRate = salary / workingDays;
  
  // Calculate basic salary based on presence
  const basicSalary = dailyRate * presentDays;
  
  // Calculate late deduction (half of daily rate per late day)
  const lateDeduction = (dailyRate * 0.5) * lateDays;
  
  // Calculate tax (simplified - 10% of basic salary)
  const taxRate = 0.1;
  const taxAmount = basicSalary * taxRate;
  
  // Calculate net salary
  const netSalary = basicSalary + bonusAmount - lateDeduction - deductions - taxAmount;
  
  return {
    baseSalary: salary,
    basicSalary,
    bonusAmount,
    lateDeduction,
    deductions,
    taxAmount,
    netSalary
  };
};

// Generate payroll for a specific employee
export const generateEmployeePayroll = async (req, res) => {
  try {
    const { employeeId, month, year, bonusAmount, deductions, deductionReasons } = req.body;
    
    // Validate month and year
    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ error: "Invalid month or year" });
    }
    
    // Find employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    // Get attendance stats
    const attendanceStats = await getAttendanceStats(employeeId, month, year);
    
    // Calculate salary
    const salaryDetails = calculateSalary(
      employee, 
      attendanceStats, 
      bonusAmount || 0, 
      deductions || 0
    );
    
    // Check if payroll for this employee/month/year already exists
    let payroll = await Payroll.findOne({ employeeId, month, year });
    
    if (payroll) {
      // Update existing payroll
      payroll.baseSalary = employee.salary;
      payroll.workingDays = attendanceStats.workingDays;
      payroll.presentDays = attendanceStats.presentDays;
      payroll.absentDays = attendanceStats.absentDays;
      payroll.lateDays = attendanceStats.lateDays;
      payroll.leaveDays = attendanceStats.leaveDays;
      payroll.bonusAmount = bonusAmount || 0;
      payroll.deductions = deductions || 0;
      payroll.deductionReasons = deductionReasons || '';
      payroll.taxAmount = salaryDetails.taxAmount;
      payroll.netSalary = salaryDetails.netSalary;
      
      await payroll.save();
    } else {
      // Create new payroll record
      payroll = new Payroll({
        employeeId,
        month,
        year,
        baseSalary: employee.salary,
        workingDays: attendanceStats.workingDays,
        presentDays: attendanceStats.presentDays,
        absentDays: attendanceStats.absentDays,
        lateDays: attendanceStats.lateDays,
        leaveDays: attendanceStats.leaveDays,
        bonusAmount: bonusAmount || 0,
        deductions: deductions || 0,
        deductionReasons: deductionReasons || '',
        taxAmount: salaryDetails.taxAmount,
        netSalary: salaryDetails.netSalary
      });
      
      await payroll.save();
    }
    
    return res.status(200).json({ 
      message: "Payroll generated successfully", 
      payroll,
      salaryDetails,
      attendanceStats
    });
    
  } catch (error) {
    console.error('Error generating payroll:', error);
    return res.status(500).json({ error: "Failed to generate payroll" });
  }
};

// Generate payroll for all employees
export const generateAllPayrolls = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    // Validate month and year
    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ error: "Invalid month or year" });
    }
    
    // Get all active employees
    const employees = await Employee.find({ status: "Active" });
    
    const results = [];
    const errors = [];
    
    // Generate payroll for each employee
    for (const employee of employees) {
      try {
        // Get attendance stats
        const attendanceStats = await getAttendanceStats(employee._id, month, year);
        
        // Calculate salary
        const salaryDetails = calculateSalary(employee, attendanceStats);
        
        // Check if payroll already exists
        let payroll = await Payroll.findOne({ 
          employeeId: employee._id, 
          month, 
          year 
        });
        
        if (payroll) {
          // Update existing payroll with new calculation
          payroll.baseSalary = employee.salary;
          payroll.workingDays = attendanceStats.workingDays;
          payroll.presentDays = attendanceStats.presentDays;
          payroll.absentDays = attendanceStats.absentDays;
          payroll.lateDays = attendanceStats.lateDays;
          payroll.leaveDays = attendanceStats.leaveDays;
          payroll.taxAmount = salaryDetails.taxAmount;
          payroll.netSalary = salaryDetails.netSalary;
          
          await payroll.save();
        } else {
          // Create new payroll record
          payroll = new Payroll({
            employeeId: employee._id,
            month,
            year,
            baseSalary: employee.salary,
            workingDays: attendanceStats.workingDays,
            presentDays: attendanceStats.presentDays,
            absentDays: attendanceStats.absentDays,
            lateDays: attendanceStats.lateDays,
            leaveDays: attendanceStats.leaveDays,
            taxAmount: salaryDetails.taxAmount,
            netSalary: salaryDetails.netSalary
          });
          
          await payroll.save();
        }
        
        results.push({
          employee: {
            id: employee._id,
            name: employee.name,
            employeeID: employee.employeeID
          },
          payroll
        });
        
      } catch (error) {
        console.error(`Error generating payroll for employee ${employee._id}:`, error);
        errors.push({
          employee: {
            id: employee._id,
            name: employee.name,
            employeeID: employee.employeeID
          },
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      message: `Payroll generated for ${results.length} employees, ${errors.length} failures`,
      results,
      errors
    });
    
  } catch (error) {
    console.error('Error generating all payrolls:', error);
    return res.status(500).json({ error: "Failed to generate payrolls" });
  }
};

// Get payroll details for a specific employee
export const getEmployeePayroll = async (req, res) => {
  try {
    const { id, month, year } = req.params;
    
    const payroll = await Payroll.findOne({
      employeeId: id,
      month: parseInt(month),
      year: parseInt(year)
    }).populate('employeeId', 'name employeeID department position');
    
    if (!payroll) {
      return res.status(404).json({ error: "Payroll not found" });
    }
    
    return res.status(200).json(payroll);
    
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return res.status(500).json({ error: "Failed to fetch payroll" });
  }
};

// Get all payrolls for a specific month and year
export const getAllPayrolls = async (req, res) => {
  try {
    const { month, year } = req.params;
    
    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year)
    }).populate('employeeId', 'name employeeID department position');
    
    return res.status(200).json(payrolls);
    
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    return res.status(500).json({ error: "Failed to fetch payrolls" });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentDate, paymentMethod, notes } = req.body;
    
    const payroll = await Payroll.findById(id);
    
    if (!payroll) {
      return res.status(404).json({ error: "Payroll not found" });
    }
    
    // Update payment details
    payroll.paymentStatus = paymentStatus;
    payroll.paymentDate = paymentDate;
    payroll.paymentMethod = paymentMethod;
    payroll.notes = notes;
    
    await payroll.save();
    
    return res.status(200).json({
      message: "Payment status updated successfully",
      payroll
    });
    
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({ error: "Failed to update payment status" });
  }
};

// Delete a payroll record
export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payroll = await Payroll.findByIdAndDelete(id);
    
    if (!payroll) {
      return res.status(404).json({ error: "Payroll not found" });
    }
    
    return res.status(200).json({
      message: "Payroll deleted successfully"
    });
    
  } catch (error) {
    console.error('Error deleting payroll:', error);
    return res.status(500).json({ error: "Failed to delete payroll" });
  }
};