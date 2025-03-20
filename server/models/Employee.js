import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Employee name is required"]
  },
  email: {
    type: String,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"]
  },
  department: {
    type: String,
    enum: [
      "Production",
      "Quality Control",
      "Inventory & Raw Materials",
      "Workforce & HR",
      "Sales & Marketing",
      "Finance & Accounts",
      "Maintenance"
    ],
    required: [true, "Department is required"]
  },
  position: {
    type: String,
    enum: [
      // Production positions
      "Machine Operator",
      "Textile Worker",
      "Weaver/Knitter",
      "Dyeing & Printing Operator",
      // Quality Control positions
      "Quality Inspector",
      "Fabric Checker",
      "Testing Technician",
      // Inventory positions
      "Store Keeper",
      "Inventory Assistant",
      // HR positions
      "HR Executive",
      "Payroll Assistant",
      // Sales positions
      "Sales Executive",
      "Customer Support Representative",
      // Finance positions
      "Accountant",
      "Billing Assistant",
      // Maintenance positions
      "Maintenance Technician",
      "Electrical Engineer"
    ],
    required: [true, "Position is required"]
  },
  employeeID: {
    type: String,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d+$/.test(v);
      },
      message: props => `${props.value} is not a valid numeric ID!`
    }
  },
  salary: {
    type: Number,
    required: [true, "Salary is required"]
  },
  shiftTiming: String,
  joiningDate: {
    type: Date,
    required: [true, "Joining date is required"]
  },
  experienceLevel: String,
  workType: {
    type: String,
    enum: ["Full-time", "Part-time", "Contract", "Temporary", "Intern"],
    required: false
  },
  supervisor: String,
  address: String,
  emergencyContact: String,
  previousExperience: String,
  skills: String,
  workingHours: {
    type: Number,
    default: 8
  },
  shiftConfig: {
    type: {
      defaultShift: {
        type: String,
        enum: ["Day", "Night", "Morning", "Evening", "Flexible"],
        default: "Day"
      },
      shiftTimings: {
        Day: {
          start: { type: String, default: "09:00" },
          end: { type: String, default: "17:00" }
        },
        Night: {
          start: { type: String, default: "21:00" },
          end: { type: String, default: "05:00" }
        },
        Morning: {
          start: { type: String, default: "06:00" },
          end: { type: String, default: "14:00" }
        },
        Evening: {
          start: { type: String, default: "14:00" },
          end: { type: String, default: "22:00" }
        }
      }
    },
    default: {
      defaultShift: "Day",
      shiftTimings: {
        Day: { start: "09:00", end: "17:00" },
        Night: { start: "21:00", end: "05:00" },
        Morning: { start: "06:00", end: "14:00" },
        Evening: { start: "14:00", end: "22:00" }
      }
    }
  },
  image: String,
  status: {
    type: String,
    enum: ["Active", "Inactive", "On Leave", "Terminated"],
    default: "Active"
  },
  // Bank Details
  bankName: String,
  accountNumber: String,
  accountHolderName: String,
  ifscCode: String,
  // Home Details
  homeAddress: String,
  homePhone: String,
  homeEmail: String,
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
EmployeeSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Employee", EmployeeSchema); 