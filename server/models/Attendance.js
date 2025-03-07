import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Late", "On Leave"],
    default: "Present"
  },
  checkIn: String,
  checkOut: String,
  date: {
    type: String,
    set: function(date) {
      return new Date(date).toISOString().split('T')[0];
    }
  },
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

// Add compound unique index for employeeId and date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
