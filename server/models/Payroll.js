import mongoose from "mongoose";

const PayrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  daysWorked: {
    type: Number,
    default: 0
  },
  totalWorkingDays: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  overtimeAmount: {
    type: Number,
    default: 0
  },
  deductions: {
    tax: {
      type: Number,
      default: 0
    },
    leave: {
      type: Number,
      default: 0
    },
    insurance: {
      type: Number,
      default: 0
    },
    providentFund: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    description: {
      type: String
    }
  },
  allowances: {
    housing: {
      type: Number,
      default: 0
    },
    medical: {
      type: Number,
      default: 0
    },
    transport: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    description: {
      type: String
    }
  },
  grossSalary: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Cancelled"],
    default: "Pending"
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ["Bank Transfer", "Cash", "Check", "Other"],
    default: "Bank Transfer"
  },
  transactionId: {
    type: String
  },
  remarks: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for month, year, and employeeId to ensure uniqueness
PayrollSchema.index({ month: 1, year: 1, employeeId: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
PayrollSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  
  // Calculate gross salary
  this.grossSalary = this.baseSalary + this.overtimeAmount + 
    this.allowances.housing + this.allowances.medical + 
    this.allowances.transport + this.allowances.bonus + 
    this.allowances.other;
  
  // Calculate net salary
  this.netSalary = this.grossSalary - 
    (this.deductions.tax + this.deductions.leave + 
     this.deductions.insurance + this.deductions.providentFund + 
     this.deductions.other);
     
  next();
});

export default mongoose.model("Payroll", PayrollSchema); 