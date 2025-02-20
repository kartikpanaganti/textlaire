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
    const { name, email, position } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const newEmployee = new Employee({ name, email, position, image });
    await newEmployee.save();

    res.json(newEmployee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Update Employee (with image update)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, email, position } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // If new image is uploaded, delete old image
    if (req.file && employee.image) {
      const oldImagePath = path.join("uploads", path.basename(employee.image));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Delete old image from local storage
      }
    }

    employee.name = name;
    employee.email = email;
    employee.position = position;
    if (req.file) {
      employee.image = `/uploads/${req.file.filename}`;
    }

    await employee.save();
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
