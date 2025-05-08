// Import required models and dependencies
import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import Payroll from '../models/Payroll.js';
import { startOfMonth, endOfMonth, differenceInCalendarDays, eachDayOfInterval } from 'date-fns';
import mongoose from 'mongoose';

class PayrollService {
  /**
   * Calculate working days in a month, considering weekends
   * @param {Number} month - Month (1-12)
   * @param {Number} year - Year (YYYY)
   * @param {Array} weekends - Array of weekend days (0 = Sunday, 6 = Saturday)
   * @returns {Number} - Number of working days
   */
  calculateWorkingDays(month, year, weekends = [0, 6]) {
    const startDate = startOfMonth(new Date(year, month - 1, 1));
    const endDate = endOfMonth(new Date(year, month - 1, 1));
    
    // Get all days in the month
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Filter out weekends
    const workingDays = allDays.filter(day => {
      const isWeekend = weekends.includes(day.getDay());
      return !isWeekend;
    });
    
    return workingDays.length;
  }
  
  /**
   * Get attendance summary for an employee for a specific month
   * @param {String} employeeId - Employee ID
   * @param {Number} month - Month (1-12)
   * @param {Number} year - Year (YYYY)
   * @returns {Object} - Attendance summary 
   */
  async getAttendanceSummary(employeeId, month, year) {
    try {
      // Get date range for the month
      const startDate = startOfMonth(new Date(year, month - 1, 1));
      const endDate = endOfMonth(new Date(year, month - 1, 1));
      
      // Format dates for query
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Get attendance records for this employee for the month
      const attendanceRecords = await Attendance.find({
        employeeId,
        date: { 
          $gte: formattedStartDate, 
          $lte: formattedEndDate 
        }
      }).sort({ date: 1 });
      
      // Calculate total days in month and working days
      const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
      const workingDays = this.calculateWorkingDays(month, year);
      
      // Initialize summary
      const summary = {
        totalDays,
        workingDays,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        leave: 0,
        totalHoursWorked: 0,
        totalOvertimeHours: 0,
        attendanceRecords: []
      };
      
      // Process attendance records
      attendanceRecords.forEach(record => {
        // Add record ID to list
        summary.attendanceRecords.push(record._id);
        
        // Update stats based on status
        switch (record.status) {
          case 'Present':
            summary.present++;
            break;
          case 'Absent':
            summary.absent++;
            break;
          case 'Late':
            summary.late++;
            break;
          case 'Half Day':
            summary.halfDay++;
            break;
          case 'On Leave':
            summary.leave++;
            break;
        }
        
        // Add hours worked
        if (record.status === 'Present' || record.status === 'Late') {
          // Calculate hours worked if check-in and check-out times are available
          if (record.checkInTime && record.checkOutTime) {
            const checkIn = new Date(`2000-01-01T${record.checkInTime}`);
            const checkOut = new Date(`2000-01-01T${record.checkOutTime}`);
            
            // If checkout is earlier than checkin, it means checkout was next day
            let hoursWorked = 0;
            if (checkOut < checkIn) {
              // Add 24 hours to checkout
              checkOut.setDate(checkOut.getDate() + 1);
            }
            
            hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60);
            summary.totalHoursWorked += hoursWorked;
            
            // Calculate overtime (anything over 8 hours)
            const overtimeHours = Math.max(0, hoursWorked - 8);
            summary.totalOvertimeHours += overtimeHours;
          } else {
            // Default to 8 hours if times not available
            summary.totalHoursWorked += record.status === 'Half Day' ? 4 : 8;
          }
        }
      });
      
      return summary;
    } catch (error) {
      console.error('Error getting attendance summary:', error);
      throw error;
    }
  }
  
  /**
   * Generate payroll for a specific employee and month
   * @param {String} employeeId - Employee ID
   * @param {Number} month - Month (1-12)
   * @param {Number} year - Year (YYYY)
   * @param {String} userId - ID of user generating the payroll
   * @returns {Object} - Payroll object
   */
  async generateEmployeePayroll(employeeId, month, year, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Check if payroll already exists
      const existingPayroll = await Payroll.findOne({
        employeeId,
        month,
        year
      });
      
      if (existingPayroll) {
        throw new Error(`Payroll already generated for this employee for ${month}/${year}`);
      }
      
      // Get employee details
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      // Get pay period dates
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));
      
      // Get attendance summary
      const attendanceSummary = await this.getAttendanceSummary(employeeId, month, year);
      
      // Calculate basic salary based on attendance
      const workingDays = attendanceSummary.workingDays;
      const daysPresent = attendanceSummary.present + attendanceSummary.late;
      const daysAbsent = attendanceSummary.absent;
      
      // Calculate daily rate
      const dailyRate = employee.salary / workingDays;
      
      // Calculate basic salary based on days worked
      const basicSalary = dailyRate * daysPresent;
      
      // Calculate overtime amount
      const overtimeRate = dailyRate / 8 * 1.5; // 1.5x regular hourly rate
      const overtimeAmount = attendanceSummary.totalOvertimeHours * overtimeRate;
      
      // Standard allowances based on employee records
      const allowances = {
        houseRent: employee.allowances?.houseRent || 0,
        medical: employee.allowances?.medical || 0,
        travel: employee.allowances?.travel || 0,
        food: employee.allowances?.food || 0,
        special: employee.allowances?.special || 0,
        other: employee.allowances?.other || 0
      };
      
      // Standard deductions based on employee records
      const deductions = {
        incomeTax: employee.deductions?.incomeTax || 0,
        providentFund: employee.deductions?.providentFund || 719.88,
        professionalTax: employee.deductions?.professionalTax || 150,
        healthInsurance: employee.deductions?.healthInsurance || 299.95,
        loanRepayment: employee.deductions?.loanRepayment || 0,
        absentDeduction: employee.deductions?.absentDeduction || 0,
        lateDeduction: employee.deductions?.lateDeduction || 193.52,
        other: employee.deductions?.other || 0
      };
      
      // Calculate gross salary
      const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
      const grossSalary = basicSalary + totalAllowances + overtimeAmount;
      
      // Calculate total deductions
      const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
      
      // Calculate net salary
      const netSalary = grossSalary - totalDeductions;
      
      // Create payroll record
      const payroll = new Payroll({
        employeeId,
        month,
        year,
        payPeriod: {
          startDate,
          endDate
        },
        basicSalary,
        allowances,
        deductions,
        overtime: {
          hours: attendanceSummary.totalOvertimeHours,
          rate: overtimeRate,
          amount: overtimeAmount
        },
        daysWorked: daysPresent,
        daysAbsent,
        totalHoursWorked: attendanceSummary.totalHoursWorked,
        overtimeHours: attendanceSummary.totalOvertimeHours,
        grossSalary,
        totalDeductions,
        netSalary,
        attendanceRecords: attendanceSummary.attendanceRecords,
        createdBy: userId
      });
      
      await payroll.save({ session });
      
      // Mark attendance records as processed
      await Attendance.updateMany(
        {
          _id: { $in: attendanceSummary.attendanceRecords }
        },
        { $set: { isPayrollProcessed: true } },
        { session }
      );
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      return payroll;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      console.error('Error generating payroll:', error);
      throw error;
    }
  }
  
  /**
   * Generate payroll for all employees for a specific month
   * @param {Number} month - Month (1-12)
   * @param {Number} year - Year (YYYY)
   * @param {String} userId - ID of user generating the payroll
   * @returns {Object} - Summary of generated payrolls
   */
  async generateAllPayrolls(month, year, userId) {
    try {
      // Get all active employees
      const employees = await Employee.find({ status: 'Active' });
      
      const results = {
        success: [],
        failures: [],
        total: employees.length,
        processed: 0,
        successCount: 0,
        failureCount: 0
      };
      
      // Process each employee
      for (const employee of employees) {
        try {
          // Check if payroll already exists
          const existingPayroll = await Payroll.findOne({
            employeeId: employee._id,
            month,
            year
          });
          
          if (existingPayroll) {
            results.failures.push({
              employeeId: employee._id,
              name: employee.name,
              error: `Payroll already exists for ${month}/${year}`
            });
            results.failureCount++;
          } else {
            const payroll = await this.generateEmployeePayroll(employee._id, month, year, userId);
            results.success.push({
              employeeId: employee._id,
              name: employee.name,
              payrollId: payroll._id,
              grossSalary: payroll.grossSalary,
              netSalary: payroll.netSalary
            });
            results.successCount++;
          }
        } catch (error) {
          results.failures.push({
            employeeId: employee._id,
            name: employee.name,
            error: error.message
          });
          results.failureCount++;
        }
        
        results.processed++;
      }
      
      return results;
    } catch (error) {
      console.error('Error generating all payrolls:', error);
      throw error;
    }
  }
}

export default new PayrollService();