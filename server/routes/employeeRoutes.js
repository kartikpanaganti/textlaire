import express from 'express';
import Employee from '../models/Employee.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create Employee (POST)
router.post('/', verifyToken, async (req, res) => {
  const { name, position, department, email, phone } = req.body;
  const newEmployee = new Employee({ name, position, department, email, phone });
  
  try {
    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get All Employees (GET)
router.get('/', verifyToken, async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get Single Employee (GET)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Employee (PUT)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Employee (DELETE)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
