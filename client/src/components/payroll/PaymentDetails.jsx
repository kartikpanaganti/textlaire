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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const PaymentDetails = ({ payrollId, onPaymentComplete }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [payrollDetails, setPayrollDetails] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    paymentMethod: '',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // Fetch payroll and payment details
  useEffect(() => {
    if (payrollId) {
      fetchPayrollDetails();
      fetchPaymentDetails();
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

  const fetchPaymentDetails = async () => {
    try {
      const response = await apiClient.get(`/api/payments/payroll/${payrollId}`);
      if (response.data) {
        setPaymentData(response.data);
        setFormData({
          ...response.data,
          paymentDate: response.data.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      // Don't set error as payment might not exist yet
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        payrollId,
        amount: payrollDetails?.netSalary || 0,
        status: 'Completed'
      };

      const response = await (paymentData?._id
        ? apiClient.put(`/api/payments/${paymentData._id}`, payload)
        : apiClient.post('/api/payments', payload));

      setPaymentData(response.data);
      setSuccess('Payment details saved successfully');
      setEditMode(false);

      if (onPaymentComplete) {
        onPaymentComplete(response.data);
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      setError(error.response?.data?.message || 'Failed to save payment details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return theme.palette.success;
      case 'Pending':
        return theme.palette.warning;
      case 'Failed':
        return theme.palette.error;
      default:
        return theme.palette.grey;
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
        Payment Details
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

        {/* Payment Details Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PaymentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6">Payment Information</Typography>
                </Box>
                {!editMode ? (
                  <Button
                    startIcon={<EditIcon />}
                    variant="contained"
                    onClick={() => setEditMode(true)}
                    disabled={loading}
                  >
                    Edit Payment
                  </Button>
                ) : (
                  <Button
                    startIcon={<SaveIcon />}
                    variant="contained"
                    onClick={handleSavePayment}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Payment'}
                  </Button>
                )}
              </Box>

              <Grid container spacing={3}>
                {/* Payment Method */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!editMode}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={formData.paymentMethod}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
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
                    disabled={!editMode}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Bank Details Section */}
                {formData.paymentMethod === 'Bank Transfer' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Bank Name"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Account Number"
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Account Holder Name"
                        value={formData.accountHolderName}
                        onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="IFSC Code"
                        value={formData.ifscCode}
                        onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                        disabled={!editMode}
                      />
                    </Grid>
                  </>
                )}

                {/* Transaction Details */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Transaction ID"
                    value={formData.transactionId}
                    onChange={(e) => handleInputChange('transactionId', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>

                {/* Remarks */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    multiline
                    rows={2}
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>

                {/* Payment Status */}
                {paymentData && (
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Payment Status</Typography>
                      <Chip
                        label={paymentData.status}
                        sx={{
                          backgroundColor: getStatusColor(paymentData.status).main,
                          color: getStatusColor(paymentData.status).contrastText
                        }}
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentDetails; 