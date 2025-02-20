import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  position: String,
  image: String, // Path to the uploaded image
});

export default mongoose.model("Employee", EmployeeSchema);
