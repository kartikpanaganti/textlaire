import express from 'express';
import Attendance from '../models/Attendance.js';

const router = express.Router();

router.post('/bulk', async (req, res) => {
  try {
    const attendanceRecords = req.body;
    
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ message: 'Invalid attendance data' });
    }

    const result = await Attendance.insertMany(attendanceRecords);

    res.status(201).json({
      message: 'Attendance records created successfully',
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create attendance records',
      error: error.message 
    });
  }
});

export default router;
