import express from 'express';
import { getStatus, setEnabled, generatePayrolls } from '../controllers/autoPayrollController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get auto generation status
router.get('/status', authenticateToken, getStatus);

// Toggle auto generation
router.post('/toggle', authenticateToken, setEnabled);

// Manually trigger payroll generation
router.post('/generate', authenticateToken, generatePayrolls);

export default router; 