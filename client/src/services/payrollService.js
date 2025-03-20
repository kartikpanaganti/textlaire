import axios from 'axios';

// Generate payroll for a specific employee
export const generateEmployeePayroll = async (employeeId, month, year, bonusAmount = 0, deductions = 0, deductionReasons = '') => {
  try {
    const response = await axios.post('/api/payroll/generate', {
      employeeId,
      month,
      year,
      bonusAmount,
      deductions,
      deductionReasons
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Generate payroll for all employees
export const generateAllPayrolls = async (month, year) => {
  try {
    const response = await axios.post('/api/payroll/generate-all', {
      month,
      year
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get payroll for a specific employee
export const getEmployeePayroll = async (id, month, year) => {
  try {
    const response = await axios.get(`/api/payroll/employee/${id}/${month}/${year}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all payrolls for a specific month and year
export const getAllPayrolls = async (month, year) => {
  try {
    const response = await axios.get(`/api/payroll/month/${month}/${year}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update payment status
export const updatePaymentStatus = async (id, paymentStatus, paymentDate, paymentMethod, notes) => {
  try {
    const response = await axios.patch(`/api/payroll/${id}/payment-status`, {
      paymentStatus,
      paymentDate,
      paymentMethod,
      notes
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a payroll record
export const deletePayroll = async (id) => {
  try {
    const response = await axios.delete(`/api/payroll/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};