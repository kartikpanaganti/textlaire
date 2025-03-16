import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import apiClient from '../../api/axiosConfig';

const PayrollList = ({ onViewDetails }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/api/payroll');
      setPayrolls(response.data);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      setError(error.response?.data?.message || 'Failed to fetch payrolls. Please try again later.');
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

  const handleMenuClick = (event, payroll) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayroll(payroll);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = async () => {
    try {
      setLoading(true);
      await apiClient.patch(`/api/payroll/${selectedPayroll._id}/status`, {
        paymentStatus: newStatus,
        paymentDate: new Date()
      });
      fetchPayrolls();
      setStatusDialogOpen(false);
      handleMenuClose();
      setSuccessMessage('Payment status updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.response?.data?.message || 'Failed to update payment status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayroll = () => {
    if (typeof onViewDetails === 'function') {
      onViewDetails('calculator');
    }
  };

  const handleViewPayroll = (id) => {
    if (typeof onViewDetails === 'function') {
      onViewDetails(id);
    }
    handleCloseActionMenu();
  };

  const handleEditPayroll = (id) => {
    if (typeof onViewDetails === 'function') {
      onViewDetails(id);
    }
    handleCloseActionMenu();
  };

  const handleDeleteClick = (payroll) => {
    setSelectedPayroll(payroll);
    setDeleteDialogOpen(true);
    handleCloseActionMenu();
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await apiClient.delete(`/api/payroll/${selectedPayroll._id}`);
      setPayrolls(payrolls.filter(p => p._id !== selectedPayroll._id));
      setSuccessMessage('Payroll record deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting payroll:', error);
      setError(error.response?.data?.message || 'Failed to delete payroll record. Please try again.');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedPayroll(null);
    }
  };

  const handleActionMenuClick = (event, payrollId) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayrollId(payrollId);
  };

  const handleCloseActionMenu = () => {
    setAnchorEl(null);
    setSelectedPayrollId(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return theme.palette.success;
      case 'Pending':
        return theme.palette.warning;
      case 'Processed':
        return theme.palette.info;
      default:
        return theme.palette.grey;
    }
  };

  const filteredPayrolls = payrolls
    .filter((payroll) => {
      const matchesSearch = 
        payroll.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payroll.employeeId?.employeeID?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'all' || payroll.paymentStatus === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.payPeriodStart) - new Date(a.payPeriodStart));

  const displayedPayrolls = filteredPayrolls
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Payroll Records</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreatePayroll}
        >
          Create Payroll
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="Search by employee name or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Filter by Status"
                  startAdornment={<FilterListIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Processed">Processed</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Pay Period</TableCell>
                <TableCell align="right">Basic Salary</TableCell>
                <TableCell align="right">Total Earnings</TableCell>
                <TableCell align="right">Net Salary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No payroll records found
                  </TableCell>
                </TableRow>
              ) : (
                displayedPayrolls.map((payroll) => (
                  <TableRow key={payroll._id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {payroll.employeeId?.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ID: {payroll.employeeId?.employeeID}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(payroll.payPeriodStart).toLocaleDateString()} -
                        {new Date(payroll.payPeriodEnd).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      ₹{Number(payroll.basicSalary).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell align="right">
                      ₹{Number(payroll.totalEarnings).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell align="right">
                      ₹{Number(payroll.netSalary).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payroll.paymentStatus}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(payroll.paymentStatus).main,
                          color: getStatusColor(payroll.paymentStatus).contrastText
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleActionMenuClick(e, payroll._id)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPayrolls.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseActionMenu}
      >
        <MenuItem onClick={() => handleViewPayroll(selectedPayrollId)}>
          <VisibilityIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => handleEditPayroll(selectedPayrollId)}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeleteClick(payrolls.find(p => p._id === selectedPayrollId))}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Payment Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="New Status"
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Processed">Processed</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this payroll record? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollList; 