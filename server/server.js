import express from "express";

import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import employeesRoutes from "./routes/employees.js";
import authRoutes from "./routes/auth.js";
import AttendanceRoutes from "./routes/attendanceRoutes.js"; // Import Attendance Routes
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
app.use('/api/raw-materials', rawMaterialRoutes);
// Routes
app.use('/api', apiRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);
// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000; // Define PORT variable
const server = app.listen(PORT, () => console.log(`✅ Server running on port ${config.port}`)); // Start server
