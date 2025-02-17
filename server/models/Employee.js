import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  department: { type: String },
  email: { type: String },
  phone: { type: String },
});

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
