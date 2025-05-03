import express from "express";
import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  getActiveSessions, 
  forceLogout, 
  getSessionHistory,
  getUserActivityStats
} from "../controllers/authController.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", authMiddleware, logout);

// Admin routes
router.get("/sessions/active", authMiddleware, adminMiddleware, getActiveSessions);
router.get("/sessions/history", authMiddleware, adminMiddleware, getSessionHistory);
router.post("/sessions/:sessionId/logout", authMiddleware, adminMiddleware, forceLogout);
router.get("/stats/activity", authMiddleware, adminMiddleware, getUserActivityStats);

export default router;