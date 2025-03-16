import express from "express";
import {
  getPayrollSettings,
  updatePayrollSettings,
  resetPayrollSettings
} from "../controllers/payrollSettingsController.js";

const router = express.Router();

// Get active payroll settings
router.get("/", getPayrollSettings);

// Update payroll settings
router.put("/", updatePayrollSettings);

// Reset payroll settings to defaults
router.post("/reset", resetPayrollSettings);

export default router; 