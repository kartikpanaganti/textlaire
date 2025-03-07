import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  phoneNumber: String,
  department: String,
  position: String,
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
  salary: Number,
  shiftTiming: String,
  joiningDate: Date,
  experienceLevel: String,
  workType: String, // Permanent/Contract
  supervisor: String,
  address: String,
  emergencyContact: String,
  previousExperience: String,
  skills: String,
  workingHours: Number,
  attendanceRecord: String,
  image:String,
  status: {
    type: String,
    enum: ["Active", "Inactive", "On Leave", "Terminated"],
    default: "Active"
  }
});

export default mongoose.model("Employee", EmployeeSchema);