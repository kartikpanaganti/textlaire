import express from "express";
import {
  calculatePayroll,
  getAllPayrolls,
  getPayrollById,
  getEmployeePayrollHistory,
  updatePayrollStatus,
  updatePayroll,
  deletePayroll,
  getPayrollHistory,
  previewPayroll,
  savePayroll,
  processPayment
} from "../controllers/payrollController.js";

const router = express.Router();

// Preview payroll calculation without saving
router.post("/preview", previewPayroll);

// Save calculated payroll
router.post("/save", savePayroll);

// Calculate and create new payroll
router.post("/calculate", calculatePayroll);

// Get all payrolls
router.get("/", getAllPayrolls);

// Get payroll history
router.get("/history", getPayrollHistory);

// Get employee payroll history
router.get("/employee/:employeeId", getEmployeePayrollHistory);

// Get specific payroll by ID
router.get("/:id", getPayrollById);

// Update payroll
router.put("/:id", updatePayroll);

// Process payroll payment
router.put("/:id/payment", processPayment);

// Delete payroll
router.delete("/:id", deletePayroll);

// Update payroll status
router.patch("/:id/status", updatePayrollStatus);

export default router; 