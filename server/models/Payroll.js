import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  payPeriodStart: {
    type: Date,
    required: true
  },
  payPeriodEnd: {
    type: Date,
    required: true
  },
  // Extract month and year for indexing
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  overtime: {
    hours: Number,
    rate: Number,
    amount: Number
  },
  deductions: {
    tax: {
      type: Number,
      default: 0
    },
    insurance: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    // Custom deductions array
    custom: [{
      name: String,
      amount: Number
    }]
  },
  allowances: {
    housing: {
      type: Number,
      default: 0
    },
    transport: {
      type: Number,
      default: 0
    },
    meal: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    // Custom allowances array
    custom: [{
      name: String,
      amount: Number
    }]
  },
  totalEarnings: {
    type: Number,
    required: true
  },
  totalDeductions: {
    type: Number,
    required: true
  },
  netSalary: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Processed", "Paid"],
    default: "Pending"
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ["Bank Transfer", "Cash", "Check"],
    required: true
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
payrollSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  
  // Set month and year from payPeriodEnd if not already set
  if (!this.month || !this.year) {
    const endDate = new Date(this.payPeriodEnd);
    this.month = endDate.getMonth() + 1; // getMonth() is 0-indexed
    this.year = endDate.getFullYear();
  }
  
  next();
});

// Add compound index for employeeId, month, and year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Payroll", payrollSchema); 