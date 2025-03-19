import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import PayrollSettings from "../models/PayrollSettings.js";

// Calculate payroll without saving (preview only)
export const previewPayroll = async (req, res) => {
  try {
    const { 
      employeeId, 
      payPeriodStart, 
      payPeriodEnd,
      customAllowances = [],
      customDeductions = []
    } = req.body;

    // Validate employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Extract month and year from payPeriodEnd for checking
    const endDate = new Date(payPeriodEnd);
    const month = endDate.getMonth() + 1; // getMonth() is 0-indexed
    const year = endDate.getFullYear();

    // Check if a payroll already exists for this employee in this month/year
    const existingPayroll = await Payroll.findOne({
      employeeId,
      month,
      year
    });

    if (existingPayroll) {
      return res.status(400).json({ 
        message: `A payroll record already exists for ${employee.name} for ${month}/${year}` 
      });
    }

    // Get payroll settings
    const settings = await PayrollSettings.getActive();

    // Get attendance records for the pay period
    const attendanceRecords = await Attendance.find({
      employeeId,
      date: {
        $gte: new Date(payPeriodStart).toISOString().split('T')[0],
        $lte: new Date(payPeriodEnd).toISOString().split('T')[0]
      }
    });

    // Calculate basic salary (pro-rated based on attendance)
    const totalDays = Math.ceil((new Date(payPeriodEnd) - new Date(payPeriodStart)) / (1000 * 60 * 60 * 24)) + 1;
    const presentDays = attendanceRecords.filter(record => record.status === "Present").length;
    const monthlySalary = employee.salary;
    const workingDaysPerMonth = settings.workingDaysPerMonth;
    const basicSalary = (monthlySalary / workingDaysPerMonth) * presentDays;

    // Calculate overtime
    const overtimeHours = attendanceRecords.reduce((total, record) => total + (record.overtime || 0), 0);
    const workingHoursPerDay = settings.workingHoursPerDay;
    const overtimeRateMultiplier = settings.overtimeRateMultiplier;
    const hourlyRate = monthlySalary / (workingDaysPerMonth * workingHoursPerDay);
    const overtimeRate = hourlyRate * overtimeRateMultiplier;
    const overtimeAmount = overtimeHours * overtimeRate;

    // Calculate allowances based on settings
    const allowances = {
      housing: calculateComponentValue(settings.allowances.housing, basicSalary),
      transport: calculateComponentValue(settings.allowances.transport, basicSalary),
      meal: calculateComponentValue(settings.allowances.meal, basicSalary),
      other: calculateComponentValue(settings.allowances.other, basicSalary),
      custom: customAllowances.map(item => ({
        name: item.name,
        amount: parseFloat(item.amount) || 0
      }))
    };

    // Calculate deductions based on settings
    const deductions = {
      tax: calculateComponentValue(settings.deductions.tax, basicSalary),
      insurance: calculateComponentValue(settings.deductions.insurance, basicSalary),
      other: calculateComponentValue(settings.deductions.other, basicSalary),
      custom: customDeductions.map(item => ({
        name: item.name,
        amount: parseFloat(item.amount) || 0
      }))
    };

    // Calculate total earnings (basic + overtime + all allowances)
    const totalAllowances = allowances.housing + 
                           allowances.transport + 
                           allowances.meal + 
                           allowances.other + 
                           allowances.custom.reduce((sum, item) => sum + item.amount, 0);
    
    const totalEarnings = basicSalary + overtimeAmount + totalAllowances;
    
    // Calculate total deductions
    const totalDeductionsAmount = deductions.tax + 
                                 deductions.insurance + 
                                 deductions.other + 
                                 deductions.custom.reduce((sum, item) => sum + item.amount, 0);
    
    const netSalary = totalEarnings - totalDeductionsAmount;

    // Create payroll object (but don't save it)
    const payrollPreview = {
      employeeId,
      employeeDetails: {
        name: employee.name,
        employeeID: employee.employeeID,
        department: employee.department,
        position: employee.position
      },
      payPeriodStart,
      payPeriodEnd,
      month,
      year,
      basicSalary,
      overtime: {
        hours: overtimeHours,
        rate: overtimeRate,
        amount: overtimeAmount
      },
      deductions,
      allowances,
      totalEarnings,
      totalDeductions: totalDeductionsAmount,
      netSalary,
      paymentMethod: "Bank Transfer", // Default payment method
      paymentStatus: "Pending",
      isPreview: true // Flag to indicate this is just a preview
    };

    res.status(200).json(payrollPreview);
  } catch (error) {
    console.error("Payroll calculation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to check for overlapping pay periods
const checkOverlappingPayPeriods = async (employeeId, startDate, endDate, excludePayrollId = null) => {
  const query = {
    employeeId,
    $or: [
      {
        payPeriodStart: { $lte: new Date(endDate) },
        payPeriodEnd: { $gte: new Date(startDate) }
      }
    ]
  };

  // Exclude current payroll when updating
  if (excludePayrollId) {
    query._id = { $ne: excludePayrollId };
  }

  const overlappingPayroll = await Payroll.findOne(query);
  return overlappingPayroll;
};

// Save calculated payroll to database
export const savePayroll = async (req, res) => {
  try {
    const { 
      employeeId, 
      payPeriodStart, 
      payPeriodEnd,
      basicSalary,
      overtime,
      allowances,
      deductions,
      totalEarnings,
      totalDeductions,
      netSalary
    } = req.body;

    // Validate employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check for overlapping pay periods
    const overlappingPayroll = await checkOverlappingPayPeriods(employeeId, payPeriodStart, payPeriodEnd);
    if (overlappingPayroll) {
      return res.status(400).json({
        message: `An overlapping payroll record exists for ${employee.name} from ${new Date(overlappingPayroll.payPeriodStart).toLocaleDateString()} to ${new Date(overlappingPayroll.payPeriodEnd).toLocaleDateString()}`
      });
    }

    // Extract month and year from payPeriodEnd for indexing
    const endDate = new Date(payPeriodEnd);
    const month = endDate.getMonth() + 1;
    const year = endDate.getFullYear();

    // Check if a payroll already exists for this employee in this month/year
    const existingPayroll = await Payroll.findOne({
      employeeId,
      month,
      year
    });

    if (existingPayroll) {
      return res.status(400).json({ 
        message: `A payroll record already exists for ${employee.name} for ${month}/${year}` 
      });
    }

    // Create payroll record
    const payroll = new Payroll({
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      month,
      year,
      basicSalary,
      overtime,
      deductions,
      allowances,
      totalEarnings,
      totalDeductions,
      netSalary,
      paymentMethod: "Bank Transfer", // Default payment method
      paymentStatus: "Pending"
    });

    await payroll.save();
    res.status(201).json(payroll);
  } catch (error) {
    console.error("Payroll save error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Calculate payroll for an employee (original function - now calls savePayroll)
export const calculatePayroll = async (req, res) => {
  try {
    const { 
      employeeId, 
      payPeriodStart, 
      payPeriodEnd,
      customAllowances = [],
      customDeductions = []
    } = req.body;

    // Validate employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check for overlapping pay periods
    const overlappingPayroll = await checkOverlappingPayPeriods(employeeId, payPeriodStart, payPeriodEnd);
    if (overlappingPayroll) {
      return res.status(400).json({
        message: `An overlapping payroll record exists for ${employee.name} from ${new Date(overlappingPayroll.payPeriodStart).toLocaleDateString()} to ${new Date(overlappingPayroll.payPeriodEnd).toLocaleDateString()}`
      });
    }

    // Extract month and year from payPeriodEnd for indexing
    const endDate = new Date(payPeriodEnd);
    const month = endDate.getMonth() + 1;
    const year = endDate.getFullYear();

    // Check if a payroll already exists for this employee in this month/year
    const existingPayroll = await Payroll.findOne({
      employeeId,
      month,
      year
    });

    if (existingPayroll) {
      return res.status(400).json({ 
        message: `A payroll record already exists for ${employee.name} for ${month}/${year}` 
      });
    }

    // Get payroll settings
    const settings = await PayrollSettings.getActive();

    // Get attendance records for the pay period
    const attendanceRecords = await Attendance.find({
      employeeId,
      date: {
        $gte: new Date(payPeriodStart).toISOString().split('T')[0],
        $lte: new Date(payPeriodEnd).toISOString().split('T')[0]
      }
    });

    // Calculate basic salary (pro-rated based on attendance)
    const totalDays = Math.ceil((new Date(payPeriodEnd) - new Date(payPeriodStart)) / (1000 * 60 * 60 * 24)) + 1;
    const presentDays = attendanceRecords.filter(record => record.status === "Present").length;
    const monthlySalary = employee.salary;
    const workingDaysPerMonth = settings.workingDaysPerMonth;
    const basicSalary = (monthlySalary / workingDaysPerMonth) * presentDays;

    // Calculate overtime
    const overtimeHours = attendanceRecords.reduce((total, record) => total + (record.overtime || 0), 0);
    const workingHoursPerDay = settings.workingHoursPerDay;
    const overtimeRateMultiplier = settings.overtimeRateMultiplier;
    const hourlyRate = monthlySalary / (workingDaysPerMonth * workingHoursPerDay);
    const overtimeRate = hourlyRate * overtimeRateMultiplier;
    const overtimeAmount = overtimeHours * overtimeRate;

    // Calculate allowances based on settings
    const allowances = {
      housing: calculateComponentValue(settings.allowances.housing, basicSalary),
      transport: calculateComponentValue(settings.allowances.transport, basicSalary),
      meal: calculateComponentValue(settings.allowances.meal, basicSalary),
      other: calculateComponentValue(settings.allowances.other, basicSalary),
      custom: customAllowances.map(item => ({
        name: item.name,
        amount: parseFloat(item.amount) || 0
      }))
    };

    // Calculate deductions based on settings
    const deductions = {
      tax: calculateComponentValue(settings.deductions.tax, basicSalary),
      insurance: calculateComponentValue(settings.deductions.insurance, basicSalary),
      other: calculateComponentValue(settings.deductions.other, basicSalary),
      custom: customDeductions.map(item => ({
        name: item.name,
        amount: parseFloat(item.amount) || 0
      }))
    };

    // Calculate total earnings (basic + overtime + all allowances)
    const totalAllowances = allowances.housing + 
                           allowances.transport + 
                           allowances.meal + 
                           allowances.other + 
                           allowances.custom.reduce((sum, item) => sum + item.amount, 0);
    
    const totalEarnings = basicSalary + overtimeAmount + totalAllowances;
    
    // Calculate total deductions
    const totalDeductionsAmount = deductions.tax + 
                                 deductions.insurance + 
                                 deductions.other + 
                                 deductions.custom.reduce((sum, item) => sum + item.amount, 0);
    
    const netSalary = totalEarnings - totalDeductionsAmount;

    // Create payroll record
    const payroll = new Payroll({
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      month,
      year,
      basicSalary,
      overtime: {
        hours: overtimeHours,
        rate: overtimeRate,
        amount: overtimeAmount
      },
      deductions,
      allowances,
      totalEarnings,
      totalDeductions: totalDeductionsAmount,
      netSalary,
      paymentMethod: "Bank Transfer", // Default payment method
      paymentStatus: "Pending"
    });

    await payroll.save();
    res.status(201).json(payroll);
  } catch (error) {
    console.error("Payroll calculation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate component value based on type (percentage or fixed)
function calculateComponentValue(component, basicSalary) {
  if (component.type === "percentage") {
    return (basicSalary * component.value) / 100;
  } else {
    return component.value;
  }
}

// Get all payrolls
export const getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find()
      .populate("employeeId", "name employeeID department position")
      .sort({ payPeriodStart: -1 });
    res.status(200).json(payrolls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payroll by ID
export const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate("employeeId", "name employeeID department position");
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee payroll history
export const getEmployeePayrollHistory = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ employeeId: req.params.employeeId })
      .populate("employeeId", "name employeeID department position")
      .sort({ payPeriodStart: -1 });
    res.status(200).json(payrolls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payroll history (all payrolls with limited fields for history view)
export const getPayrollHistory = async (req, res) => {
  try {
    const payrolls = await Payroll.find()
      .populate("employeeId", "name employeeID")
      .select("employeeId payPeriodStart payPeriodEnd netSalary paymentStatus")
      .sort({ payPeriodStart: -1 })
      .limit(20); // Limit to recent 20 records for performance
    
    // Format the data for the history view
    const formattedHistory = payrolls.map(payroll => ({
      _id: payroll._id,
      employeeName: payroll.employeeId?.name || 'Unknown',
      employeeID: payroll.employeeId?.employeeID || 'Unknown',
      date: payroll.payPeriodEnd,
      period: `${new Date(payroll.payPeriodStart).toLocaleDateString()} - ${new Date(payroll.payPeriodEnd).toLocaleDateString()}`,
      netSalary: payroll.netSalary,
      status: payroll.paymentStatus
    }));
    
    res.status(200).json(formattedHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payroll status
export const updatePayrollStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentDate } = req.body;
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { 
        paymentStatus,
        paymentDate: paymentDate || Date.now(),
        updatedAt: Date.now()
      },
      { new: true }
    );
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payroll details
export const updatePayroll = async (req, res) => {
  try {
    const { 
      basicSalary, 
      overtime, 
      allowances, 
      deductions 
    } = req.body;

    // Ensure basic salary is a valid number
    const parsedBasicSalary = parseFloat(basicSalary) || 0;
    
    // Ensure overtime amount is a valid number
    const overtimeAmount = parseFloat(overtime?.amount) || 0;
    
    // Calculate total allowances, ensuring each value is a valid number
    const totalAllowances = Object.values(allowances || {}).reduce((sum, value) => {
      const amount = parseFloat(value) || 0;
      return sum + amount;
    }, 0);
    
    // Calculate total deductions, ensuring each value is a valid number
    const totalDeductionsAmount = Object.values(deductions || {}).reduce((sum, value) => {
      const amount = parseFloat(value) || 0;
      return sum + amount;
    }, 0);

    // Calculate final totals with proper rounding
    const totalEarnings = Number((parsedBasicSalary + overtimeAmount + totalAllowances).toFixed(2));
    const totalDeductions = Number(totalDeductionsAmount.toFixed(2));
    const netSalary = Number((totalEarnings - totalDeductions).toFixed(2));

    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { 
        basicSalary: parsedBasicSalary,
        overtime: {
          ...overtime,
          amount: overtimeAmount
        },
        allowances,
        deductions,
        totalEarnings,
        totalDeductions,
        netSalary,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate("employeeId", "name employeeID department position");

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }
    
    res.status(200).json(payroll);
  } catch (error) {
    console.error("Update payroll error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete payroll
export const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    // Check if payroll is already paid
    if (payroll.paymentStatus === "Paid") {
      return res.status(400).json({ 
        message: "Cannot delete a paid payroll record" 
      });
    }

    await Payroll.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Payroll record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Process payroll payment
export const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paymentMethod,
      paymentStatus,
      paymentDate,
      bankDetails,
      transactionId,
      remarks
    } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    // Update payment details
    payroll.paymentMethod = paymentMethod;
    payroll.paymentStatus = paymentStatus;
    payroll.paymentDate = paymentDate;
    if (bankDetails) {
      payroll.bankDetails = bankDetails;
    }
    payroll.transactionId = transactionId;
    payroll.notes = remarks;
    payroll.updatedAt = new Date();

    await payroll.save();

    res.status(200).json(payroll);
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Add endpoint to check for overlapping pay periods
export const checkOverlappingPeriods = async (req, res) => {
  try {
    const { employeeId, payPeriodStart, payPeriodEnd } = req.body;

    // Validate required fields
    if (!employeeId || !payPeriodStart || !payPeriodEnd) {
      return res.status(400).json({
        message: 'Employee ID, start date, and end date are required'
      });
    }

    // Validate employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        message: 'Employee not found'
      });
    }

    // Validate dates
    const startDate = new Date(payPeriodStart);
    const endDate = new Date(payPeriodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid date format'
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        message: 'End date cannot be before start date'
      });
    }

    const overlappingPayroll = await checkOverlappingPayPeriods(employeeId, payPeriodStart, payPeriodEnd);
    
    if (overlappingPayroll) {
      res.status(200).json({
        overlapping: true,
        overlappingPeriod: {
          start: overlappingPayroll.payPeriodStart,
          end: overlappingPayroll.payPeriodEnd
        },
        message: `An overlapping payroll record exists for ${employee.name} from ${new Date(overlappingPayroll.payPeriodStart).toLocaleDateString()} to ${new Date(overlappingPayroll.payPeriodEnd).toLocaleDateString()}`
      });
    } else {
      res.status(200).json({
        overlapping: false,
        message: 'No overlapping pay periods found'
      });
    }
  } catch (error) {
    console.error("Error checking overlapping periods:", error);
    res.status(500).json({ 
      message: 'Internal server error while checking overlapping periods. Please try again.' 
    });
  }
}; 