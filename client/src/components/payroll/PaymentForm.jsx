import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import apiClient from '../../api/axiosConfig';

const generateTransactionId = (paymentMethod) => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const prefix = {
    'Bank Transfer': 'BNK',
    'Cheque': 'CHQ',
    'UPI': 'UPI'
  }[paymentMethod] || '';
  
  return prefix ? `${prefix}${timestamp}${random}` : '';
};

const PaymentForm = ({ payrollId, onPaymentComplete }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [payrollDetails, setPayrollDetails] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    paymentMethod: '',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    chequeNumber: '',
    chequeDate: new Date().toISOString().split('T')[0],
    upiId: '',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
    status: 'Pending'
  });

  useEffect(() => {
    if (payrollId) {
      fetchPayrollDetails();
    }
  }, [payrollId]);

  const fetchPayrollDetails = async () => {
    try {
      const response = await apiClient.get(`/api/payroll/${payrollId}`);
      setPayrollDetails(response.data);
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      setError('Failed to fetch payroll details');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentMethodChange = (method) => {
    const transactionId = generateTransactionId(method);
    setFormData(prev => ({
      ...prev,
      paymentMethod: method,
      transactionId: method === 'Cash' ? '' : transactionId,
      // Reset method-specific fields
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      ifscCode: '',
      chequeNumber: '',
      chequeDate: new Date().toISOString().split('T')[0],
      upiId: ''
    }));
  };

  const validateForm = () => {
    if (!formData.paymentMethod) {
      setError('Please select a payment method');
      return false;
    }

    if (!formData.paymentDate) {
      setError('Please select a payment date');
      return false;
    }

    switch (formData.paymentMethod) {
      case 'Bank Transfer':
        if (!formData.bankName || !formData.accountNumber || !formData.accountHolderName || !formData.ifscCode) {
          setError('Please fill in all bank details');
          return false;
        }
        break;
      case 'Cheque':
        if (!formData.chequeNumber || !formData.chequeDate || !formData.bankName) {
          setError('Please fill in all cheque details');
          return false;
        }
        break;
      case 'UPI':
        if (!formData.upiId) {
          setError('Please enter UPI ID');
          return false;
        }
        break;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Update payroll with payment details
      const payrollUpdate = {
        paymentMethod: formData.paymentMethod,
        paymentStatus: 'Paid',
        paymentDate: formData.paymentDate,
        bankDetails: formData.paymentMethod === 'Bank Transfer' ? {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountHolderName: formData.accountHolderName,
          ifscCode: formData.ifscCode
        } : null,
        transactionId: formData.transactionId,
        remarks: formData.remarks
      };

      await apiClient.put(`/api/payroll/${payrollId}/payment`, payrollUpdate);
      
      setSuccess('Payment processed successfully');

      if (onPaymentComplete) {
        onPaymentComplete(payrollUpdate);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  if (!payrollDetails) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Process Payment
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Payroll Summary Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6">Payroll Summary</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography color="textSecondary">Employee</Typography>
                  <Typography variant="h6">
                    {payrollDetails.employeeId?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    ID: {payrollDetails.employeeId?.employeeID || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography color="textSecondary">Pay Period</Typography>
                  <Typography>
                    {new Date(payrollDetails.payPeriodStart).toLocaleDateString()} -
                    {new Date(payrollDetails.payPeriodEnd).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography color="textSecondary">Net Salary</Typography>
                  <Typography variant="h6">
                    ₹{payrollDetails.netSalary?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Form Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PaymentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6">Payment Information</Typography>
              </Box>

              <Grid container spacing={3}>
                {/* Payment Method */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={formData.paymentMethod}
                      onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      label="Payment Method"
                    >
                      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Payment Date */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Payment Date"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Bank Transfer Fields */}
                {formData.paymentMethod === 'Bank Transfer' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Bank Name"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Account Number"
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Account Holder Name"
                        value={formData.accountHolderName}
                        onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="IFSC Code"
                        value={formData.ifscCode}
                        onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                        required
                      />
                    </Grid>
                  </>
                )}

                {/* Cheque Fields */}
                {formData.paymentMethod === 'Cheque' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Bank Name"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Cheque Number"
                        value={formData.chequeNumber}
                        onChange={(e) => handleInputChange('chequeNumber', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Cheque Date"
                        type="date"
                        value={formData.chequeDate}
                        onChange={(e) => handleInputChange('chequeDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                  </>
                )}

                {/* UPI Fields */}
                {formData.paymentMethod === 'UPI' && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="UPI ID"
                      value={formData.upiId}
                      onChange={(e) => handleInputChange('upiId', e.target.value)}
                      required
                      placeholder="example@upi"
                    />
                  </Grid>
                )}

                {/* Transaction ID - Auto-generated and read-only except for Cash */}
                {formData.paymentMethod && formData.paymentMethod !== 'Cash' && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Transaction ID"
                      value={formData.transactionId}
                      InputProps={{ readOnly: true }}
                      helperText="Auto-generated transaction ID"
                    />
                  </Grid>
                )}

                {/* Remarks */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    multiline
                    rows={2}
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                  />
                </Grid>
              </Grid>

              {/* Submit Button */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={<SaveIcon />}
                >
                  {loading ? 'Processing...' : 'Process Payment'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentForm; 