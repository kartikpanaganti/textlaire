import express from "express";
import multer from "multer";
import fs from "fs";
import Employee from "../models/Employee.js";
import path from "path";

const router = express.Router();

// Multer Config for Image Upload
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

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
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      department,
      position,
      employeeID,
      salary,
      shiftTiming,
      joiningDate,
      experienceLevel,
      workType,
      supervisor,
      address,
      emergencyContact,
      previousExperience,
      skills,
      workingHours,
      attendanceRecord,
    } = req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const newEmployee = new Employee({
      name,
      email,
      phoneNumber,
      department,
      position,
      employeeID,
      salary,
      shiftTiming,
      joiningDate,
      experienceLevel,
      workType,
      supervisor,
      address,
      emergencyContact,
      previousExperience,
      skills,
      workingHours,
      attendanceRecord,
      image,
    });

    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// PUT: Update Employee (with image update)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { 
      name, email, phoneNumber, department, position, employeeID, salary,
      shiftTiming, joiningDate, experienceLevel, workType, supervisor, address,
      emergencyContact, previousExperience, skills, workingHours, attendanceRecord
    } = req.body;

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // If a new image is uploaded, delete the old one
    if (req.file && employee.image) {
      const oldImagePath = path.join("uploads", path.basename(employee.image));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update fields
    employee.name = name;
    employee.email = email;
    employee.phoneNumber = phoneNumber;
    employee.department = department;
    employee.position = position;
    employee.employeeID = employeeID;
    employee.salary = salary;
    employee.shiftTiming = shiftTiming;
    employee.joiningDate = joiningDate;
    employee.experienceLevel = experienceLevel;
    employee.workType = workType;
    employee.supervisor = supervisor;
    employee.address = address;
    employee.emergencyContact = emergencyContact;
    employee.previousExperience = previousExperience;
    employee.skills = skills;
    employee.workingHours = workingHours;
    employee.attendanceRecord = attendanceRecord;
    
    // If a new image is uploaded, update it
    if (req.file) {
      employee.image = `/uploads/${req.file.filename}`;
    }

    await employee.save();
    res.json(employee);
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// DELETE: Delete Employee (with image removal)
router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Delete image from local storage
    if (employee.image) {
      const imagePath = path.join("uploads", path.basename(employee.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
