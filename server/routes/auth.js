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
import deviceInfoController from '../controllers/deviceInfoController.js';
import sessionActivityController from '../controllers/sessionActivityController.js';
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";
import { recordPageView } from "../middleware/activityTrackingMiddleware.js";

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

// Session activity route
router.get("/sessions/:sessionId/activity", authMiddleware, adminMiddleware, sessionActivityController.getSessionActivity);

// Page view tracking route
router.post("/track/pageview", authMiddleware, recordPageView);

// Device information route
router.post("/update-device-info", authMiddleware, deviceInfoController.updateDeviceInfo);

export default router;