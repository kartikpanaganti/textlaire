// Core dependencies
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Socket.IO

// Routes
import employeesRoutes from "./routes/employees.js";
import authRoutes from "./routes/auth.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import rawMaterialRoutes from './routes/rawMaterialRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"))); // Serve images

// API Routes
app.use("/api/employees", employeesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// Initialize Socket.IO
