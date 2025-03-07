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

// Create attendance record
router.post("/", async (req, res) => {
  try {
    const { employeeId, status, checkIn, checkOut, date, shift, breakTime, overtime, workFromHome, notes, location } = req.body;
    const newAttendance = new Attendance({
      employeeId,
      status,
      checkIn,
      checkOut,
      date,
      shift,
      breakTime,
      overtime,
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
