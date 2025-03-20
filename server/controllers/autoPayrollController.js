import autoPayrollService from '../services/autoPayrollService.js';

// Get auto generation status
export const getStatus = async (req, res) => {
  try {
    const status = autoPayrollService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting auto generation status:', error);
    res.status(500).json({ message: 'Error getting auto generation status' });
  }
};

// Enable/disable auto generation
export const setEnabled = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Enabled must be a boolean value' });
    }

    autoPayrollService.setEnabled(enabled);
    res.json({ message: `Auto generation ${enabled ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    console.error('Error setting auto generation status:', error);
    res.status(500).json({ message: 'Error setting auto generation status' });
  }
};

// Manually trigger payroll generation
export const generatePayrolls = async (req, res) => {
  try {
    const success = await autoPayrollService.generateMonthlyPayrolls();
    if (success) {
      res.json({ message: 'Payrolls generated successfully' });
    } else {
      res.status(500).json({ message: 'Error generating payrolls' });
    }
  } catch (error) {
    console.error('Error generating payrolls:', error);
    res.status(500).json({ message: 'Error generating payrolls' });
  }
}; 