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
  Tooltip,
  useTheme,
  alpha,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  Collapse,
  Fade,
  Zoom,
  FormControlLabel,
  Switch
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
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Autorenew as AutorenewIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// Add axios base URL configuration
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PayrollPage = () => {
  const theme = useTheme();
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

  // Add new state for statistics
  const [statistics, setStatistics] = useState({
    totalPayroll: 0,
    averageSalary: 0,
    pendingPayments: 0,
    paidPayments: 0
  });

  // Add new state for edit dialog
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);

  // Add new state variables after existing ones
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('employeeId.name');
  const [order, setOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    paymentStatus: '',
    salaryRange: { min: '', max: '' }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  // Add new state for auto generation status
  const [autoGenerationStatus, setAutoGenerationStatus] = useState({
    isEnabled: false,
    lastGenerated: null
  });

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch payrolls when month or year changes
  useEffect(() => {
    fetchPayrolls();
  }, [selectedMonth, selectedYear]);

  // Calculate statistics when payrolls change
  useEffect(() => {
    if (payrolls.length > 0) {
      const total = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
      const pending = payrolls.filter(p => p.paymentStatus === 'Pending').length;
      const paid = payrolls.filter(p => p.paymentStatus === 'Paid').length;
      
      setStatistics({
        totalPayroll: total,
        averageSalary: total / payrolls.length,
        pendingPayments: pending,
        paidPayments: paid
      });
    }
  }, [payrolls]);

  // Add useEffect to check auto generation status
  useEffect(() => {
    const fetchAutoGenerationStatus = async () => {
      try {
        const response = await axios.get('/api/payroll/auto/status');
        setAutoGenerationStatus(response.data);
      } catch (error) {
        console.error('Error fetching auto generation status:', error);
      }
    };

    fetchAutoGenerationStatus();
  }, []);

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

  // Add new function to handle payroll update
  const updatePayroll = async () => {
    if (!editingPayroll) return;

    try {
      const response = await axios.patch(`/api/payroll/${editingPayroll._id}`, {
        bonusAmount: Number(editingPayroll.bonusAmount),
        deductions: Number(editingPayroll.deductions),
        deductionReasons: editingPayroll.deductionReasons,
        overtimeHours: Number(editingPayroll.overtimeHours),
        overtimeRate: Number(editingPayroll.overtimeRate)
      });

      showSnackbar('Payroll updated successfully', 'success');
      fetchPayrolls();
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating payroll:', error);
      showSnackbar('Failed to update payroll', 'error');
    }
  };

  // Add handlers for edit dialog
  const handleOpenEditDialog = (payroll) => {
    setEditingPayroll({ ...payroll });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingPayroll(null);
  };

  // Add new functions for table functionality
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      department: '',
      paymentStatus: '',
      salaryRange: { min: '', max: '' }
    });
    setPage(0);
  };

  const handleRowClick = (payrollId) => {
    setExpandedRow(expandedRow === payrollId ? null : payrollId);
  };

  // Add sorting function
  const sortPayrolls = (payrolls) => {
    return [...payrolls].sort((a, b) => {
      let aValue = a;
      let bValue = b;
      
      // Handle nested properties
      if (orderBy.includes('.')) {
        const properties = orderBy.split('.');
        aValue = properties.reduce((obj, key) => obj?.[key], a);
        bValue = properties.reduce((obj, key) => obj?.[key], b);
      }

      if (bValue < aValue) {
        return order === 'desc' ? -1 : 1;
      }
      if (bValue > aValue) {
        return order === 'desc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Add filtering function
  const filterPayrolls = (payrolls) => {
    return payrolls.filter(payroll => {
      // Search term filter
      const searchMatch = searchTerm === '' || 
        payroll.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payroll.employeeId?.employeeID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payroll.employeeId?.department?.toLowerCase().includes(searchTerm.toLowerCase());

      // Department filter
      const departmentMatch = filters.department === '' || 
        payroll.employeeId?.department === filters.department;

      // Payment status filter
      const statusMatch = filters.paymentStatus === '' || 
        payroll.paymentStatus === filters.paymentStatus;

      // Salary range filter
      const salaryMatch = (!filters.salaryRange.min || payroll.netSalary >= Number(filters.salaryRange.min)) &&
        (!filters.salaryRange.max || payroll.netSalary <= Number(filters.salaryRange.max));

      return searchMatch && departmentMatch && statusMatch && salaryMatch;
    });
  };

  // Add handler for toggling auto generation
  const handleToggleAutoGeneration = async () => {
    try {
      await axios.post('/api/payroll/auto/toggle', {
        enabled: !autoGenerationStatus.isEnabled
      });
      setAutoGenerationStatus(prev => ({
        ...prev,
        isEnabled: !prev.isEnabled
      }));
      setSnackbar({
        open: true,
        message: `Auto generation ${!autoGenerationStatus.isEnabled ? 'enabled' : 'disabled'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error toggling auto generation:', error);
      setSnackbar({
        open: true,
        message: 'Error toggling auto generation',
        severity: 'error'
      });
    }
  };

  // Return JSX
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.dark, 0.2)})`
                : `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.2)}, ${alpha(theme.palette.primary.main, 0.2)})`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6" color="text.primary">
                  Total Payroll
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                ₹{statistics.totalPayroll.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${alpha(theme.palette.success.main, 0.2)}, ${alpha(theme.palette.success.dark, 0.2)})`
                : `linear-gradient(45deg, ${alpha(theme.palette.success.light, 0.2)}, ${alpha(theme.palette.success.main, 0.2)})`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                <Typography variant="h6" color="text.primary">
                  Average Salary
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                ₹{statistics.averageSalary.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${alpha(theme.palette.warning.main, 0.2)}, ${alpha(theme.palette.warning.dark, 0.2)})`
                : `linear-gradient(45deg, ${alpha(theme.palette.warning.light, 0.2)}, ${alpha(theme.palette.warning.main, 0.2)})`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MonetizationOnIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                <Typography variant="h6" color="text.primary">
                  Pending Payments
                </Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {statistics.pendingPayments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${alpha(theme.palette.info.main, 0.2)}, ${alpha(theme.palette.info.dark, 0.2)})`
                : `linear-gradient(45deg, ${alpha(theme.palette.info.light, 0.2)}, ${alpha(theme.palette.info.main, 0.2)})`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                <Typography variant="h6" color="text.primary">
                  Paid Payments
                </Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {statistics.paidPayments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Header Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.9)})`
            : `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
          backdropFilter: 'blur(10px)'
        }}
      >
        <Grid container spacing={3} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography 
              variant="h4" 
              gutterBottom 
              component="div"
              sx={{
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`
                  : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                backgroundClip: 'text',
                textFillColor: 'transparent',
                fontWeight: 'bold'
              }}
            >
              Payroll Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage employee payrolls and payment records
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoGenerationStatus.isEnabled}
                    onChange={handleToggleAutoGeneration}
                    color="primary"
                  />
                }
                label="Auto Generation"
              />
              <Chip
                label={`Last Generated: ${autoGenerationStatus.lastGenerated ? format(new Date(autoGenerationStatus.lastGenerated), 'MMM dd, yyyy HH:mm') : 'Never'}`}
                color={autoGenerationStatus.isEnabled ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filter Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.9)})`
            : `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
          backdropFilter: 'blur(10px)'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => setSelectedMonth(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  }
                }}
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
              sx={{
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              Filter
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography 
              variant="h6" 
              align="right"
              sx={{
                color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
              }}
            >
              Total Records: {payrolls.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Payroll Table */}
      <TableContainer 
        component={Paper} 
        elevation={3}
        sx={{
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.9)})`
            : `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Search and Filter Bar */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 200 }}
          />
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "contained" : "outlined"}
            color="primary"
          >
            Filters
          </Button>
        </Box>

        {/* Filter Panel */}
        <Collapse in={showFilters}>
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filters.department}
                    label="Department"
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {[...new Set(payrolls.map(p => p.employeeId?.department))].map(dept => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={filters.paymentStatus}
                    label="Payment Status"
                    onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                    <MenuItem value="Failed">Failed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    label="Min Salary"
                    type="number"
                    value={filters.salaryRange.min}
                    onChange={(e) => handleFilterChange('salaryRange', { ...filters.salaryRange, min: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                  />
                  <TextField
                    size="small"
                    label="Max Salary"
                    type="number"
                    value={filters.salaryRange.max}
                    onChange={(e) => handleFilterChange('salaryRange', { ...filters.salaryRange, max: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Button
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  variant="outlined"
                  color="error"
                  size="small"
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <IconButton size="small" onClick={() => setExpandedRow(null)}>
                  {expandedRow ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'employeeId.employeeID'}
                  direction={orderBy === 'employeeId.employeeID' ? order : 'asc'}
                  onClick={() => handleRequestSort('employeeId.employeeID')}
                >
                  Employee ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'employeeId.name'}
                  direction={orderBy === 'employeeId.name' ? order : 'asc'}
                  onClick={() => handleRequestSort('employeeId.name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'employeeId.department'}
                  direction={orderBy === 'employeeId.department' ? order : 'asc'}
                  onClick={() => handleRequestSort('employeeId.department')}
                >
                  Department
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'baseSalary'}
                  direction={orderBy === 'baseSalary' ? order : 'asc'}
                  onClick={() => handleRequestSort('baseSalary')}
                >
                  Base Salary
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'workingDays'}
                  direction={orderBy === 'workingDays' ? order : 'asc'}
                  onClick={() => handleRequestSort('workingDays')}
                >
                  Working Days
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'presentDays'}
                  direction={orderBy === 'presentDays' ? order : 'asc'}
                  onClick={() => handleRequestSort('presentDays')}
                >
                  Present Days
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'netSalary'}
                  direction={orderBy === 'netSalary' ? order : 'asc'}
                  onClick={() => handleRequestSort('netSalary')}
                >
                  Net Salary
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'paymentStatus'}
                  direction={orderBy === 'paymentStatus' ? order : 'asc'}
                  onClick={() => handleRequestSort('paymentStatus')}
                >
                  Payment Status
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              sortPayrolls(filterPayrolls(payrolls))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((payroll) => (
                  <React.Fragment key={payroll._id}>
                    <TableRow 
                      hover
                      onClick={() => handleRowClick(payroll._id)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.primary.light, 0.1)
                        }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <IconButton size="small">
                          {expandedRow === payroll._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{payroll.employeeId?.employeeID || 'N/A'}</TableCell>
                      <TableCell>{payroll.employeeId?.name || 'N/A'}</TableCell>
                      <TableCell>{payroll.employeeId?.department || 'N/A'}</TableCell>
                      <TableCell align="right">₹{payroll.baseSalary.toFixed(2)}</TableCell>
                      <TableCell align="right">{payroll.workingDays}</TableCell>
                      <TableCell align="right">{payroll.presentDays}</TableCell>
                      <TableCell align="right">₹{payroll.netSalary.toFixed(2)}</TableCell>
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
                          sx={{
                            fontWeight: 'bold',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetailsDialog(payroll);
                              }}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                }
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Payroll">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDialog(payroll);
                              }}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.info.main, 0.1)
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {payroll.paymentStatus === 'Pending' && (
                            <Tooltip title="Mark as Paid">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPaymentDialog(payroll);
                                }}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.success.main, 0.1)
                                  }
                                }}
                              >
                                <MonetizationOnIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePayroll(payroll._id);
                              }}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.1)
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={11}>
                        <Collapse in={expandedRow === payroll._id} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Salary Breakdown
                                </Typography>
                                <Table size="small">
                                  <TableBody>
                                    <TableRow>
                                      <TableCell>Base Salary</TableCell>
                                      <TableCell align="right">₹{payroll.baseSalary.toFixed(2)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Overtime Amount</TableCell>
                                      <TableCell align="right">
                                        ₹{(payroll.overtimeHours * payroll.overtimeRate).toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Bonus Amount</TableCell>
                                      <TableCell align="right">₹{payroll.bonusAmount.toFixed(2)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Deductions</TableCell>
                                      <TableCell align="right">₹{payroll.deductions.toFixed(2)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Tax Amount</TableCell>
                                      <TableCell align="right">₹{payroll.taxAmount.toFixed(2)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Net Salary</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        ₹{payroll.netSalary.toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Payment Details
                                </Typography>
                                <Table size="small">
                                  <TableBody>
                                    <TableRow>
                                      <TableCell>Status</TableCell>
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
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Payment Date</TableCell>
                                      <TableCell>
                                        {payroll.paymentDate
                                          ? format(new Date(payroll.paymentDate), 'PPP')
                                          : 'Not paid yet'}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Payment Method</TableCell>
                                      <TableCell>{payroll.paymentMethod || 'Not specified'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Reference</TableCell>
                                      <TableCell>{payroll.reference || 'Not available'}</TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </Grid>
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filterPayrolls(payrolls).length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            '.MuiTablePagination-select': {
              color: theme.palette.text.primary
            }
          }}
        />
      </TableContainer>

      {/* Generate Payroll Dialog */}
      <Dialog 
        open={openGenerateDialog} 
        onClose={handleCloseGenerateDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.9)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle 
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.dark, 0.1)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          Generate Payroll
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Select Employee"
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
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
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  sx: {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }
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
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  sx: {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }
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
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions 
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.dark, 0.1)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
            borderTop: `1px solid ${theme.palette.divider}`
          }}
        >
          <Button 
            onClick={handleCloseGenerateDialog}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={generatePayroll}
            variant="contained"
            color="primary"
            disabled={generating || !selectedEmployee}
            sx={{
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                  : `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
              }
            }}
          >
            {generating ? <CircularProgress size={24} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog 
        open={openPaymentDialog} 
        onClose={handleClosePaymentDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.9)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle 
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.dark, 0.1)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.success.light, 0.1)}, ${alpha(theme.palette.success.main, 0.1)})`,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          Mark as Paid
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Employee:</strong>{' '}
                {selectedPayroll?.employeeId?.name || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Amount:</strong> ₹{selectedPayroll?.netSalary.toFixed(2) || '0.00'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
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
        <DialogActions 
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.dark, 0.1)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.success.light, 0.1)}, ${alpha(theme.palette.success.main, 0.1)})`,
            borderTop: `1px solid ${theme.palette.divider}`
          }}
        >
          <Button 
            onClick={handleClosePaymentDialog}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.success.main, 0.1)
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={updatePaymentStatus} 
            variant="contained" 
            color="success"
            sx={{
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
                : `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`
                  : `linear-gradient(45deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`
              }
            }}
          >
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payroll Details Dialog */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={handleCloseDetailsDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.9)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle 
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.dark, 0.1)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          Payroll Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDetailsDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedPayroll && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
                  }}
                >
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
                      <strong>Base Salary:</strong> ₹{selectedPayroll.baseSalary.toFixed(2)}
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
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
                  }}
                >
                  Attendance Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      variant="outlined"
                      sx={{
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.dark, 0.1)})`
                          : `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h5" align="center" color="primary">
                          {selectedPayroll.workingDays}
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                          Working Days
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      variant="outlined"
                      sx={{
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(45deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.dark, 0.1)})`
                          : `linear-gradient(45deg, ${alpha(theme.palette.success.light, 0.1)}, ${alpha(theme.palette.success.main, 0.1)})`,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h5" align="center" color="success.main">
                          {selectedPayroll.presentDays}
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                          Present Days
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      variant="outlined"
                      sx={{
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(45deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.dark, 0.1)})`
                          : `linear-gradient(45deg, ${alpha(theme.palette.error.light, 0.1)}, ${alpha(theme.palette.error.main, 0.1)})`,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h5" align="center" color="error.main">
                          {selectedPayroll.absentDays}
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                          Absent Days
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      variant="outlined"
                      sx={{
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(45deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.dark, 0.1)})`
                          : `linear-gradient(45deg, ${alpha(theme.palette.warning.light, 0.1)}, ${alpha(theme.palette.warning.main, 0.1)})`,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h5" align="center" color="warning.main">
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
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
                  }}
                >
                  Salary Calculation
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer 
                  component={Paper} 
                  variant="outlined"
                  sx={{
                    background: theme.palette.mode === 'dark'
                      ? `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.9)})`
                      : `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Base Salary</TableCell>
                        <TableCell align="right">₹{selectedPayroll.baseSalary.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Overtime Amount</TableCell>
                        <TableCell align="right">
                          ₹{(selectedPayroll.overtimeHours * selectedPayroll.overtimeRate).toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Bonus Amount</TableCell>
                        <TableCell align="right">₹{selectedPayroll.bonusAmount.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Deductions</TableCell>
                        <TableCell align="right">₹{selectedPayroll.deductions.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Tax Amount</TableCell>
                        <TableCell align="right">₹{selectedPayroll.taxAmount.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Net Salary</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          ₹{selectedPayroll.netSalary.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
                  }}
                >
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
                        sx={{
                          fontWeight: 'bold',
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Payment Date:</strong>{' '}
                      {selectedPayroll.paymentDate
                        ? format(new Date(selectedPayroll.paymentDate), 'PPP')
                        : 'Not paid yet'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Payment Method:</strong>{' '}
                      {selectedPayroll.paymentMethod || 'Not specified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Reference:</strong>{' '}
                      {selectedPayroll.reference || 'Not available'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions 
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.dark, 0.1)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
            borderTop: `1px solid ${theme.palette.divider}`
          }}
        >
          <Button
            startIcon={<PrintIcon />}
            variant="outlined"
            onClick={() => window.print()}
            sx={{
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            Print
          </Button>
          {selectedPayroll && selectedPayroll.paymentStatus === 'Pending' && (
            <Button
              startIcon={<MonetizationOnIcon />}
              variant="contained"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseDetailsDialog();
                handleOpenPaymentDialog(selectedPayroll);
              }}
              sx={{
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
                  : `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(45deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`
                    : `linear-gradient(45deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`
                }
              }}
            >
              Mark as Paid
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Payroll Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCloseEditDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.9)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle 
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.dark, 0.1)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.info.light, 0.1)}, ${alpha(theme.palette.info.main, 0.1)})`,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          Edit Payroll
        </DialogTitle>
        <DialogContent>
          {editingPayroll && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Employee:</strong>{' '}
                  {editingPayroll.employeeId?.name || 'N/A'}
                </Typography>
                <Typography variant="body1">
                  <strong>Base Salary:</strong> ₹{editingPayroll.baseSalary.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bonus Amount"
                  type="number"
                  value={editingPayroll.bonusAmount}
                  onChange={(e) => setEditingPayroll({
                    ...editingPayroll,
                    bonusAmount: e.target.value
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Deductions"
                  type="number"
                  value={editingPayroll.deductions}
                  onChange={(e) => setEditingPayroll({
                    ...editingPayroll,
                    deductions: e.target.value
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Deduction Reasons"
                  multiline
                  rows={2}
                  value={editingPayroll.deductionReasons}
                  onChange={(e) => setEditingPayroll({
                    ...editingPayroll,
                    deductionReasons: e.target.value
                  })}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Overtime Hours"
                  type="number"
                  value={editingPayroll.overtimeHours}
                  onChange={(e) => setEditingPayroll({
                    ...editingPayroll,
                    overtimeHours: e.target.value
                  })}
                  InputProps={{
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Overtime Rate"
                  type="number"
                  value={editingPayroll.overtimeRate}
                  onChange={(e) => setEditingPayroll({
                    ...editingPayroll,
                    overtimeRate: e.target.value
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : undefined
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Preview
                </Typography>
                <TableContainer 
                  component={Paper} 
                  variant="outlined"
                  sx={{
                    background: theme.palette.mode === 'dark'
                      ? `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.9)})`
                      : `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Base Salary</TableCell>
                        <TableCell align="right">₹{editingPayroll.baseSalary.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Overtime Amount</TableCell>
                        <TableCell align="right">
                          ₹{(editingPayroll.overtimeHours * editingPayroll.overtimeRate).toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Bonus Amount</TableCell>
                        <TableCell align="right">₹{editingPayroll.bonusAmount.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Deductions</TableCell>
                        <TableCell align="right">₹{editingPayroll.deductions.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Tax Amount</TableCell>
                        <TableCell align="right">₹{editingPayroll.taxAmount.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Net Salary</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          ₹{editingPayroll.netSalary.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions 
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.dark, 0.1)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.info.light, 0.1)}, ${alpha(theme.palette.info.main, 0.1)})`,
            borderTop: `1px solid ${theme.palette.divider}`
          }}
        >
          <Button 
            onClick={handleCloseEditDialog}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.info.main, 0.1)
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={updatePayroll}
            variant="contained"
            color="info"
            sx={{
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`
                : `linear-gradient(45deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.info.dark}, ${theme.palette.info.main})`
                  : `linear-gradient(45deg, ${theme.palette.info.dark}, ${theme.palette.info.main})`
              }
            }}
          >
            Update Payroll
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.9)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
            backdropFilter: 'blur(10px)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PayrollPage;