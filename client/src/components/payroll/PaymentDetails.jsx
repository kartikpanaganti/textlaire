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
  useTheme,
  Fade,
  Grow,
  Zoom,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  LocalAtm as LocalAtmIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Done as DoneIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentDetails = ({ payrollId, onPaymentComplete }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [payrollDetails, setPayrollDetails] = useState(null);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    paymentMethod: '',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
    status: 'Pending'
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  // Fetch payroll and payment details
  useEffect(() => {
    if (payrollId) {
      fetchPayrollDetails();
      fetchPaymentDetails();
    }
  }, [payrollId]);

  const fetchPayrollDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/payroll/${payrollId}`);
      setPayrollDetails(response.data);
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      setError('Failed to fetch payroll details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      const response = await apiClient.get(`/api/payments/payroll/${payrollId}`);
      if (response.data) {
        const paymentDetails = response.data;
        setPaymentData(paymentDetails);
        // Update form data with existing payment details
        setFormData({
          paymentMethod: paymentDetails.paymentMethod || '',
          bankName: paymentDetails.bankName || '',
          accountNumber: paymentDetails.accountNumber || '',
          accountHolderName: paymentDetails.accountHolderName || '',
          ifscCode: paymentDetails.ifscCode || '',
          transactionId: paymentDetails.transactionId || '',
          paymentDate: paymentDetails.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          remarks: paymentDetails.remarks || '',
          status: paymentDetails.status || 'Pending'
        });
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      // Initialize with default values if no payment exists
      setFormData(prev => ({
        ...prev,
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'Pending'
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [field]: value
      };

      // Clear bank-related fields when payment method changes
      if (field === 'paymentMethod' && value !== 'Bank Transfer') {
        return {
          ...updatedData,
          bankName: '',
          accountNumber: '',
          accountHolderName: '',
          ifscCode: ''
        };
      }

      return updatedData;
    });
  };

  const handleSavePayment = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      const requiredFields = ['paymentMethod', 'paymentDate'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in the required fields: ${missingFields.join(', ')}`);
        setSaving(false);
        return;
      }

      // Additional validation for bank transfer
      if (formData.paymentMethod === 'Bank Transfer') {
        const bankFields = ['bankName', 'accountNumber', 'accountHolderName', 'ifscCode'];
        const missingBankFields = bankFields.filter(field => !formData[field]);
        
        if (missingBankFields.length > 0) {
          setError(`Please fill in all bank details: ${missingBankFields.join(', ')}`);
          setSaving(false);
          return;
        }
      }

      const payload = {
        ...formData,
        payrollId,
        amount: payrollDetails?.netSalary || 0,
        status: 'Completed',
        employeeDetails: payrollDetails?.employeeId || {},
        payPeriod: {
          start: payrollDetails?.payPeriodStart,
          end: payrollDetails?.payPeriodEnd
        }
      };

      const response = await (paymentData?._id
        ? apiClient.put(`/api/payments/${paymentData._id}`, payload)
        : apiClient.post('/api/payments', payload));

      // Update local state with the response data
      setPaymentData(response.data);
      setFormData(prev => ({
        ...prev,
        ...response.data,
        paymentDate: response.data.paymentDate?.split('T')[0] || prev.paymentDate
      }));
      
      setSuccess('Payment details saved successfully');
      setEditMode(false);

      if (onPaymentComplete) {
        onPaymentComplete(response.data);
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      setError(error.response?.data?.message || 'Failed to save payment details');
    } finally {
      setSaving(false);
    }
  };

  const handleProcessPayment = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Validate required fields
      const requiredFields = ['paymentMethod', 'paymentDate'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in the required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Additional validation for bank transfer
      if (formData.paymentMethod === 'Bank Transfer') {
        const bankFields = ['bankName', 'accountNumber', 'accountHolderName', 'ifscCode'];
        const missingBankFields = bankFields.filter(field => !formData[field]);
        
        if (missingBankFields.length > 0) {
          setError(`Please fill in all bank details: ${missingBankFields.join(', ')}`);
          return;
        }
      }

      const payload = {
        ...formData,
        payrollId,
        amount: payrollDetails?.netSalary || 0,
        status: 'Completed',
        employeeDetails: payrollDetails?.employeeId || {},
        payPeriod: {
          start: payrollDetails?.payPeriodStart,
          end: payrollDetails?.payPeriodEnd
        },
        processedAt: new Date().toISOString()
      };

      const response = await apiClient.post('/api/payments/process', payload);

      // Update local state with the response data
      setPaymentData(response.data);
      setFormData(prev => ({
        ...prev,
        ...response.data,
        paymentDate: response.data.paymentDate?.split('T')[0] || prev.paymentDate,
        status: 'Completed'
      }));
      
      setSuccess('Payment processed successfully');
      setEditMode(false);
      setShowConfirmDialog(false);

      if (onPaymentComplete) {
        onPaymentComplete(response.data);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, minHeight: 400 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon color="primary" />
          Payment Details
        </Typography>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Grid container spacing={3}>
          {/* Payroll Summary Card */}
          <Grid item xs={12}>
            <Grow in timeout={500}>
              <Card 
                elevation={3}
                sx={{
                  background: theme.palette.mode === 'dark' 
                    ? `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.background.paper} 100%)`
                    : `linear-gradient(45deg, ${theme.palette.primary.light} 0%, ${theme.palette.background.paper} 100%)`,
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ReceiptIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">Payroll Summary</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Stack spacing={1}>
                          <Typography color="textSecondary" variant="caption">Employee</Typography>
                          <Typography variant="h6">
                            {payrollDetails?.employeeId?.name || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            ID: {payrollDetails?.employeeId?.employeeID || 'N/A'}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Stack spacing={1}>
                          <Typography color="textSecondary" variant="caption">Pay Period</Typography>
                          <Typography>
                            {new Date(payrollDetails?.payPeriodStart).toLocaleDateString()} -
                            {new Date(payrollDetails?.payPeriodEnd).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Stack spacing={1}>
                          <Typography color="textSecondary" variant="caption">Net Salary</Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(payrollDetails?.netSalary)}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grow>
          </Grid>

          {/* Payment Details Card */}
          <Grid item xs={12}>
            <Grow in timeout={700}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PaymentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                      <Typography variant="h6">Payment Information</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!editMode ? (
                        <>
                          <Tooltip title="Edit Payment Details">
                            <IconButton
                              onClick={() => setEditMode(true)}
                              disabled={saving || processing || paymentData?.status === 'Completed'}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {!paymentData?.status || paymentData?.status === 'Pending' ? (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => setShowConfirmDialog(true)}
                              disabled={processing || !formData.paymentMethod}
                              startIcon={<PaymentIcon />}
                              sx={{ ml: 1 }}
                            >
                              Process Payment
                            </Button>
                          ) : null}
                        </>
                      ) : (
                        <Tooltip title="Save Payment Details">
                          <IconButton
                            onClick={handleSavePayment}
                            disabled={saving || processing}
                            color="primary"
                          >
                            <SaveIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    {/* Payment Method */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth disabled={!editMode || saving}>
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                          value={formData.paymentMethod}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                          label="Payment Method"
                          startAdornment={<LocalAtmIcon sx={{ mr: 1 }} />}
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
                        disabled={!editMode || saving}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: <ScheduleIcon sx={{ mr: 1 }} />
                        }}
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
                            disabled={!editMode || saving}
                            InputProps={{
                              startAdornment: <AccountBalanceIcon sx={{ mr: 1 }} />
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Account Number"
                            value={formData.accountNumber}
                            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                            disabled={!editMode || saving}
                            InputProps={{
                              startAdornment: <InfoIcon sx={{ mr: 1 }} />
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Account Holder Name"
                            value={formData.accountHolderName}
                            onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                            disabled={!editMode || saving}
                            InputProps={{
                              startAdornment: <PersonIcon sx={{ mr: 1 }} />
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="IFSC Code"
                            value={formData.ifscCode}
                            onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                            disabled={!editMode || saving}
                            InputProps={{
                              startAdornment: <InfoIcon sx={{ mr: 1 }} />
                            }}
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
                        disabled={!editMode || saving}
                        InputProps={{
                          startAdornment: <DescriptionIcon sx={{ mr: 1 }} />
                        }}
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
                        disabled={!editMode || saving}
                      />
                    </Grid>

                    {/* Payment Status */}
                    {paymentData && (
                      <Grid item xs={12}>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Payment Status</Typography>
                          <Chip
                            icon={paymentData.status === 'Completed' ? <CheckCircleIcon /> : <ErrorIcon />}
                            label={paymentData.status}
                            sx={{
                              backgroundColor: getStatusColor(paymentData.status).main,
                              color: getStatusColor(paymentData.status).contrastText,
                              pl: 1
                            }}
                          />
                        </Box>
                      </Grid>
                    )}
                  </Grid>

                  {(saving || processing) && (
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <LinearProgress />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        </Grid>

        {/* Confirmation Dialog */}
        <Dialog
          open={showConfirmDialog}
          onClose={() => !processing && setShowConfirmDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" />
            Confirm Payment Processing
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Please confirm the following payment details:
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">
                    Payment Method
                  </Typography>
                  <Typography variant="body1">
                    {formData.paymentMethod}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">
                    Amount
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(payrollDetails?.netSalary)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">
                    Payment Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(formData.paymentDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                {formData.paymentMethod === 'Bank Transfer' && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Bank Details:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="textSecondary" variant="body2">
                        Bank Name
                      </Typography>
                      <Typography variant="body1">
                        {formData.bankName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="textSecondary" variant="body2">
                        Account Number
                      </Typography>
                      <Typography variant="body1">
                        {formData.accountNumber}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => setShowConfirmDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleProcessPayment}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={20} /> : <DoneIcon />}
            >
              {processing ? 'Processing...' : 'Confirm & Process'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
  );
};

export default PaymentDetails; 