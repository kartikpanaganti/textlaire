import express from "express";
import Attendance from "../models/Attendance.js";

const router = express.Router();

// Get attendance records with optional date filter
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;
    const query = date ? { date } : {};
    const attendance = await Attendance.find(query).populate("employeeId");
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance records by month and year - for payroll integration
router.get("/month/:month/:year", async (req, res) => {
  try {
    const { month, year } = req.params;
    
    // Validate month and year
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: "Invalid month or year" });
    }
    
    // Query by payrollMonth and payrollYear fields
    const attendance = await Attendance.find({
      payrollMonth: monthNum,
      payrollYear: yearNum
    }).populate("employeeId");
    
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance records for a specific employee by month and year
router.get("/employee/:employeeId/month/:month/:year", async (req, res) => {
  try {
    const { employeeId, month, year } = req.params;
    
    // Validate month and year
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: "Invalid month or year" });
    }
    
    // Query by employee ID and payroll month/year
    const attendance = await Attendance.find({
      employeeId,
      payrollMonth: monthNum,
      payrollYear: yearNum
    }).populate("employeeId");
    
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single attendance record
router.get("/:id", async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate("employeeId");
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to calculate overtime hours from check-in and check-out times
const calculateOvertimeHours = (checkIn, checkOut, shift) => {
  if (!checkIn || !checkOut) return 0;
  
  // Parse times
  const [checkInHour, checkInMinute] = checkIn.split(':').map(Number);
  const [checkOutHour, checkOutMinute] = checkOut.split(':').map(Number);
  
  // Calculate total hours worked
  let hoursWorked = checkOutHour - checkInHour;
  let minutesWorked = checkOutMinute - checkInMinute;
  
  // Handle overnight shifts
  if (hoursWorked < 0) {
    hoursWorked += 24;
  }
  
  // Convert minutes to decimal hours
  hoursWorked += minutesWorked / 60;
  
  // Define standard hours based on shift
  let standardHours = 8; // Default
  
  // Adjust according to shift type
  if (shift === 'Night') {
    standardHours = 7; // Night shifts might be shorter
  }
  
  // Calculate overtime (hours worked above standard hours)
  const overtimeHours = Math.max(0, hoursWorked - standardHours);
  
  // Round to 2 decimal places
  return Math.round(overtimeHours * 100) / 100;
};

// Create attendance record
router.post("/", async (req, res) => {
  try {
    const { employeeId, status, checkIn, checkOut, date, shift, breakTime, overtime, overtimeRate, workFromHome, notes, location } = req.body;
    
    // Calculate overtime hours if check-in and check-out times are provided
    let calculatedOvertimeHours = 0;
    if (checkIn && checkOut) {
      calculatedOvertimeHours = calculateOvertimeHours(checkIn, checkOut, shift);
    }
    
    // Use provided overtime hours or the calculated ones
    const overtimeHours = (overtime && overtime.hours) || req.body.overtimeHours || calculatedOvertimeHours;
    
    // Create new attendance record
    const newAttendance = new Attendance({
      employeeId,
      status,
      checkIn,
      checkOut,
      date,
      shift,
      breakTime,
      overtimeHours,
      overtimeRate: overtimeRate || 1.5,
      workFromHome,
      notes,
      location
    });
    
    await newAttendance.save();
    res.status(201).json(newAttendance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update attendance record
router.put("/:id", async (req, res) => {
  try {
    const { checkIn, checkOut, shift } = req.body;
    
    // Calculate overtime hours if check-in and check-out times are provided
    if (checkIn && checkOut && !req.body.overtimeHours) {
      req.body.overtimeHours = calculateOvertimeHours(checkIn, checkOut, shift || 'Day');
    }
    
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true }
    ).populate("employeeId");
    
    if (!updatedAttendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    
    res.json(updatedAttendance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete attendance record
router.delete("/:id", async (req, res) => {
  try {
    const deletedAttendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!deletedAttendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json({ message: "Attendance record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark attendance as processed for payroll
router.patch("/mark-processed", async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;
    
    if (!employeeId || !month || !year) {
      return res.status(400).json({ error: "Missing required fields: employeeId, month, year" });
    }
    
    // Update all attendance records for this employee in the given month/year
    const result = await Attendance.updateMany(
      { 
        employeeId,
        payrollMonth: month,
        payrollYear: year
      },
      {
        $set: { isPayrollProcessed: true }
      }
    );
    
    res.json({ 
      message: "Attendance records marked as processed",
      count: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
