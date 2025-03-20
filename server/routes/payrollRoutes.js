import express from 'express';
import {
  generateEmployeePayroll,
  generateAllPayrolls,
  getEmployeePayroll,
  getAllPayrolls,
  updatePaymentStatus,
  deletePayroll,
  updatePayroll
} from '../controllers/payrollController.js';

const router = express.Router();

// Generate payroll for a specific employee
router.post('/generate', generateEmployeePayroll);

// Generate payroll for all active employees
router.post('/generate-all', generateAllPayrolls);

// Get payroll for a specific employee for a specific month and year
router.get('/employee/:id/:month/:year', getEmployeePayroll);

// Get all payrolls for a specific month and year
router.get('/month/:month/:year', getAllPayrolls);

// Update payment status
router.patch('/:id/payment-status', updatePaymentStatus);

// Update payroll details
router.patch('/:id', updatePayroll);

// Delete a payroll
router.delete('/:id', deletePayroll);

export default router;