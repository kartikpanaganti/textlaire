import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  phoneNumber: String,
  department: String,
  position: String,
  employeeID: String,
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
  image: String, // Path to the uploaded image
});

export default mongoose.model("Employee", EmployeeSchema);
