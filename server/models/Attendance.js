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
  // Updated overtime structure to better support payroll calculations
  overtimeHours: {
    type: Number,
    default: 0
  },
  overtimeRate: {
    type: Number,
    default: 1.5
  },
  // For backwards compatibility
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
  },
  // Add payroll-relevant fields
  isPayrollProcessed: {
    type: Boolean,
    default: false
  },
  payrollMonth: {
    type: Number,
    min: 1,
    max: 12,
    // Derive from date
    set: function(val) {
      if (!val && this.date) {
        return new Date(this.date).getMonth() + 1;
      }
      return val;
    }
  },
  payrollYear: {
    type: Number,
    // Derive from date
    set: function(val) {
      if (!val && this.date) {
        return new Date(this.date).getFullYear();
      }
      return val;
    }
  }
}, {
  timestamps: true
});

// Add compound unique index for employeeId and date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Add index for payroll queries to improve performance
attendanceSchema.index({ employeeId: 1, payrollMonth: 1, payrollYear: 1 });

// Pre-save middleware to ensure payroll month and year are populated
attendanceSchema.pre('save', function(next) {
  if (this.date) {
    const dateObj = new Date(this.date);
    this.payrollMonth = dateObj.getMonth() + 1; // JavaScript months are 0-indexed
    this.payrollYear = dateObj.getFullYear();
    
    // Sync overtime fields for compatibility
    if (this.overtimeHours && !this.overtime.hours) {
      this.overtime.hours = this.overtimeHours;
    } else if (this.overtime.hours && !this.overtimeHours) {
      this.overtimeHours = this.overtime.hours;
    }
    
    if (this.overtimeRate && !this.overtime.rate) {
      this.overtime.rate = this.overtimeRate;
    } else if (this.overtime.rate && !this.overtimeRate) {
      this.overtimeRate = this.overtime.rate;
    }
  }
  next();
});

export default mongoose.model("Attendance", attendanceSchema);
