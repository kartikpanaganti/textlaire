import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  useTheme,
  TablePagination,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import PaymentDetails from '../components/payroll/PaymentDetails';
import apiClient from '../api/axiosConfig';

const PaymentsPage = () => {
  const theme = useTheme();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPayrollId, setSelectedPayrollId] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewPayment = (payrollId) => {
    setSelectedPayrollId(payrollId);
    setShowPaymentDialog(true);
  };

  const handlePaymentComplete = () => {
    fetchPayments();
    setShowPaymentDialog(false);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Payments</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Pay Period</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {payment.employeeDetails?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {payment.employeeDetails?.employeeID || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {payment.payPeriod?.start && payment.payPeriod?.end ? (
                          `${new Date(payment.payPeriod.start).toLocaleDateString()} - 
                           ${new Date(payment.payPeriod.end).toLocaleDateString()}`
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        ₹{payment.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>
                        {payment.paymentDate ? 
                          new Date(payment.paymentDate).toLocaleDateString() : 
                          'Not paid'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(payment.status).main,
                            color: getStatusColor(payment.status).contrastText
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleViewPayment(payment.payrollId)}
                          size="small"
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={payments.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <PaymentDetails
          payrollId={selectedPayrollId}
          onPaymentComplete={handlePaymentComplete}
        />
      </Dialog>
    </Box>
  );
};

export default PaymentsPage; 