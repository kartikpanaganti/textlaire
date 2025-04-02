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
import Payroll from '../models/Payroll.js';

const router = express.Router();

// Generate payroll for a specific employee
router.post('/generate', generateEmployeePayroll);

// Generate payroll for all active employees
router.post('/generate-all', generateAllPayrolls);

// Batch generate payrolls from client-side data
router.post('/batch-generate', async (req, res) => {
  try {
    const { payrolls } = req.body;
    
    if (!payrolls || !Array.isArray(payrolls) || payrolls.length === 0) {
      return res.status(400).json({ 
        error: "Invalid request format. Expected array of payroll objects."
      });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    // Process each payroll in the array
    for (const payrollData of payrolls) {
      try {
        // Check if a payroll already exists for this employee/month/year
        const existingPayroll = await Payroll.findOne({
          employeeId: payrollData.employeeId,
          month: payrollData.month,
          year: payrollData.year
        });
        
        if (existingPayroll) {
          // Update the existing payroll
          Object.assign(existingPayroll, payrollData);
          await existingPayroll.save();
          
          results.successful.push({
            employeeId: payrollData.employeeId,
            payrollId: existingPayroll._id,
            action: 'updated'
          });
        } else {
          // Create a new payroll
          const newPayroll = new Payroll(payrollData);
          await newPayroll.save();
          
          results.successful.push({
            employeeId: payrollData.employeeId,
            payrollId: newPayroll._id,
            action: 'created'
          });
        }
      } catch (error) {
        results.failed.push({
          employeeId: payrollData.employeeId,
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      message: `Processed ${payrolls.length} payrolls: ${results.successful.length} successful, ${results.failed.length} failed`,
      results
    });
  } catch (error) {
    console.error('Error in batch generate payrolls:', error);
    return res.status(500).json({ 
      error: "Failed to process batch payroll generation",
      details: error.message 
    });
  }
});

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