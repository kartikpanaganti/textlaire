import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";  // Optional, for more complex requests like file uploads

dotenv.config();

// Initialize the app
const app = express();

// Middleware
app.use(express.json());  // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // Optional for URL encoded data
app.use(cors({
  origin: "http://localhost:5173",  // Allow requests from your frontend URL (change if needed)
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Define Employee Schema
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  department: { type: String, required: false },
  email: { type: String, required: false },
  phone: { type: String, required: false },
});

const Employee = mongoose.model("Employee", employeeSchema);

// Routes

// GET all employees
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees", error });
  }
});

// POST create a new employee
app.post("/api/employees", async (req, res) => {
  const { name, position, department, email, phone } = req.body;

  if (!name || !position) {
    return res.status(400).json({ message: "Name and Position are required" });
  }

  try {
    const newEmployee = new Employee({ name, position, department, email, phone });
    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ message: "Error creating employee", error });
  }
});

// PUT update an employee
app.put("/api/employees/:id", async (req, res) => {
  const { id } = req.params;
  const { name, position, department, email, phone } = req.body;

  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { name, position, department, email, phone },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ message: "Error updating employee", error });
  }
});

// DELETE an employee
app.delete("/api/employees/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedEmployee = await Employee.findByIdAndDelete(id);

    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting employee", error });
  }
});

// Default Route
app.get("/", (req, res) => {
  res.send("Workforce Management API is running...");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
