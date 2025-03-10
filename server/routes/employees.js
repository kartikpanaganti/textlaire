import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import Employee from "../models/Employee.js";

const router = express.Router();

// Constants for validation
const departments = [
  "Weaving",
  "Dyeing",
  "Printing",
  "Quality Control",
  "Packaging",
  "Maintenance",
  "Administration",
  "Human Resources",
  "Finance",
  "IT"
];

const positions = [
  "Manager",
  "Supervisor",
  "Operator",
  "Technician",
  "Quality Inspector",
  "Team Lead",
  "Assistant",
  "Specialist",
  "Coordinator",
  "Analyst"
];

const workTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Intern"
];

const statuses = ["Active", "Inactive", "On Leave", "Terminated"];

/**
 * Find the next available employee ID
 * This function finds gaps in the sequence and returns the lowest available ID
 */
const getNextAvailableID = async () => {
  try {
    // Get all employee IDs
    const employees = await Employee.find({}, 'employeeID');
    
    // Convert to numbers and sort
    const usedIDs = employees
      .map(e => parseInt(e.employeeID, 10))
      .filter(id => !isNaN(id))
      .sort((a, b) => a - b);
    
    // Create a Set for faster lookups
    const idSet = new Set(usedIDs);
    
    // Start from 1 and find the first available ID
    let nextID = 1;
    while (idSet.has(nextID)) {
      nextID++;
    }
    
    return nextID.toString();
  } catch (error) {
    console.error("Error generating ID:", error);
    throw new Error("Unable to generate employee ID");
  }
};

// Multer Config for Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/employees";
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Get employee name and ID from request body
    const employeeName = req.body.name || 'unnamed';
    const employeeID = req.body.employeeID || `temp_${Date.now()}`;
    
    // Format the filename
    const formattedName = employeeName.toLowerCase().replace(/\s+/g, '_');
    const extension = path.extname(file.originalname);
    const filename = `${formattedName}_${employeeID}${extension}`;
    
    cb(null, filename);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation middleware
const validateEmployee = (req, res, next) => {
  const { department, position, workType, status } = req.body;
  
  const errors = [];
  
  if (department && !departments.includes(department)) {
    errors.push("Invalid department");
  }
  
  if (position && !positions.includes(position)) {
    errors.push("Invalid position");
  }
  
  if (workType && !workTypes.includes(workType)) {
    errors.push("Invalid work type");
  }
  
  if (status && !statuses.includes(status)) {
    errors.push("Invalid status");
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(", ") });
  }
  
  next();
};

// GET all employees
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
});

// GET single employee
router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ message: "Failed to fetch employee" });
  }
});

// POST: Create Employee
router.post("/", upload.single("image"), validateEmployee, async (req, res) => {
  try {
    let { employeeID, ...rest } = req.body;
    
    // Log incoming request data
    console.log("Incoming request data:", req.body);
    
    // Ensure employeeID is a string and trim it
    employeeID = employeeID ? employeeID.toString().trim() : '';
    
    // Auto-generate ID if empty
    if (!employeeID) {
      try {
        employeeID = await getNextAvailableID();
        console.log("Generated ID:", employeeID);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    } else {
      // Validate that employeeID is numeric
      if (!/^\d+$/.test(employeeID)) {
        console.log("Invalid employee ID format:", employeeID);
        return res.status(400).json({ message: "Employee ID must be a numeric value" });
      }
      
      // Check if ID already exists
      const existingEmployee = await Employee.findOne({ employeeID });
      console.log("Checking for existing employee with ID:", employeeID);
      if (existingEmployee) {
        console.log("Employee ID already exists:", employeeID);
        return res.status(400).json({ message: "Employee ID already exists! Please use a unique ID." });
      }
    }

    // Process image if uploaded
    const image = req.file ? `/uploads/employees/${req.file.filename}` : undefined;

    // Log processed image path
    console.log("Processed image path:", image);

    // Create new employee
    const newEmployee = new Employee({
      employeeID,
      ...rest,
      image,
      status: rest.status || "Active"
    });

    // Save to database
    const savedEmployee = await newEmployee.save();
    console.log("Employee saved successfully:", savedEmployee);
    res.status(201).json(savedEmployee);
  } catch (err) {
    console.error("Error creating employee:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ message: "Employee ID already exists! Please use a unique ID." });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: "Failed to create employee" });
  }
});

// PUT: Update Employee
router.put("/:id", upload.single("image"), validateEmployee, async (req, res) => {
  try {
    const { employeeID, ...rest } = req.body;
    
    // Find employee by ID
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    // If employeeID is being changed, validate it
    if (employeeID && employeeID !== employee.employeeID) {
      // Validate that employeeID is numeric
      if (!/^\d+$/.test(employeeID)) {
        return res.status(400).json({ message: "Employee ID must be a numeric value" });
      }
      
      // Check if ID already exists
      const existingEmployee = await Employee.findOne({ employeeID });
      if (existingEmployee && existingEmployee._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "Employee ID already exists! Please use a unique ID." });
      }
      
      // Update the ID
      employee.employeeID = employeeID;
    }

    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      if (employee.image && !employee.image.includes("default-profile.png")) {
        const oldImagePath = path.join(process.cwd(), employee.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Set new image
      employee.image = `/uploads/employees/${req.file.filename}`;
    }

    // Update other fields
    Object.keys(rest).forEach(key => {
      if (rest[key] !== undefined) {
        employee[key] = rest[key];
      }
    });

    // Save updated employee
    const updatedEmployee = await employee.save();
    res.json(updatedEmployee);
  } catch (err) {
    console.error("Error updating employee:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ message: "Employee ID already exists! Please use a unique ID." });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: "Failed to update employee" });
  }
});

// DELETE: Delete Employee
router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Delete employee image if it exists
    if (employee.image && !employee.image.includes("default-profile.png")) {
      const imagePath = path.join(process.cwd(), employee.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete employee from database
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ message: "Failed to delete employee" });
  }
});

export default router; 