import express from "express";
import multer from "multer";
import fs from "fs";
import Employee from "../models/Employee.js";
import path from "path";

const router = express.Router();

// Constants for validation
const departments = ["Weaving", "Dyeing", "Printing", "Quality Control", "Packaging", "Maintenance"];
const positions = ["Machine Operator", "Quality Inspector", "Supervisor", "Technician", "Helper"];
const workTypes = ["Full-Time", "Part-Time", "Contract", "Seasonal", "Trainee"];
const statuses = ["Active", "Inactive", "On Leave", "Terminated"];

// Helper function to generate next available ID
const getNextAvailableID = async () => {
  try {
    const employees = await Employee.find({}, 'employeeID');
    const numericIDs = employees
      .map(e => parseInt(e.employeeID, 10))
      .filter(id => !isNaN(id))
      .sort((a, b) => a - b);

    let expectedID = 1;
    for (const id of numericIDs) {
      if (id > expectedID) break;
      expectedID = id + 1;
    }
    return expectedID.toString();
  } catch (error) {
    console.error("Error generating ID:", error);
    return "1001"; // Fallback starting ID
  }
};

// Multer Config for Image Upload
const storage = multer.diskStorage({
  destination: "uploads/employees/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Validation middleware
const validateEmployee = (req, res, next) => {
  const { department, position, workType, status } = req.body;
  
  if (department && !departments.includes(department)) {
    return res.status(400).json({ message: "Invalid department" });
  }
  if (position && !positions.includes(position)) {
    return res.status(400).json({ message: "Invalid position" });
  }
  if (workType && !workTypes.includes(workType)) {
    return res.status(400).json({ message: "Invalid work type" });
  }
  if (status && !statuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  next();
};

// GET all employees
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: Create Employee
router.post("/", upload.single("image"), validateEmployee, async (req, res) => {
  try {
    let { employeeID, ...rest } = req.body;
    
    // Auto-generate ID if not provided or empty
    if (!employeeID || employeeID.trim() === "") {
      employeeID = await getNextAvailableID();
    }

    const image = req.file ? `/uploads/employees/${req.file.filename}` : undefined;

    const newEmployee = new Employee({
      employeeID,
      ...rest,
      image,
      status: rest.status || "Active"
    });

    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Employee ID must be unique" });
    }
    res.status(500).json({ message: err.message });
  }
});

// PUT: Update Employee
router.put("/:id", upload.single("image"), validateEmployee, async (req, res) => {
  try {
    const { 
      name, email, phoneNumber, department, position, employeeID, salary,
      shiftTiming, joiningDate, experienceLevel, workType, status,
      supervisor, address, emergencyContact, previousExperience,
      skills, workingHours, attendanceRecord
    } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Handle image update
    if (req.file) {
      if (employee.image && !employee.image.includes("default-profile.png")) {
        const oldImagePath = path.join("uploads/employees", path.basename(employee.image));
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      employee.image = `/uploads/employees/${req.file.filename}`;
    }

    // Update fields
    const fields = {
      name, email, phoneNumber, department, position, employeeID,
      salary, shiftTiming, joiningDate, experienceLevel, workType,
      status, supervisor, address, emergencyContact, previousExperience,
      skills, workingHours, attendanceRecord
    };

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) employee[key] = value;
    });

    await employee.save();
    res.json(employee);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Employee ID must be unique" });
    }
    console.error("Server Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE: Delete Employee
router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    if (employee.image && !employee.image.includes("default-profile.png")) {
      const imagePath = path.join("uploads/employees", path.basename(employee.image));
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;  