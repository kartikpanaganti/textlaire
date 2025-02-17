import express from "express";
import Employee from "../models/Employee.js";

const router = express.Router();

// GET all employees
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ message: "Error fetching employees", error: err });
  }
});

// POST request to add a new employee
router.post("/", async (req, res) => {
  try {
    const { name, position, department, email, phone } = req.body;
    const newEmployee = new Employee({ name, position, department, email, phone });
    await newEmployee.save();
    res.status(201).json({ message: "Employee added successfully", employee: newEmployee });
  } catch (err) {
    res.status(500).json({ message: "Error adding employee", error: err });
  }
});

export default router;
