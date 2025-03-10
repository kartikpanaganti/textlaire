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
      "Weaving",
      "Dyeing",
      "Printing",
      "Quality Control",
      "Packaging",
      "Maintenance",
      "Administration",
      "Human Resources",
      "Finance",
      "IT"
    ],
    required: [true, "Department is required"]
  },
  position: {
    type: String,
    enum: [
      "Manager",
      "Supervisor",
      "Operator",
      "Technician",
      "Quality Inspector",
      "Team Lead",
      "Assistant",
      "Specialist",
      "Coordinator",
      "Analyst"
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
    required: [true, "Work type is required"]
  },
  supervisor: String,
  address: String,
  emergencyContact: String,
  previousExperience: String,
  skills: String,
  workingHours: Number,
  image: String,
  status: {
    type: String,
    enum: ["Active", "Inactive", "On Leave", "Terminated"],
    default: "Active"
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
EmployeeSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Employee", EmployeeSchema); 