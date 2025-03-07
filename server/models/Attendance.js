import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "On Leave", "Half Day", "Late"],
    default: "Present"
  },
  checkIn: String,
  checkOut: String,
  date: Date,
  shift: String,
  breakTime: String,
  overtime: Number,
  workFromHome: Boolean,
  notes: String,
  location: {
    lat: Number,
    lng: Number
  }
});

export default mongoose.model("Attendance", attendanceSchema);
