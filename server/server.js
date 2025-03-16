import express from "express";

import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import employeesRoutes from "./routes/employees.js";
import authRoutes from "./routes/auth.js";
import AttendanceRoutes from "./routes/attendanceRoutes.js"; // Import Attendance Routes
import payrollRoutes from "./routes/payrollRoutes.js"; // Import Payroll Routes
import payrollSettingsRoutes from "./routes/payrollSettingsRoutes.js";
import path from "path";
import rawMaterialRoutes from './routes/rawMaterialRoutes.js';
import { config } from './config/index.js';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';


dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"))); // Serve images

// Routes
app.use("/api/employees", employeesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/attendance", AttendanceRoutes); // Add Attendance Routes
app.use("/api/payroll", payrollRoutes); // Add Payroll Routes
app.use("/api/payroll-settings", payrollSettingsRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
// Routes
app.use('/api', apiRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Database health check route
app.get('/db-health', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      res.json({ 
        status: 'ok', 
        message: 'Database connection is healthy',
        details: {
          database: mongoose.connection.name,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          readyState: 'connected'
        }
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'Database connection is not established',
        readyState: mongoose.connection.readyState
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to check database health',
      error: error.message
    });
  }
});

// Error handling middleware
app.use(errorHandler);
// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000; // Define PORT variable
const server = app.listen(PORT, () => console.log(`✅ Server running on port ${config.port}`)); // Start server
