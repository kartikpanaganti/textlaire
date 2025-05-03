import jwt from "jsonwebtoken";
import User from "../models/User.js";
import UserSession from "../models/UserSession.js";

// Middleware to verify JWT token and check if user is authenticated
const authMiddleware = async (req, res, next) => {
  // Get token from header
  const authHeader = req.header("Authorization");
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: "No token, authorization denied" 
    });
  }

  // Extract token from Bearer format
  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists and is active
    const session = await UserSession.findOne({ 
      sessionId: decoded.sessionId,
      isActive: true
    });
    
    if (!session) {
      return res.status(401).json({ 
        success: false,
        message: "Session expired or invalid" 
      });
    }
    
    // Check if user exists and is logged in
    const user = await User.findById(decoded.userId);
    if (!user || !user.isLoggedIn) {
      return res.status(401).json({ 
        success: false,
        message: "User not found or not logged in" 
      });
    }
    
    // Set user info in request object
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ 
      success: false,
      message: "Token is not valid" 
    });
  }
};

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: "Access denied: Admin privileges required" 
    });
  }
};

// Middleware to check if user is employee
const employeeMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === 'employee' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: "Access denied: Employee privileges required" 
    });
  }
};

export { authMiddleware, adminMiddleware, employeeMiddleware };
export default authMiddleware;
