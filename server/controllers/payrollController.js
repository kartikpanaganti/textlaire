import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import mongoose from 'mongoose';

// Generate payroll for an employee for a specific month and year
export const generatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, month, and year are required'
      });
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if payroll already exists for this employee for the specified month and year
    const existingPayroll = await Payroll.findOne({
      employeeId,
      month,
      year
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: 'Payroll already generated for this month'
      });
    }

    // Get attendance records for this employee for the specified month and year
    const attendanceRecords = await Attendance.find({
      employeeId,
      payrollMonth: month,
      payrollYear: year
    });

    // Calculate days worked
    const daysWorked = attendanceRecords.filter(
      record => record.status === 'Present' || record.status === 'Late'
    ).length;

    // Calculate total working days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const totalWorkingDays = daysInMonth; // Simplifying assumption, can be refined based on company policy

    // Calculate overtime hours
    const overtimeHours = attendanceRecords.reduce(
      (total, record) => total + (record.overtimeHours || 0),
      0
    );

    // Calculate overtime amount (assuming rate is stored in employee's hourly rate or using a default)
    const hourlyRate = employee.salary / (totalWorkingDays * 8); // Assuming 8-hour workday
    const overtimeRate = 1.5; // Default overtime rate
    const overtimeAmount = overtimeHours * hourlyRate * overtimeRate;

    // Calculate basic deductions (simplified - in real scenarios, these would be more complex)
    const taxRate = 0.1; // 10% tax rate (simplified)
    const tax = employee.salary * taxRate;
    
    // Create new payroll record
    const newPayroll = new Payroll({
      employeeId,
      month,
      year,
      baseSalary: employee.salary,
      daysWorked,
      totalWorkingDays,
      overtimeHours,
      overtimeAmount,
      deductions: {
        tax,
        // Other deductions would be calculated here
      },
      allowances: {
        // Allowances would be calculated here based on company policy
      }
    });

    // Save the payroll record
    await newPayroll.save();

    // Mark attendance records as processed for payroll
    await Attendance.updateMany(
      {
        employeeId,
        payrollMonth: month,
        payrollYear: year
      },
      {
        isPayrollProcessed: true
      }
    );

    return res.status(201).json({
      success: true,
      data: newPayroll,
      message: 'Payroll generated successfully'
    });
  } catch (error) {
    console.error('Error generating payroll:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating payroll',
      error: error.message
    });
  }
};

// Get all payroll records
export const getAllPayrolls = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Construct filter based on provided query parameters
    const filter = {};
    if (month) filter.month = month;
    if (year) filter.year = year;
    
    // Get payroll records with populated employee data
    const payrolls = await Payroll.find(filter)
      .populate('employeeId', 'name department position employeeID')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls
    });
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payrolls',
      error: error.message
    });
  }
};

// Get payroll by ID
export const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId');
    
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payroll record',
      error: error.message
    });
  }
};

// Get payroll records for a specific employee
export const getEmployeePayrolls = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const payrolls = await Payroll.find({ employeeId })
      .sort({ year: -1, month: -1 });
    
    return res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls
    });
  } catch (error) {
    console.error('Error fetching employee payrolls:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching employee payroll records',
      error: error.message
    });
  }
};

// Update payroll record
export const updatePayroll = async (req, res) => {
  try {
    const payrollId = req.params.id;
    const updates = req.body;
    
    // Don't allow updates to these fields
    delete updates.employeeId;
    delete updates.month;
    delete updates.year;
    delete updates.createdAt;
    
    const payroll = await Payroll.findByIdAndUpdate(
      payrollId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: payroll,
      message: 'Payroll updated successfully'
    });
  } catch (error) {
    console.error('Error updating payroll:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating payroll record',
      error: error.message
    });
  }
};

// Update payment status of a payroll record
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentDate, paymentMethod, transactionId } = req.body;
    
    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Payment status is required'
      });
    }
    
    const payroll = await Payroll.findByIdAndUpdate(
      id,
      {
        paymentStatus,
        paymentDate: paymentDate || new Date(),
        paymentMethod,
        transactionId,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: payroll,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
};

// Generate payroll for all employees for a specific month and year
export const generateBulkPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    // Get all active employees
    const employees = await Employee.find({ status: 'Active' });

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active employees found'
      });
    }

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    // Process each employee
    for (const employee of employees) {
      try {
        // Check if payroll already exists for this employee
        const existingPayroll = await Payroll.findOne({
          employeeId: employee._id,
          month,
          year
        });

        if (existingPayroll) {
          results.skipped.push({
            employeeId: employee._id,
            name: employee.name,
            reason: 'Payroll already exists'
          });
          continue;
        }

        // Get attendance records
        const attendanceRecords = await Attendance.find({
          employeeId: employee._id,
          payrollMonth: month,
          payrollYear: year
        });

        // Calculate days worked
        const daysWorked = attendanceRecords.filter(
          record => record.status === 'Present' || record.status === 'Late'
        ).length;

        // Calculate total working days in the month
        const daysInMonth = new Date(year, month, 0).getDate();
        const totalWorkingDays = daysInMonth; // Can be refined

        // Calculate overtime hours
        const overtimeHours = attendanceRecords.reduce(
          (total, record) => total + (record.overtimeHours || 0),
          0
        );

        // Calculate overtime amount
        const hourlyRate = employee.salary / (totalWorkingDays * 8);
        const overtimeRate = 1.5;
        const overtimeAmount = overtimeHours * hourlyRate * overtimeRate;

        // Calculate basic deductions
        const taxRate = 0.1; // 10% tax rate (simplified)
        const tax = employee.salary * taxRate;

        // Create new payroll record
        const newPayroll = new Payroll({
          employeeId: employee._id,
          month,
          year,
          baseSalary: employee.salary,
          daysWorked,
          totalWorkingDays,
          overtimeHours,
          overtimeAmount,
          deductions: {
            tax
          }
        });

        // Save the payroll record
        await newPayroll.save();

        // Mark attendance records as processed
        await Attendance.updateMany(
          {
            employeeId: employee._id,
            payrollMonth: month,
            payrollYear: year
          },
          {
            isPayrollProcessed: true
          }
        );

        results.success.push({
          employeeId: employee._id,
          name: employee.name,
          payrollId: newPayroll._id
        });
      } catch (error) {
        results.failed.push({
          employeeId: employee._id,
          name: employee.name,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Bulk payroll generation completed',
      summary: {
        total: employees.length,
        success: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      results
    });
  } catch (error) {
    console.error('Error generating bulk payroll:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating bulk payroll',
      error: error.message
    });
  }
};

// Delete a payroll record
export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payroll = await Payroll.findById(id);
    
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }
    
    // Only allow deletion if payment status is Pending
    if (payroll.paymentStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete payroll that has been paid or cancelled'
      });
    }
    
    // Unmark attendance records as processed
    await Attendance.updateMany(
      {
        employeeId: payroll.employeeId,
        payrollMonth: payroll.month,
        payrollYear: payroll.year
      },
      {
        isPayrollProcessed: false
      }
    );
    
    await Payroll.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Payroll record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payroll:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting payroll record',
      error: error.message
    });
  }
}; 