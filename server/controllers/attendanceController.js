const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { differenceInMinutes } = require('date-fns');

// Helper function to calculate overtime
const calculateOvertime = (checkIn, checkOut, shift) => {
  if (!checkIn || !checkOut) return { hours: 0, rate: 1.5, totalHours: 0 };

  // Convert times to Date objects for the current day
  const today = new Date();
  const [startHour, startMinute] = checkIn.split(':').map(Number);
  const [endHour, endMinute] = checkOut.split(':').map(Number);
  
  const startTime = new Date(today.setHours(startHour, startMinute, 0));
  const endTime = new Date(today.setHours(endHour, endMinute, 0));

  // Handle overnight shifts
  if (endTime < startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  // Calculate total hours worked
  const totalMinutes = differenceInMinutes(endTime, startTime);
  const totalHours = totalMinutes / 60;

  // Calculate overtime based on shift type
  let overtime = 0;
  let rate = 1.5; // Default overtime rate

  // Standard working hours
  const standardHours = 8;

  if (shift === 'Night') {
    // Night shift overtime rules
    if (totalHours > standardHours) {
      overtime = totalHours - standardHours;
      if (totalHours > 12) {
        rate = 2.0; // Double time
      }
    }
  } else {
    // Regular shift overtime rules
    if (totalHours > standardHours) {
      overtime = totalHours - standardHours;
      if (totalHours > 12) {
        rate = 2.0; // Double time
      }
    }
  }

  return {
    hours: parseFloat(overtime.toFixed(2)),
    rate: rate,
    totalHours: parseFloat(totalHours.toFixed(2))
  };
};

// Create attendance record
exports.createAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, shift, workFromHome, notes } = req.body;

    // Get employee data to check joining date
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if attendance date is before joining date
    const attendanceDate = new Date(date);
    const joiningDate = new Date(employee.joiningDate);
    
    // Reset time portion to compare just the dates
    attendanceDate.setHours(0, 0, 0, 0);
    joiningDate.setHours(0, 0, 0, 0);
    
    if (attendanceDate < joiningDate) {
      return res.status(400).json({ 
        message: `Cannot record attendance before employee's joining date (${joiningDate.toISOString().split('T')[0]})` 
      });
    }
    
    // Prevent future attendance records (after current date)
    const currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); // End of today
    
    if (attendanceDate > currentDate) {
      return res.status(400).json({ 
        message: `Cannot record attendance for future dates (after ${currentDate.toISOString().split('T')[0]})` 
      });
    }

    // Calculate overtime if check-in and check-out times are provided
    const overtime = calculateOvertime(checkIn, checkOut, shift);

    const attendance = new Attendance({
      employeeId,
      date,
      status,
      checkIn,
      checkOut,
      shift,
      workFromHome,
      notes,
      overtime
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Attendance record already exists for this employee on this date' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, shift, workFromHome, notes } = req.body;

    // First, find the attendance record
    const existingAttendance = await Attendance.findById(req.params.id);
    if (!existingAttendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Get employee data to check joining date
    const employee = await Employee.findById(employeeId || existingAttendance.employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if attendance date is before joining date
    const attendanceDate = new Date(date || existingAttendance.date);
    const joiningDate = new Date(employee.joiningDate);
    
    // Reset time portion to compare just the dates
    attendanceDate.setHours(0, 0, 0, 0);
    joiningDate.setHours(0, 0, 0, 0);
    
    if (attendanceDate < joiningDate) {
      return res.status(400).json({ 
        message: `Cannot record attendance before employee's joining date (${joiningDate.toISOString().split('T')[0]})` 
      });
    }
    
    // Prevent future attendance records (after current date)
    const currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); // End of today
    
    if (attendanceDate > currentDate) {
      return res.status(400).json({ 
        message: `Cannot record attendance for future dates (after ${currentDate.toISOString().split('T')[0]})` 
      });
    }

    // Calculate overtime if check-in and check-out times are provided
    const overtime = calculateOvertime(
      checkIn || existingAttendance.checkIn, 
      checkOut || existingAttendance.checkOut, 
      shift || existingAttendance.shift
    );

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        employeeId: employeeId || existingAttendance.employeeId,
        date: date || existingAttendance.date,
        status: status || existingAttendance.status,
        checkIn: checkIn || existingAttendance.checkIn,
        checkOut: checkOut || existingAttendance.checkOut,
        shift: shift || existingAttendance.shift,
        workFromHome: workFromHome !== undefined ? workFromHome : existingAttendance.workFromHome,
        notes: notes || existingAttendance.notes,
        overtime
      },
      { new: true }
    );

    res.json(updatedAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all attendance records
exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate('employeeId', 'name employeeId')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by ID
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('employeeId', 'name employeeId');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 