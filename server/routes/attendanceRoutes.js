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

router.post('/bulk', async (req, res) => {
  try {
    const attendanceRecords = req.body;
    const savedRecords = await Promise.all(
      attendanceRecords.map(async (record) => {
        // Calculate overtime if check-in and check-out times are provided
        let overtime = 0;
        let overtimeRate = 1.5;
        
        if (record.checkIn && record.checkOut) {
          const [startHour, startMinute] = record.checkIn.split(':').map(Number);
          const [endHour, endMinute] = record.checkOut.split(':').map(Number);
          
          let hours = endHour - startHour;
          let minutes = endMinute - startMinute;
          
          // Handle overnight shifts
          if (hours < 0) {
            hours += 24;
          }
          
          const totalHours = hours + (minutes / 60);
          const standardHours = 8; // Default working hours
          overtime = Math.max(0, totalHours - standardHours);
        }

        const attendance = new Attendance({
          employeeId: record.employeeId,
          status: record.status,
          checkIn: record.checkIn,
          checkOut: record.checkOut,
          date: record.date,
          shift: record.shift,
          workFromHome: record.workFromHome,
          overtime,
          overtimeRate
        });
        return await attendance.save();
      })
    );
    
    res.status(201).json({
      success: true,
      message: 'Bulk attendance recorded successfully',
      data: savedRecords
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Attendance already exists for some employees on this date'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error recording bulk attendance',
        error: error.message
      });
    }
  }
});

// Create attendance record
router.post("/", async (req, res) => {
  try {
    const { employeeId, status, checkIn, checkOut, date, shift, breakTime, overtime, overtimeRate, workFromHome, notes, location } = req.body;
    const newAttendance = new Attendance({
      employeeId,
      status,
      checkIn,
      checkOut,
      date,
      shift,
      breakTime,
      overtime,
      overtimeRate,
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

export default router;
