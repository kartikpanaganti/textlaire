import mongoose from "mongoose";

const payrollSettingsSchema = new mongoose.Schema({
  // Default allowance rates
  allowances: {
    housing: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage"
      },
      value: {
        type: Number,
        default: 10 // 10% of basic salary
      }
    },
    transport: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "fixed"
      },
      value: {
        type: Number,
        default: 2000 // Fixed amount
      }
    },
    meal: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "fixed"
      },
      value: {
        type: Number,
        default: 1500 // Fixed amount
      }
    },
    other: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "fixed"
      },
      value: {
        type: Number,
        default: 0
      }
    }
  },
  
  // Default deduction rates
  deductions: {
    tax: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage"
      },
      value: {
        type: Number,
        default: 10 // 10% of basic salary
      }
    },
    insurance: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage"
      },
      value: {
        type: Number,
        default: 5 // 5% of basic salary
      }
    },
    other: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "fixed"
      },
      value: {
        type: Number,
        default: 0
      }
    }
  },
  
  // Overtime rate multiplier (e.g., 1.5 means 1.5x regular hourly rate)
  overtimeRateMultiplier: {
    type: Number,
    default: 1.5
  },
  
  // Working days per month for pro-rating salary
  workingDaysPerMonth: {
    type: Number,
    default: 30
  },
  
  // Working hours per day for calculating hourly rate
  workingHoursPerDay: {
    type: Number,
    default: 8
  },
  
  // Is this the active settings object?
  isActive: {
    type: Boolean,
    default: true
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

// Update the updatedAt timestamp before saving
payrollSettingsSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get active settings
payrollSettingsSchema.statics.getActive = async function() {
  let settings = await this.findOne({ isActive: true });
  
  // If no active settings exist, create default settings
  if (!settings) {
    settings = await this.create({ isActive: true });
  }
  
  return settings;
};

export default mongoose.model("PayrollSettings", payrollSettingsSchema); 