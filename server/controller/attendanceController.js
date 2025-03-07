import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

export const addAttendance = async (req, res) => {
  try {
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
