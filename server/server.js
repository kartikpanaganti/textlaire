import express from "express";
import { initializeSockets } from "./socket/socket.js"; // Import Socket.IO initialization

import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import employeesRoutes from "./routes/employees.js";
import authRoutes from "./routes/auth.js";
import inventoryRoutes from "./routes/inventoryRoutes.js"; // Import Inventory Routes
import AttendanceRoutes from "./routes/attendanceRoutes.js"; // Import Attendance Routes
import path from "path";
import rawMaterialRoutes from './routes/rawMaterialRoutes.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"))); // Serve images

// Routes
app.use("/api/employees", employeesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes); // Add Inventory Routes
app.use("/api/attendance", AttendanceRoutes); // Add Attendance Routes
app.use('/api/raw-materials', rawMaterialRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000; // Define PORT variable
const server = app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`)); // Start server
const io = initializeSockets(server); // Initialize Socket.IO
