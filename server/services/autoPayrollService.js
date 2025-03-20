import cron from 'node-cron';
import axios from 'axios';
import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';

class AutoPayrollService {
  constructor() {
    this.isEnabled = true;
    this.lastGenerated = null;
  }

  // Initialize the auto generation service
  init() {
    // Schedule payroll generation for the 1st of every month at 00:00
    cron.schedule('0 0 1 * *', async () => {
      if (this.isEnabled) {
        await this.generateMonthlyPayrolls();
      }
    });

    // Check if payrolls need to be generated for the current month
    this.checkAndGenerateCurrentMonth();
  }

  // Check if payrolls need to be generated for the current month
  async checkAndGenerateCurrentMonth() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    try {
      // Check if payrolls exist for the current month
      const existingPayrolls = await Payroll.find({
        month: currentMonth,
        year: currentYear
      });

      if (existingPayrolls.length === 0) {
        // No payrolls exist for current month, generate them
        await this.generateMonthlyPayrolls();
      }
    } catch (error) {
      console.error('Error checking current month payrolls:', error);
    }
  }

  // Generate payrolls for all employees for the current month
  async generateMonthlyPayrolls() {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Get all active employees
      const employees = await Employee.find({ status: 'Active' });

      // Generate payroll for each employee
      const payrollPromises = employees.map(async (employee) => {
        try {
          // Check if payroll already exists for this employee
          const existingPayroll = await Payroll.findOne({
            employeeId: employee._id,
            month: currentMonth,
            year: currentYear
          });

          if (!existingPayroll) {
            // Calculate attendance data
            const attendanceData = await this.calculateAttendanceData(employee._id, currentMonth, currentYear);

            // Create new payroll
            const payroll = new Payroll({
              employeeId: employee._id,
              month: currentMonth,
              year: currentYear,
              baseSalary: employee.salary,
              workingDays: attendanceData.workingDays,
              presentDays: attendanceData.presentDays,
              absentDays: attendanceData.absentDays,
              lateDays: attendanceData.lateDays,
              overtimeHours: attendanceData.overtimeHours,
              overtimeRate: employee.overtimeRate || 0,
              bonusAmount: 0,
              deductions: 0,
              deductionReasons: '',
              taxAmount: this.calculateTax(employee.salary),
              netSalary: this.calculateNetSalary(employee.salary, attendanceData),
              paymentStatus: 'Pending'
            });

            await payroll.save();
            return payroll;
          }
          return existingPayroll;
        } catch (error) {
          console.error(`Error generating payroll for employee ${employee._id}:`, error);
          return null;
        }
      });

      await Promise.all(payrollPromises);
      this.lastGenerated = new Date();

      // Update the last generated timestamp in the database
      await this.updateLastGeneratedTimestamp();

      return true;
    } catch (error) {
      console.error('Error generating monthly payrolls:', error);
      return false;
    }
  }

  // Calculate attendance data for an employee
  async calculateAttendanceData(employeeId, month, year) {
    try {
      // Get attendance records for the month
      const response = await axios.get(`/api/attendance/employee/${employeeId}/month/${month}/${year}`);
      const attendanceRecords = response.data;

      // Calculate attendance metrics
      const workingDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(record => record.status === 'Present').length;
      const absentDays = attendanceRecords.filter(record => record.status === 'Absent').length;
      const lateDays = attendanceRecords.filter(record => record.status === 'Late').length;
      const overtimeHours = attendanceRecords.reduce((total, record) => total + (record.overtimeHours || 0), 0);

      return {
        workingDays,
        presentDays,
        absentDays,
        lateDays,
        overtimeHours
      };
    } catch (error) {
      console.error('Error calculating attendance data:', error);
      return {
        workingDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        overtimeHours: 0
      };
    }
  }

  // Calculate tax amount
  calculateTax(salary) {
    // Implement your tax calculation logic here
    // This is a simple example
    if (salary <= 250000) return 0;
    if (salary <= 500000) return (salary - 250000) * 0.05;
    if (salary <= 1000000) return 12500 + (salary - 500000) * 0.2;
    return 112500 + (salary - 1000000) * 0.3;
  }

  // Calculate net salary
  calculateNetSalary(baseSalary, attendanceData) {
    const overtimeAmount = attendanceData.overtimeHours * (attendanceData.overtimeRate || 0);
    const taxAmount = this.calculateTax(baseSalary);
    return baseSalary + overtimeAmount - taxAmount;
  }

  // Update last generated timestamp
  async updateLastGeneratedTimestamp() {
    try {
      // You can store this in a separate collection or configuration
      // For now, we'll just update the lastGenerated property
      this.lastGenerated = new Date();
    } catch (error) {
      console.error('Error updating last generated timestamp:', error);
    }
  }

  // Get auto generation status
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      lastGenerated: this.lastGenerated
    };
  }

  // Enable/disable auto generation
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}

// Create and export a singleton instance
const autoPayrollService = new AutoPayrollService();
export default autoPayrollService; 