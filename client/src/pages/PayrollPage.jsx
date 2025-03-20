import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  MonetizationOn as MonetizationOnIcon,
  GetApp as GetAppIcon,
  FilterList as FilterListIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const PayrollPage = () => {
  // State variables
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Current month
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Current year
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [deductionReasons, setDeductionReasons] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch payrolls when month or year changes
  useEffect(() => {
    fetchPayrolls();
  }, [selectedMonth, selectedYear]);

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showSnackbar('Failed to fetch employees', 'error');
    }
  };

  // Fetch payrolls for selected month and year
  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/payroll/month/${selectedMonth}/${selectedYear}`);
      setPayrolls(response.data);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      showSnackbar('Failed to fetch payrolls', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate payroll for a specific employee
  const generatePayroll = async () => {
    if (!selectedEmployee) {
      showSnackbar('Please select an employee', 'error');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post('/api/payroll/generate', {
        employeeId: selectedEmployee,
        month: selectedMonth,
        year: selectedYear,
        bonusAmount: Number(bonusAmount),
        deductions: Number(deductions),
        deductionReasons
      });

      showSnackbar('Payroll generated successfully', 'success');
      fetchPayrolls();
      handleCloseGenerateDialog();
    } catch (error) {
      console.error('Error generating payroll:', error);
      showSnackbar(error.response?.data?.error || 'Failed to generate payroll', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Generate payroll for all employees
  const generateAllPayrolls = async () => {
    setGenerating(true);
    try {
      const response = await axios.post('/api/payroll/generate-all', {
        month: selectedMonth,
        year: selectedYear
      });

      const { results, errors } = response.data;
      showSnackbar(`Generated ${results.length} payrolls with ${errors.length} errors`, 'success');
      fetchPayrolls();
    } catch (error) {
      console.error('Error generating all payrolls:', error);
      showSnackbar('Failed to generate payrolls', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Update payment status
  const updatePaymentStatus = async () => {
    if (!selectedPayroll) return;

    try {
      const response = await axios.patch(`/api/payroll/${selectedPayroll._id}/payment-status`, {
        paymentStatus: 'Paid',
        paymentDate: new Date(),
        paymentMethod,
        notes: `Paid via ${paymentMethod}`
      });

      showSnackbar('Payment status updated successfully', 'success');
      fetchPayrolls();
      handleClosePaymentDialog();
    } catch (error) {
      console.error('Error updating payment status:', error);
      showSnackbar('Failed to update payment status', 'error');
    }
  };

  // Delete payroll
  const deletePayroll = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payroll record?')) {
      return;
    }

    try {
      await axios.delete(`/api/payroll/${id}`);
      showSnackbar('Payroll deleted successfully', 'success');
      fetchPayrolls();
    } catch (error) {
      console.error('Error deleting payroll:', error);
      showSnackbar('Failed to delete payroll', 'error');
    }
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Handle generate dialog open
  const handleOpenGenerateDialog = () => {
    setSelectedEmployee('');
    setBonusAmount(0);
    setDeductions(0);
    setDeductionReasons('');
    setOpenGenerateDialog(true);
  };

  // Handle generate dialog close
  const handleCloseGenerateDialog = () => {
    setOpenGenerateDialog(false);
  };

  // Handle payment dialog open
  const handleOpenPaymentDialog = (payroll) => {
    setSelectedPayroll(payroll);
    setPaymentMethod('Bank Transfer');
    setOpenPaymentDialog(true);
  };

  // Handle payment dialog close
  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
  };

  // Handle details dialog open
  const handleOpenDetailsDialog = (payroll) => {
    setSelectedPayroll(payroll);
    setOpenDetailsDialog(true);
  };

  // Handle details dialog close
  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
  };

  // Return JSX
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" gutterBottom component="div">
              Payroll Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage employee payrolls and payment records
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenGenerateDialog}
              sx={{ mr: 2 }}
            >
              Generate Payroll
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={generateAllPayrolls}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate All'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <MenuItem value={1}>January</MenuItem>
                <MenuItem value={2}>February</MenuItem>
                <MenuItem value={3}>March</MenuItem>
                <MenuItem value={4}>April</MenuItem>
                <MenuItem value={5}>May</MenuItem>
                <MenuItem value={6}>June</MenuItem>
                <MenuItem value={7}>July</MenuItem>
                <MenuItem value={8}>August</MenuItem>
                <MenuItem value={9}>September</MenuItem>
                <MenuItem value={10}>October</MenuItem>
                <MenuItem value={11}>November</MenuItem>
                <MenuItem value={12}>December</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<FilterListIcon />}
              onClick={fetchPayrolls}
            >
              Filter
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" align="right">
              Total Records: {payrolls.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Base Salary</TableCell>
                <TableCell>Working Days</TableCell>
                <TableCell>Present Days</TableCell>
                <TableCell>Net Salary</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payrolls.length > 0 ? (
                payrolls.map((payroll) => (
                  <TableRow key={payroll._id}>
                    <TableCell>{payroll.employeeId?.employeeID || 'N/A'}</TableCell>
                    <TableCell>{payroll.employeeId?.name || 'N/A'}</TableCell>
                    <TableCell>{payroll.employeeId?.department || 'N/A'}</TableCell>
                    <TableCell>${payroll.baseSalary.toFixed(2)}</TableCell>
                    <TableCell>{payroll.workingDays}</TableCell>
                    <TableCell>{payroll.presentDays}</TableCell>
                    <TableCell>${payroll.netSalary.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={payroll.paymentStatus}
                        color={
                          payroll.paymentStatus === 'Paid'
                            ? 'success'
                            : payroll.paymentStatus === 'Pending'
                            ? 'warning'
                            : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDetailsDialog(payroll)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {payroll.paymentStatus === 'Pending' && (
                        <Tooltip title="Mark as Paid">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleOpenPaymentDialog(payroll)}
                          >
                            <MonetizationOnIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deletePayroll(payroll._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No payroll records found for this month
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Generate Payroll Dialog */}
      <Dialog open={openGenerateDialog} onClose={handleCloseGenerateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Payroll</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Select Employee"
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee._id} value={employee._id}>
                      {employee.name} - {employee.employeeID}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bonus Amount"
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                InputProps={{
                  startAdornment: '$'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deductions"
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                InputProps={{
                  startAdornment: '$'
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Deduction Reasons"
                multiline
                rows={2}
                value={deductionReasons}
                onChange={(e) => setDeductionReasons(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGenerateDialog}>Cancel</Button>
          <Button
            onClick={generatePayroll}
            variant="contained"
            color="primary"
            disabled={generating || !selectedEmployee}
          >
            {generating ? <CircularProgress size={24} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Mark as Paid</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Employee:</strong>{' '}
                {selectedPayroll?.employeeId?.name || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Amount:</strong> ${selectedPayroll?.netSalary.toFixed(2) || '0.00'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Check">Check</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button onClick={updatePaymentStatus} variant="contained" color="success">
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payroll Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Payroll Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDetailsDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedPayroll && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Employee Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Name:</strong> {selectedPayroll.employeeId?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>ID:</strong> {selectedPayroll.employeeId?.employeeID || 'N/A'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Department:</strong> {selectedPayroll.employeeId?.department || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Position:</strong> {selectedPayroll.employeeId?.position || 'N/A'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Base Salary:</strong> ${selectedPayroll.baseSalary.toFixed(2)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Period:</strong>{' '}
                      {new Date(0, selectedPayroll.month - 1).toLocaleString('default', { month: 'long' })}{' '}
                      {selectedPayroll.year}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Attendance Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h5" align="center">
                          {selectedPayroll.workingDays}
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                          Working Days
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h5" align="center">
                          {selectedPayroll.presentDays}
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                          Present Days
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h5" align="center">
                          {selectedPayroll.absentDays}
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                          Absent Days
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h5" align="center">
                          {selectedPayroll.lateDays}
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                          Late Days
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Salary Calculation
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Base Salary</TableCell>
                        <TableCell align="right">${selectedPayroll.baseSalary.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Overtime Hours</TableCell>
                        <TableCell align="right">{selectedPayroll.overtimeHours} hours</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Overtime Rate</TableCell>
                        <TableCell align="right">${selectedPayroll.overtimeRate.toFixed(2)}/hour</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Overtime Amount</TableCell>
                        <TableCell align="right">
                          ${(selectedPayroll.overtimeHours * selectedPayroll.overtimeRate).toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Bonus Amount</TableCell>
                        <TableCell align="right">${selectedPayroll.bonusAmount.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Deductions</TableCell>
                        <TableCell align="right">${selectedPayroll.deductions.toFixed(2)}</TableCell>
                      </TableRow>
                      {selectedPayroll.deductionReasons && (
                        <TableRow>
                          <TableCell>Deduction Reasons</TableCell>
                          <TableCell align="right">{selectedPayroll.deductionReasons}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell>Tax Amount</TableCell>
                        <TableCell align="right">${selectedPayroll.taxAmount.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Net Salary</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          ${selectedPayroll.netSalary.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Payment Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Status:</strong>{' '}
                      <Chip
                        label={selectedPayroll.paymentStatus}
                        color={
                          selectedPayroll.paymentStatus === 'Paid'
                            ? 'success'
                            : selectedPayroll.paymentStatus === 'Pending'
                            ? 'warning'
                            : 'error'
                        }
                        size="small"
                      />
                    </Typography>
                    <Typography variant="body1">
                      <strong>Method:</strong> {selectedPayroll.paymentMethod || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Payment Date:</strong>{' '}
                      {selectedPayroll.paymentDate
                        ? format(new Date(selectedPayroll.paymentDate), 'PPP')
                        : 'Not paid yet'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Notes:</strong> {selectedPayroll.notes || 'No notes'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<PrintIcon />}
            variant="outlined"
            onClick={() => window.print()}
          >
            Print
          </Button>
          {selectedPayroll && selectedPayroll.paymentStatus === 'Pending' && (
            <Button
              startIcon={<MonetizationOnIcon />}
              variant="contained"
              color="success"
              onClick={() => {
                handleCloseDetailsDialog();
                handleOpenPaymentDialog(selectedPayroll);
              }}
            >
              Mark as Paid
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PayrollPage;