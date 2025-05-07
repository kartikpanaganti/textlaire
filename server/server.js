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
import chatRoutes from "./routes/chatRoutes.js"; // Import Chat Routes
import messageRoutes from "./routes/messageRoutes.js"; // Import Message Routes
import path from "path";
import rawMaterialRoutes from './routes/rawMaterialRoutes.js';
import { config } from './config/index.js';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { trackApiActivity } from './middleware/activityTrackingMiddleware.js';


dotenv.config();
const app = express();

// Enable trust proxy - essential for getting correct client IP addresses
// This allows Express to trust the X-Forwarded-For header
app.set('trust proxy', true);

// Configure CORS for Express with proper settings for credentials
app.use(cors({
  // CRITICAL FIX: Cannot use wildcard '*' with credentials
  // Instead, dynamically set the origin based on the request
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173'
      // Add any IP addresses your app might be accessed from
    ];
    
    // Check if the origin is allowed
    if (allowedOrigins.includes(origin) || origin.match(/^http:\/\/192\.168\./)) {
      return callback(null, true);
    } else {
      console.log('Express CORS: Origin not allowed:', origin);
      return callback(null, true); // Allow all in development
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-fal-target-url', 'Accept', 'Origin', 'x-requested-with', 'X-Background-Request'],
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

// Add extra headers to ensure cross-origin communication works
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Set the specific origin instead of wildcard '*' when using credentials
  res.header('Access-Control-Allow-Origin', origin || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Background-Request');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Activity tracking middleware - track API requests
app.use(trackApiActivity);

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
app.use('/api/chat', chatRoutes); // Add Chat Routes
app.use('/api/message', messageRoutes); // Add Message Routes
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
// Configure Socket.IO with proper CORS settings to fix cross-origin issues
const io = new Server(server, {
  cors: {
    // CRITICAL FIX: Cannot use wildcard '*' with credentials
    // Instead, dynamically set the origin based on the request
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      
      // List of allowed origins
      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        // Add any IP addresses your app might be accessed from
      ];
      
      // Check if the origin is allowed
      if (allowedOrigins.includes(origin) || origin.match(/^http:\/\/192\.168\./)) {
        return callback(null, true);
      } else {
        console.log('Origin not allowed by CORS:', origin);
        return callback(null, true); // Allow all in development
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true
  },
  // Enhanced CORS preflight handling for both localhost and IP address connections
  handlePreflightRequest: (req, res) => {
    const origin = req.headers.origin;
    
    // Set the Access-Control-Allow-Origin to the specific requesting origin
    // This is critical when using credentials
    res.writeHead(200, {
      'Access-Control-Allow-Origin': origin || 'http://localhost:5173',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Max-Age': 86400 // Cache preflight response for 24 hours
    });
    res.end();
  }
});

// Store active socket connections by user ID
const userSockets = new Map();

// Import jwt for token verification
import jwt from 'jsonwebtoken';

// Socket.IO connection handling with authentication
io.use((socket, next) => {
  try {
    // Check for auth token in handshake
    const token = socket.handshake.auth?.token || 
                 socket.handshake.headers?.authorization?.split(' ')[1];
    
    if (token) {
      // Verify the token
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.log('Socket authentication failed:', err.message);
          return next(new Error('Authentication error'));
        }
        
        // Store the decoded user info on the socket
        socket.user = decoded;
        socket.userId = decoded.id || decoded._id;
        console.log(`Socket authenticated for user: ${socket.userId}`);
        return next();
      });
    } else {
      // Allow connection without authentication for now, but mark as unauthenticated
      console.log('Socket connecting without authentication token');
      socket.authenticated = false;
      return next();
    }
  } catch (error) {
    console.error('Socket auth error:', error);
    return next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id, 'from address:', socket.handshake.address);
  console.log('Socket handshake details:', {
    query: socket.handshake.query,
    headers: socket.handshake.headers?.authorization ? 'Auth header present' : 'No auth header',
    url: socket.handshake.url,
    authenticated: socket.authenticated !== false
  });
  
  // Get user ID from either the socket auth or query params
  // Ensure we're getting a valid user ID by checking multiple sources
  const userId = socket.userId || socket.handshake.query.userId || socket.handshake.auth?.userId;
  
  console.log('Socket connection details:', {
    socketId: socket.id,
    userId: userId,
    queryUserId: socket.handshake.query.userId,
    authUserId: socket.handshake.auth?.userId,
    socketUserId: socket.userId
  });
  
  if (userId) {
    // Associate this socket with the user
    console.log('User ID found:', userId);
    // Store the userId on the socket object for future reference
    socket.userId = userId;
    
    // Add this socket to the user's active connections
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    
    // Tell the client they've been successfully identified
    socket.emit('connected_with_user_id', { userId: userId });
    
    // Join the user's personal room for direct messages
    const userRoom = `user-${userId}`;
    socket.join(userRoom);
    console.log(`Socket ${socket.id} joined personal room: ${userRoom}`);
    
        // IMPORTANT: Send a test message to verify socket connection
    // This helps debug real-time messaging issues
    setTimeout(() => {
      socket.emit('socket_test', { message: 'Socket connection verified', timestamp: new Date().toISOString() });
      console.log(`Sent socket_test to socket ${socket.id}`);
    }, 2000);
    
    // Set up periodic ping to keep connection alive
    // This is critical for long-running connections
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', { timestamp: new Date().toISOString() });
      }
    }, 25000); // Every 25 seconds
    
    // Store the interval ID for cleanup on disconnect
    socket.pingIntervalId = pingInterval;
  }
  
  // Handle joining specific chat rooms
  socket.on('join_chat', (chatId) => {
    if (!chatId) return;
    console.log(`Socket ${socket.id} joining chat room: chat-${chatId}`);
    socket.join(`chat-${chatId}`);
  });
  
  // Handle typing indicator
  socket.on('typing', (data) => {
    const { chatId, userId } = data;
    if (!chatId || !userId) return;
    
    // Get the chat and broadcast to all other users in the chat
    socket.to(`chat-${chatId}`).emit('typing_indicator', {
      chatId,
      userId
    });
  });
  
  // Handle stop typing
  socket.on('stop_typing', (data) => {
    const { chatId, userId } = data;
    if (!chatId || !userId) return;
    
    socket.to(`chat-${chatId}`).emit('typing_indicator_stop', {
      chatId,
      userId
    });
  });
  
  // Send the user's chat list when they reconnect to ensure UI consistency
  socket.on('request_chat_list', async () => {
    // Only proceed if we have a valid user ID
    if (!socket.userId) {
      console.warn(`Socket ${socket.id} requested chat list but has no userId`);
      return;
    }
    
    try {
      console.log(`Fetching chats for user ${socket.userId} after reconnection`);
      // Import models directly to avoid circular dependencies
      const Chat = (await import('./models/Chat.js')).default;
      const User = (await import('./models/User.js')).default;
      
      // Find all chats for this user
      const chats = await Chat.find({
        users: { $elemMatch: { $eq: socket.userId } },
      })
        .populate("users", "-password")
        .populate("groupAdmin", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1 });
      
      const results = await User.populate(chats, {
        path: "latestMessage.sender",
        select: "name email",
      });
      
      console.log(`Sending ${results.length} chats to user ${socket.userId}`);
      
      // Send the chats directly to this user's socket
      socket.emit('chat_list_update', results);
    } catch (error) {
      console.error('Error fetching chats after reconnection:', error);
    }
  });
  
  // Associate user ID with socket ID when user logs in - this event might be redundant
  // since we now extract userId from handshake query parameters on connection
  socket.on('user_connected', async (data) => {
    // Guard against null or undefined data
    if (!data) {
      console.warn(`Received invalid user_connected data from ${socket.id}: ${data}`);
      return;
    }
    
    // Handle both formats: string ID or object with userId
    const userId = typeof data === 'object' ? data.userId : data;
    
    // Guard against missing userId
    if (!userId) {
      console.warn(`Received user_connected without valid userId from ${socket.id}`);
      return;
    }
    
    console.log(`User ${userId} connected with socket ${socket.id} from ${socket.handshake.address}`);
    
    // Store user's socket connection if it wasn't already set on connection
    if (!socket.userId) {
      socket.userId = userId;
      console.log(`Setting socket.userId from user_connected event: ${userId}`);
    } else if (socket.userId !== userId) {
      console.warn(`Socket had userId ${socket.userId} but received ${userId} from user_connected`);
      // Update if different (shouldn't happen, but handle it anyway)
      socket.userId = userId;
    }
    
    // Ensure user is in the userSockets map
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    
    // Join a room specific to this user for easier broadcasting
    // This is a critical step for ensuring messages reach the user
    // consistently across all connected clients
    socket.join(`user-${userId}`);
    
    try {
      // Find all chats for this user and join those rooms
      const Chat = (await import('./models/Chat.js')).default;
      const chats = await Chat.find({ users: userId });
      
      console.log(`Adding user ${userId} to ${chats.length} chat rooms`);
      
      // Join all chat rooms this user is part of
      chats.forEach(chat => {
        console.log(`User ${userId} joining chat room: chat-${chat._id}`);
        socket.join(`chat-${chat._id}`);
      });
      
      // Send a confirmation to the client that they have been connected successfully
      socket.emit('chats_joined', { count: chats.length });
    } catch (error) {
      console.error('Error joining chat rooms:', error);
    }
    
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
    
    // Clear any ping intervals to prevent memory leaks
    if (socket.pingIntervalId) {
      clearInterval(socket.pingIntervalId);
      console.log(`Cleared ping interval for socket ${socket.id}`);
    }
    
    // Remove socket from user's connections
    if (socket.userId && userSockets.has(socket.userId)) {
      userSockets.get(socket.userId).delete(socket.id);
      console.log(`Removed socket ${socket.id} from user ${socket.userId}`);
      
      // If this was the last socket for this user, remove the user from the map
      if (userSockets.get(socket.userId).size === 0) {
        userSockets.delete(socket.userId);
        console.log(`Removed user ${socket.userId} from active users list`);
      }
    }
  });
});

// Export io instance for use in controllers
export { io, userSockets };
