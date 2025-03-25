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
    required: true
  },
  checkIn: {
    type: String
  },
  checkOut: {
    type: String
  },
  date: {
    type: String,
    required: true,
    set: function(date) {
      return new Date(date).toISOString().split('T')[0];
    }
  },
  shift: {
    type: String,
    enum: ["Day", "Night", "Morning", "Evening", "Flexible"]
  },
  breakTime: String,
  workFromHome: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  location: {
    lat: Number,
    lng: Number
  },
  overtime: {
    hours: {
      type: Number,
      default: 0
    },
    rate: {
      type: Number,
      default: 1.5
    },
    totalHours: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Add compound unique index for employeeId and date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
