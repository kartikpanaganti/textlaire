import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// Helper function to calculate hours between two time strings
const calculateHoursBetween = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  let minutes = endMinute - startMinute;
  
  // Handle overnight shifts
  if (hours < 0) {
    hours += 24;
  }
  
  return hours + (minutes / 60);
};

// Helper function to calculate overtime
const calculateOvertime = async (employeeId, checkIn, checkOut, shift, date) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) return 0;

  const standardHours = employee.workingHours || 8;
  const shiftTimings = employee.shiftConfig?.shiftTimings?.[shift] || {
    Day: { start: "09:00", end: "17:00" },
    Night: { start: "21:00", end: "05:00" },
    Morning: { start: "06:00", end: "14:00" },
    Evening: { start: "14:00", end: "22:00" }
  }[shift];

  if (!checkIn || !checkOut) return 0;

  const actualHours = calculateHoursBetween(checkIn, checkOut);
  const overtime = Math.max(0, actualHours - standardHours);

  // Determine overtime type
  let overtimeType = 'regular';
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  
  // Check if it's a weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    overtimeType = 'weekend';
  }
  // You can add holiday check here if you have a holiday calendar
  
  return {
    hours: parseFloat(overtime.toFixed(2)),
    type: overtimeType
  };
};

export const addAttendance = async (req, res) => {
  try {
    const { employeeId, checkIn, checkOut, shift, date } = req.body;

    // Calculate overtime if check-in and check-out times are provided
    if (checkIn && checkOut) {
      const overtimeDetails = await calculateOvertime(employeeId, checkIn, checkOut, shift, date);
      req.body.overtime = overtimeDetails.hours;
      req.body.overtimeType = overtimeDetails.type;
    }

    const attendance = new Attendance(req.body);
    await attendance.save();
    
    await Employee.findByIdAndUpdate(req.body.employeeId, {
      $push: { attendanceRecords: attendance._id }
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ message: "Error adding attendance", error: error.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const query = date ? { date: new Date(date) } : {};
    
    const attendance = await Attendance.find(query)
      .populate('employeeId', 'name')
      .sort({ date: -1 });
      
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance", error: error.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { employeeId, checkIn, checkOut, shift, date } = req.body;

    // Calculate overtime if check-in and check-out times are provided
    if (checkIn && checkOut) {
      const overtimeDetails = await calculateOvertime(employeeId, checkIn, checkOut, shift, date);
      req.body.overtime = overtimeDetails.hours;
      req.body.overtimeType = overtimeDetails.type;
    }

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: "Error updating attendance", error: error.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    await Employee.findByIdAndUpdate(attendance.employeeId, {
      $pull: { attendanceRecords: attendance._id }
    });

    await attendance.remove();
    res.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting attendance", error: error.message });
  }
};
