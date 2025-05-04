import express from "express";

import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import employeesRoutes from "./routes/employees.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/userRoutes.js"; // Import User Routes
import AttendanceRoutes from "./routes/attendanceRoutes.js"; // Import Attendance Routes
import productRoutes from "./routes/productRoutes.js"; // Import Product Routes
import uploadRoutes from "./routes/uploadRoutes.js"; // Import Upload Routes
import falProxyRoutes from "./routes/falProxyRoutes.js"; // Import fal.ai Proxy Routes
import payrollRoutes from "./routes/payrollRoutes.js"; // Import Payroll Routes
import networkRoutes from "./routes/networkRoutes.js"; // Import Network Routes
import path from "path";
import rawMaterialRoutes from './routes/rawMaterialRoutes.js';
import { config } from './config/index.js';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';


dotenv.config();
const app = express();

// Enable trust proxy - essential for getting correct client IP addresses
// This allows Express to trust the X-Forwarded-For header
app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Added PATCH method
  allowedHeaders: ['Content-Type', 'Authorization', 'x-fal-target-url', 'Accept', 'Origin', 'x-requested-with'],
  credentials: true
}));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"))); // Serve images

// Routes
app.use("/api/employees", employeesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // Add User Management Routes
app.use("/api/attendance", AttendanceRoutes); // Add Attendance Routes
app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/products', productRoutes); // Add Product Routes
app.use('/api/uploads', uploadRoutes); // Add Upload Routes
app.use('/api/fal', falProxyRoutes); // Add fal.ai Proxy Routes
app.use('/api/payroll', payrollRoutes); // Add Payroll Management Routes
app.use('/api/network', networkRoutes); // Add Network Information Routes
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

// Socket.IO setup
import { Server } from 'socket.io';
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://192.168.140.141:5173', 'http://192.168.101.141:5173', ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store active socket connections by user ID
const userSockets = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id, 'from address:', socket.handshake.address);
  
  // Associate user ID with socket ID when user logs in
  socket.on('user_connected', (data) => {
    // Handle both formats: string ID or object with userId
    const userId = typeof data === 'object' ? data.userId : data;
    console.log(`User ${userId} connected with socket ${socket.id} from ${socket.handshake.address}`);
    
    // Store user's socket connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    
    // Update socket with user ID for later reference
    socket.userId = userId;
    
    // Join a room specific to this user for easier broadcasting
    socket.join(`user-${userId}`);
    
    // Log current active connections
    console.log('Current active connections:');
    for (const [uid, sockets] of userSockets.entries()) {
      console.log(`- User ${uid}: ${sockets.size} connections`);
    }
  });
  
  // Handle registration for session updates (admin users only)
  socket.on('register_for_session_updates', async () => {
    if (!socket.userId) {
      console.log('Attempt to register for updates without user ID');
      return;
    }
    
    try {
      // Verify the user is an admin
      const User = (await import('./models/User.js')).default;
      const user = await User.findById(socket.userId);
      
      if (!user || user.role !== 'admin') {
        console.log(`User ${socket.userId} attempted to register for admin updates but is not admin`);
        return;
      }
      
      console.log(`Admin user ${socket.userId} registered for session updates`);
      
      // Add user to admin updates room
      socket.join('admin-session-updates');
      
      // Send initial data
      const UserSession = (await import('./models/UserSession.js')).default;
      
      // Get active sessions
      const activeSessions = await UserSession.find({
        $or: [
          { logoutTime: { $exists: false } },
          { isActive: true }
        ]
      }).populate('userId', 'name email role').sort({ loginTime: -1 });
      
      // Format and send active sessions
      const formattedSessions = activeSessions.map(session => {
        const formatted = session.toObject();
        if (formatted.loginTime) {
          const loginDate = new Date(formatted.loginTime);
          formatted.formattedLoginTime = loginDate.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true 
          });
        }
        return formatted;
      });
      
      // Send to this specific client
      socket.emit('active_sessions_updated', {
        success: true,
        count: formattedSessions.length,
        sessions: formattedSessions
      });
    } catch (error) {
      console.error('Error in register_for_session_updates:', error);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove socket from user's connections
    if (socket.userId && userSockets.has(socket.userId)) {
      userSockets.get(socket.userId).delete(socket.id);
      
      // Clean up empty sets
      if (userSockets.get(socket.userId).size === 0) {
        userSockets.delete(socket.userId);
      }
    }
  });
});

// Export io instance for use in controllers
export { io, userSockets };
