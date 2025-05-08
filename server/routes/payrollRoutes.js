import express from 'express';
import { 
  getPayrolls, 
  getPayrollById, 
  generatePayroll, 
  generateBulkPayroll,
  updatePaymentStatus,
  updatePayroll,
  deletePayroll,
  getPayrollSummary,
  batchUpdatePaymentStatus,
  generatePayrollReports,
  calculateTaxBreakdown,
  manageBonusIncentives,
  bulkManageBonus,
  recalculatePayroll
} from '../controllers/payrollController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes (require authentication)
router.get('/', authMiddleware, getPayrolls);
router.get('/summary', authMiddleware, adminMiddleware, getPayrollSummary);
router.get('/reports', authMiddleware, adminMiddleware, generatePayrollReports);
router.get('/:id', authMiddleware, getPayrollById);

// Tax and reporting routes
router.post('/calculate-tax', authMiddleware, adminMiddleware, calculateTaxBreakdown);

// Bonus management routes
router.post('/manage-bonus', authMiddleware, adminMiddleware, manageBonusIncentives);
router.post('/bulk-bonus', authMiddleware, adminMiddleware, bulkManageBonus);

// Admin-only routes
router.post('/generate', authMiddleware, adminMiddleware, generatePayroll);
router.post('/generate-bulk', authMiddleware, adminMiddleware, generateBulkPayroll);
router.patch('/:id/payment-status', authMiddleware, adminMiddleware, updatePaymentStatus);
router.post('/batch-update-status', authMiddleware, adminMiddleware, batchUpdatePaymentStatus);
router.put('/:id', authMiddleware, adminMiddleware, updatePayroll);
router.delete('/:id', authMiddleware, adminMiddleware, deletePayroll);

// Recalculate payroll to fix any discrepancies
router.put('/recalculate/:id', authMiddleware, adminMiddleware, recalculatePayroll);

export default router;
