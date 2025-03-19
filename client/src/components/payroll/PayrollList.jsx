import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Typography,
  useTheme,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import apiClient from '../../lib/api';

const PayrollList = ({ onViewDetails }) => {
  const theme = useTheme();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('payPeriodStart');
  const [order, setOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedPayrollForMenu, setSelectedPayrollForMenu] = useState(null);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/payroll');
      setPayrolls(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      setError(error.response?.data?.message || 'Failed to fetch payrolls');
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

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    handleFilterClose();
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleMenuClick = (event, payroll) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedPayrollForMenu(payroll);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPayrollForMenu(null);
  };

  const handleDeleteClick = (payroll) => {
    setSelectedPayroll(payroll);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await apiClient.delete(`/api/payroll/${selectedPayroll._id}`);
      setPayrolls(payrolls.filter(p => p._id !== selectedPayroll._id));
      setDeleteDialogOpen(false);
      setSelectedPayroll(null);
    } catch (error) {
      console.error('Error deleting payroll:', error);
      setError(error.response?.data?.message || 'Failed to delete payroll');
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredPayrolls = payrolls
    .filter(payroll => {
      // Apply search filter
      const searchMatch = searchTerm === '' || 
        payroll.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payroll.employeeId?.employeeID?.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply status filter
      const statusMatch = filters.status === 'all' || payroll.paymentStatus === filters.status;

      // Apply date range filter
      let dateMatch = true;
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const payrollDate = new Date(payroll.payPeriodStart);
        const diffTime = Math.abs(now - payrollDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (filters.dateRange) {
          case 'today':
            dateMatch = diffDays === 0;
            break;
          case 'week':
            dateMatch = diffDays <= 7;
            break;
          case 'month':
            dateMatch = diffDays <= 30;
            break;
          case 'year':
            dateMatch = diffDays <= 365;
            break;
        }
      }

      return searchMatch && statusMatch && dateMatch;
    })
    .sort((a, b) => {
      const isAsc = order === 'asc';
      if (orderBy === 'employeeName') {
        return isAsc
          ? a.employeeId?.name.localeCompare(b.employeeId?.name)
          : b.employeeId?.name.localeCompare(a.employeeId?.name);
      }
      if (orderBy === 'amount') {
        return isAsc
          ? a.netSalary - b.netSalary
          : b.netSalary - a.netSalary;
      }
      return isAsc
        ? new Date(a[orderBy]) - new Date(b[orderBy])
        : new Date(b[orderBy]) - new Date(a[orderBy]);
    });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Payroll Records</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button
            startIcon={<FilterIcon />}
            onClick={handleFilterClick}
            variant="outlined"
          >
            Filters
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'employeeName'}
                  direction={orderBy === 'employeeName' ? order : 'asc'}
                  onClick={() => handleSort('employeeName')}
                >
                  Employee
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'payPeriodStart'}
                  direction={orderBy === 'payPeriodStart' ? order : 'asc'}
                  onClick={() => handleSort('payPeriodStart')}
                >
                  Pay Period
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'amount'}
                  direction={orderBy === 'amount' ? order : 'asc'}
                  onClick={() => handleSort('amount')}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayrolls
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((payroll) => (
                <TableRow key={payroll._id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body1">
                        {payroll.employeeId?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payroll.employeeId?.employeeID}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {formatDate(payroll.payPeriodStart)} - {formatDate(payroll.payPeriodEnd)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {formatCurrency(payroll.netSalary)}
                    </Typography>
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
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => onViewDetails(payroll._id)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, payroll)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredPayrolls.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={() => handleFilterChange('status', 'all')}>
          All Statuses
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('status', 'Pending')}>
          Pending
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('status', 'Processed')}>
          Processed
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('status', 'Paid')}>
          Paid
        </MenuItem>
        <MenuItem divider />
        <MenuItem onClick={() => handleFilterChange('dateRange', 'all')}>
          All Time
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('dateRange', 'today')}>
          Today
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('dateRange', 'week')}>
          This Week
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('dateRange', 'month')}>
          This Month
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('dateRange', 'year')}>
          This Year
        </MenuItem>
      </Menu>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          onViewDetails(selectedPayrollForMenu?._id);
        }}>
          <VisibilityIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          handleDeleteClick(selectedPayrollForMenu);
        }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this payroll record? This action cannot be undone.
          </Typography>
          {selectedPayroll?.paymentStatus === 'Paid' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Warning: This payroll has already been marked as paid.
            </Alert>
          )}
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