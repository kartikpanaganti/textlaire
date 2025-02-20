import express from "express";
import multer from "multer";
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

// DELETE Employee
router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;
