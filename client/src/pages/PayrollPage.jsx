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
  Zoom
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
  Info as InfoIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const PayrollPage = () => {
  const theme = useTheme();
  // State variables
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
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
    paidPayments: 0,
    highestPaid: { name: '', amount: 0 },
    lowestPaid: { name: '', amount: Number.MAX_VALUE }
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
      
      // Find highest and lowest paid employees
      let highest = { name: '', amount: 0 };
      let lowest = { name: '', amount: Number.MAX_VALUE };
      
      payrolls.forEach(p => {
        if (p.netSalary > highest.amount) {
          highest = { 
            name: p.employeeId.name, 
            amount: p.netSalary 
          };
        }
        if (p.netSalary < lowest.amount) {
          lowest = { 
            name: p.employeeId.name, 
            amount: p.netSalary 
          };
        }
      });
      
      setStatistics({
        totalPayroll: total,
        averageSalary: total / payrolls.length,
        pendingPayments: pending,
        paidPayments: paid,
        highestPaid: highest,
        lowestPaid: lowest
      });
    }
  }, [payrolls]);

  // New function to fetch attendance data with retry capability
  const fetchAttendanceDataWithRetry = async (retryCount = 0, maxRetries = 2) => {
    try {
      await fetchAttendanceData();
    } catch (error) {
      if (retryCount < maxRetries) {
        console.log(`Retrying attendance data fetch (${retryCount + 1}/${maxRetries})...`);
        // Exponential backoff: wait longer between each retry
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        await fetchAttendanceDataWithRetry(retryCount + 1, maxRetries);
      } else {
        console.error('Maximum retry attempts reached for attendance data fetch');
      }
    }
  };

  // Update useEffect to use the retry function
  useEffect(() => {
    fetchAttendanceDataWithRetry();
    // Set up an interval to refresh attendance data every 30 minutes (1800000 ms)
    const intervalId = setInterval(fetchAttendanceDataWithRetry, 1800000);
    
    // Clear interval on component unmount
    return () => clearInterval(intervalId);
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

  // New function to fetch attendance data and calculate payrolls automatically
  const fetchAttendanceData = async () => {
    try {
      setAutoGenerating(true);
      // Fetch all attendance data and filter by month/year on client side
      // since there's no specific endpoint for attendance by month/year
      console.log(`Fetching attendance data for ${selectedMonth}/${selectedYear}...`);
      const response = await axios.get('/api/attendance');
      const allAttendanceData = response.data;
      console.log(`Received ${allAttendanceData.length} attendance records from API`);
      
      // Filter the attendance data for the selected month and year
      const filteredAttendanceData = allAttendanceData.filter(record => {
        try {
          // Check if date exists and is in a valid format
          if (!record.date) return false;
          
          const recordDate = new Date(record.date);
          // Check if the date is valid
          if (isNaN(recordDate.getTime())) return false;
          
          return recordDate.getMonth() + 1 === selectedMonth && 
                 recordDate.getFullYear() === selectedYear;
        } catch (err) {
          console.warn('Invalid date format in attendance record:', record);
          return false;
        }
      });
      
      console.log(`Found ${filteredAttendanceData.length} attendance records for ${selectedMonth}/${selectedYear}`);
      
      // Check if attendance data exists
      if (!filteredAttendanceData || filteredAttendanceData.length === 0) {
        console.log('No attendance data available for the selected period');
        showSnackbar(`No attendance data found for ${format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}. Please add attendance records first.`, 'warning');
        setAutoGenerating(false);
        return;
      }
      
      // Get existing payrolls to avoid duplicates
      const existingPayrolls = await axios.get(`/api/payroll/month/${selectedMonth}/${selectedYear}`);
      console.log(`Found ${existingPayrolls.data.length} existing payrolls for ${selectedMonth}/${selectedYear}`);
      
      // Find employees that don't have a payroll generated yet
      const employeesWithPayroll = new Set(existingPayrolls.data.map(p => 
        p.employeeId._id || (typeof p.employeeId === 'string' ? p.employeeId : null)
      ).filter(id => id !== null));
      
      console.log(`${employeesWithPayroll.size} employees already have payrolls`);
      
      // Group attendance by employee
      const attendanceByEmployee = {};
      
      filteredAttendanceData.forEach(record => {
        // Skip records without valid employee ID
        if (!record.employeeId || (!record.employeeId._id && typeof record.employeeId !== 'string')) {
          console.warn('Attendance record missing employeeId:', record);
          return;
        }
        
        // Get employee ID - handle both object and string formats
        const employeeId = record.employeeId._id || record.employeeId;
        
        if (!attendanceByEmployee[employeeId]) {
          attendanceByEmployee[employeeId] = {
            employeeId: record.employeeId,
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
            leaveDays: 0,
            overtimeHours: 0
          };
        }
        
        // Make status case-insensitive for more robustness
        const status = record.status ? record.status.toLowerCase() : '';
        
        // Update attendance counts based on status
        if (status.includes('present')) {
          attendanceByEmployee[employeeId].presentDays++;
          // Add overtime hours if available
          const overtimeHours = record.overtimeHours || record.overtime || 0;
          if (overtimeHours) {
            attendanceByEmployee[employeeId].overtimeHours += Number(overtimeHours);
          }
        } else if (status.includes('absent')) {
          attendanceByEmployee[employeeId].absentDays++;
        } else if (status.includes('late')) {
          attendanceByEmployee[employeeId].lateDays++;
          attendanceByEmployee[employeeId].presentDays++; // Late is still present
        } else if (status.includes('leave')) {
          attendanceByEmployee[employeeId].leaveDays++;
        }
      });
      
      console.log(`Processed attendance for ${Object.keys(attendanceByEmployee).length} employees`);
      
      // Generate payrolls for employees who don't have one yet
      const payrollsToGenerate = [];
      
      for (const employeeId in attendanceByEmployee) {
        if (!employeesWithPayroll.has(employeeId)) {
          const attendance = attendanceByEmployee[employeeId];
          const employee = attendance.employeeId;
          
          // Skip if employee data is missing
          if (!employee) {
            console.warn('Missing employee data for ID:', employeeId);
            continue;
          }
          
          // Calculate working days in the month
          const year = selectedYear;
          const month = selectedMonth - 1; // JavaScript months are 0-indexed
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const workingDays = daysInMonth; // Simplified - can be adjusted for weekends/holidays
          
          // Ensure valid data for salary calculations
          let baseSalary = 0;
          
          // Try to get employee salary from different possible object structures
          if (typeof employee === 'object') {
            baseSalary = employee.salary || employee.baseSalary || 0;
          }
          
          // Get overtime rate from employee data or use default
          const overtimeRate = (employee.overtimeRate || employee.hourlyRate || 250); 
          
          // Calculate overtime amount
          const overtimeAmount = attendance.overtimeHours * overtimeRate;
          
          // Calculate tax amount (simplified)
          const taxAmount = baseSalary * 0.1; // Assuming 10% tax
          
          // Calculate net salary
          const netSalary = baseSalary + overtimeAmount - taxAmount;
          
          // Create a payroll object
          const payroll = {
            employeeId: employeeId,
            month: selectedMonth,
            year: selectedYear,
            workingDays: workingDays,
            presentDays: attendance.presentDays,
            absentDays: attendance.absentDays,
            lateDays: attendance.lateDays,
            leaveDays: attendance.leaveDays,
            overtimeHours: attendance.overtimeHours,
            overtimeRate: overtimeRate,
            overtimeAmount: overtimeAmount,
            baseSalary: baseSalary,
            bonusAmount: 0, // Default, can be updated later
            deductions: 0, // Default, can be updated later
            taxAmount: taxAmount,
            netSalary: netSalary,
            paymentStatus: 'Pending'
          };
          
          payrollsToGenerate.push(payroll);
        }
      }
      
      console.log(`Found ${payrollsToGenerate.length} employees needing payroll generation`);
      
      // If there are payrolls to generate, send them to the server
      if (payrollsToGenerate.length > 0) {
        try {
          // Try to batch generate all payrolls
          console.log('Attempting to batch generate payrolls...');
          await axios.post('/api/payroll/batch-generate', { payrolls: payrollsToGenerate });
          console.log('Batch payroll generation successful');
          showSnackbar(`Automatically generated ${payrollsToGenerate.length} payrolls from attendance data`, 'success');
          // Refresh the payroll list after generating new ones
          fetchPayrolls();
        } catch (batchError) {
          console.error('Error in batch generate payrolls:', batchError);
          
          // If batch generate fails, try generating one by one as fallback
          console.log('Attempting to generate payrolls individually as fallback');
          showSnackbar('Batch generation failed. Trying to generate payrolls individually...', 'warning');
          
          const successfulPayrolls = [];
          const failedPayrolls = [];
          
          // Process each payroll individually
          for (const payroll of payrollsToGenerate) {
            try {
              // Generate single payroll
              console.log(`Generating payroll for employee ${payroll.employeeId}...`);
              await axios.post('/api/payroll/generate', {
                employeeId: payroll.employeeId,
                month: payroll.month,
                year: payroll.year,
                bonusAmount: payroll.bonusAmount,
                deductions: payroll.deductions,
                deductionReasons: ''
              });
              successfulPayrolls.push(payroll);
            } catch (singleError) {
              console.error(`Failed to generate payroll for employee ${payroll.employeeId}:`, singleError);
              failedPayrolls.push({
                employeeId: payroll.employeeId,
                error: singleError.message || 'Unknown error'
              });
            }
          }
          
          // Show results of individual generation
          if (successfulPayrolls.length > 0) {
            console.log(`Successfully generated ${successfulPayrolls.length} payrolls individually`);
            showSnackbar(`Successfully generated ${successfulPayrolls.length} payrolls individually. ${failedPayrolls.length} failed.`, 'success');
            fetchPayrolls();
          } else {
            console.error('All individual payroll generation attempts failed');
            showSnackbar(`Failed to generate any payrolls automatically. Please try manually.`, 'error');
          }
        }
      } else {
        console.log('No new payrolls to generate');
        showSnackbar('All employees already have payrolls for this period', 'info');
      }
    } catch (error) {
      console.error('Error fetching attendance data or generating payrolls:', error);
      showSnackbar(`Failed to auto-generate payrolls: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setAutoGenerating(false);
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

  // Update the updatePayroll function
  const updatePayroll = async () => {
    if (!editingPayroll) return;

    try {
      // Calculate new net salary
      const overtimeAmount = (Number(editingPayroll.overtimeHours) || 0) * (Number(editingPayroll.overtimeRate) || 0);
      const newNetSalary = (Number(editingPayroll.baseSalary) || 0) + 
                          (Number(editingPayroll.bonusAmount) || 0) + 
                          overtimeAmount - 
                          (Number(editingPayroll.deductions) || 0) - 
                          (Number(editingPayroll.taxAmount) || 0);

      const response = await axios.patch(`/api/payroll/${editingPayroll._id}`, {
        bonusAmount: Number(editingPayroll.bonusAmount) || 0,
        deductions: Number(editingPayroll.deductions) || 0,
        deductionReasons: editingPayroll.deductionReasons,
        overtimeHours: Number(editingPayroll.overtimeHours) || 0,
        overtimeRate: Number(editingPayroll.overtimeRate) || 0,
        presentDays: Number(editingPayroll.presentDays) || 0,
        absentDays: Number(editingPayroll.absentDays) || 0,
        lateDays: Number(editingPayroll.lateDays) || 0,
        leaveDays: Number(editingPayroll.leaveDays) || 0,
        overtimeAmount: overtimeAmount,
        netSalary: newNetSalary
      });

      showSnackbar('Payroll updated successfully', 'success');
      fetchPayrolls();
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating payroll:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        showSnackbar(error.response.data.message || 'Failed to update payroll', 'error');
      } else if (error.request) {
        // The request was made but no response was received
        showSnackbar('No response from server. Please check your connection.', 'error');
      } else {
        // Something happened in setting up the request that triggered an Error
        showSnackbar('Error setting up the request', 'error');
      }
    }
  };

  // Add handlers for edit dialog
  const handleOpenEditDialog = (payroll) => {
    setEditingPayroll({
      ...payroll,
      bonusAmount: payroll.bonusAmount || '',
      deductions: payroll.deductions || '',
      overtimeHours: payroll.overtimeHours || '',
      overtimeRate: payroll.overtimeRate || '',
      baseSalary: payroll.baseSalary || '',
      taxAmount: payroll.taxAmount || '',
      netSalary: payroll.netSalary || '',
      leaveDays: payroll.leaveDays || 0
    });
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

      {/* Controls for month, year and actions should come next */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                    label="Month"
                    sx={{ backgroundColor: alpha(theme.palette.background.paper, 0.8) }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {format(new Date(0, i), 'MMMM')}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>
          </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                    label="Year"
                    sx={{ backgroundColor: alpha(theme.palette.background.paper, 0.8) }}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <MenuItem key={i} value={new Date().getFullYear() - i}>
                        {new Date().getFullYear() - i}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
              <Grid item xs={12} md={6}>
          <TextField
                  fullWidth
            size="small"
                  placeholder="Search employees..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
                    endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                          <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
                    ) : null
            }}
                  sx={{ backgroundColor: alpha(theme.palette.background.paper, 0.8) }}
          />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', md: 'flex-end' } }}>
          <Button
                variant="contained"
            color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenGenerateDialog}
                sx={{ 
                  boxShadow: 2,
                  '&:hover': { boxShadow: 4 }
                }}
              >
                Generate Payroll
          </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={generateAllPayrolls}
                disabled={generating || autoGenerating}
                sx={{ 
                  boxShadow: 2,
                  '&:hover': { boxShadow: 4 }
                }}
              >
                {generating ? 'Generating...' : 'Generate All'}
              </Button>
              {autoGenerating && (
                <Chip
                  icon={<RefreshIcon className="rotating-icon" />}
                  label="Auto-Generating"
                  color="info"
                  size="small"
                  sx={{ 
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 0.7 },
                      '50%': { opacity: 1 },
                      '100%': { opacity: 0.7 }
                    },
                    '.rotating-icon': {
                      animation: 'rotate 2s linear infinite',
                      '@keyframes rotate': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }
                  }}
                />
              )}
              <Tooltip title="Toggle Filters">
                <IconButton 
                  color={showFilters ? "primary" : "default"} 
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ 
                    border: 1, 
                    borderColor: showFilters ? 'primary.main' : 'divider',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                  }}
                >
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={fetchPayrolls}
                  sx={{ 
                    border: 1, 
                    borderColor: 'divider',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
        </Box>
          </Grid>
        </Grid>

        {/* Advanced Filters Section */}
        <Collapse in={showFilters}>
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterListIcon fontSize="small" sx={{ mr: 1 }} />
              Advanced Filters
              <Button 
                size="small" 
                onClick={handleClearFilters} 
                startIcon={<ClearIcon />}
                sx={{ ml: 2 }}
              >
                Clear
              </Button>
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    label="Department"
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    <MenuItem value="Engineering">Engineering</MenuItem>
                    <MenuItem value="Sales">Sales</MenuItem>
                    <MenuItem value="Marketing">Marketing</MenuItem>
                    <MenuItem value="Finance">Finance</MenuItem>
                    <MenuItem value="HR">HR</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={filters.paymentStatus}
                    onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                    label="Payment Status"
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={3}>
                  <TextField
                  fullWidth
                    size="small"
                    label="Min Salary"
                    type="number"
                    value={filters.salaryRange.min}
                    onChange={(e) => handleFilterChange('salaryRange', { ...filters.salaryRange, min: e.target.value })}
                    InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
              </Grid>
              <Grid item xs={6} md={3}>
                  <TextField
                  fullWidth
                    size="small"
                    label="Max Salary"
                    type="number"
                    value={filters.salaryRange.max}
                    onChange={(e) => handleFilterChange('salaryRange', { ...filters.salaryRange, max: e.target.value })}
                    InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Payroll Table */}
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading payroll data...</Typography>
          </Box>
        ) : payrolls.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 300,
            backgroundColor: alpha(theme.palette.background.paper, 0.5),
            p: 3,
            borderRadius: 2
          }}>
            <MonetizationOnIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.3), mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>No Payroll Data Found</Typography>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ maxWidth: 500, mb: 3 }}>
              There are no payroll records for {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}.
              Generate payroll for this month by clicking the "Generate Payroll" button.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenGenerateDialog}
            >
              Generate Payroll
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 340px)' }}>
              <Table stickyHeader>
          <TableHead>
            <TableRow>
                    <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: 'white' }}></TableCell>
                    <TableCell 
                      sx={{ backgroundColor: theme.palette.primary.main, color: 'white', fontWeight: 'bold' }}
                      onClick={() => handleRequestSort('employeeId.name')}
                    >
                <TableSortLabel
                  active={orderBy === 'employeeId.name'}
                  direction={orderBy === 'employeeId.name' ? order : 'asc'}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: 'white !important',
                          },
                          '&.Mui-active': {
                            color: 'white',
                          },
                        }}
                      >
                        Employee
                </TableSortLabel>
              </TableCell>
                    <TableCell 
                      sx={{ backgroundColor: theme.palette.primary.main, color: 'white', fontWeight: 'bold' }}
                      onClick={() => handleRequestSort('baseSalary')}
                    >
                <TableSortLabel
                  active={orderBy === 'baseSalary'}
                  direction={orderBy === 'baseSalary' ? order : 'asc'}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: 'white !important',
                          },
                          '&.Mui-active': {
                            color: 'white',
                          },
                        }}
                >
                  Base Salary
                </TableSortLabel>
              </TableCell>
                    <TableCell 
                      sx={{ backgroundColor: theme.palette.primary.main, color: 'white', fontWeight: 'bold' }}
                      onClick={() => handleRequestSort('presentDays')}
                    >
                <TableSortLabel
                  active={orderBy === 'presentDays'}
                  direction={orderBy === 'presentDays' ? order : 'asc'}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: 'white !important',
                          },
                          '&.Mui-active': {
                            color: 'white',
                          },
                        }}
                      >
                        Attendance
                </TableSortLabel>
              </TableCell>
                    <TableCell 
                      sx={{ backgroundColor: theme.palette.primary.main, color: 'white', fontWeight: 'bold' }}
                      onClick={() => handleRequestSort('bonusAmount')}
                    >
                <TableSortLabel
                        active={orderBy === 'bonusAmount'}
                        direction={orderBy === 'bonusAmount' ? order : 'asc'}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: 'white !important',
                          },
                          '&.Mui-active': {
                            color: 'white',
                          },
                        }}
                      >
                        Bonus
                </TableSortLabel>
              </TableCell>
                    <TableCell 
                      sx={{ backgroundColor: theme.palette.primary.main, color: 'white', fontWeight: 'bold' }}
                      onClick={() => handleRequestSort('deductions')}
                    >
                <TableSortLabel
                        active={orderBy === 'deductions'}
                        direction={orderBy === 'deductions' ? order : 'asc'}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: 'white !important',
                          },
                          '&.Mui-active': {
                            color: 'white',
                          },
                        }}
                      >
                        Deductions
                </TableSortLabel>
              </TableCell>
                    <TableCell 
                      sx={{ backgroundColor: theme.palette.primary.main, color: 'white', fontWeight: 'bold' }}
                      onClick={() => handleRequestSort('netSalary')}
                    >
                <TableSortLabel
                  active={orderBy === 'netSalary'}
                  direction={orderBy === 'netSalary' ? order : 'asc'}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: 'white !important',
                          },
                          '&.Mui-active': {
                            color: 'white',
                          },
                        }}
                >
                  Net Salary
                </TableSortLabel>
              </TableCell>
                    <TableCell 
                      sx={{ backgroundColor: theme.palette.primary.main, color: 'white', fontWeight: 'bold' }}
                      onClick={() => handleRequestSort('paymentStatus')}
                    >
                <TableSortLabel
                  active={orderBy === 'paymentStatus'}
                  direction={orderBy === 'paymentStatus' ? order : 'asc'}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: 'white !important',
                          },
                          '&.Mui-active': {
                            color: 'white',
                          },
                        }}
                      >
                        Status
                </TableSortLabel>
              </TableCell>
                    <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
                  {sortPayrolls(filterPayrolls(payrolls))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((payroll) => {
                      const isExpanded = expandedRow === payroll._id;
                      return (
                  <React.Fragment key={payroll._id}>
                    <TableRow 
                      hover
                      onClick={() => handleRowClick(payroll._id)}
                      sx={{
                        cursor: 'pointer',
                              bgcolor: isExpanded ? alpha(theme.palette.primary.light, 0.1) : 'inherit',
                        '&:hover': {
                                bgcolor: alpha(theme.palette.primary.light, 0.15),
                        }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <IconButton size="small">
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box 
                                  sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    bgcolor: payroll.employeeId.name ? 
                                      `hsl(${payroll.employeeId.name.charCodeAt(0) * 10 % 360}, 70%, 50%)` : 
                                      'grey.500',
                                    color: 'white',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    mr: 2
                                  }}
                                >
                                  {payroll.employeeId.name ? payroll.employeeId.name.charAt(0).toUpperCase() : '?'}
                                </Box>
                                <Box>
                                  <Typography variant="body1" fontWeight="medium">
                                    {payroll.employeeId.name}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {payroll.employeeId.jobTitle} • {payroll.employeeId.department}
                                  </Typography>
                                </Box>
                              </Box>
                      </TableCell>
                            <TableCell>₹{payroll.baseSalary.toLocaleString('en-IN')}</TableCell>
                            <TableCell>
                              <Tooltip title={`Present: ${payroll.presentDays} | Absent: ${payroll.absentDays} | Late: ${payroll.lateDays} | Leave: ${payroll.leaveDays || 0} | Overtime: ${payroll.overtimeHours}h`}>
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2">
                                      {payroll.presentDays}/{payroll.workingDays} days
                                    </Typography>
                                  </Box>
                                  <Box sx={{ width: '100%', mt: 1 }}>
                                    <Box 
                                      sx={{ 
                                        height: 6, 
                                        borderRadius: 3, 
                                        width: '100%', 
                                        bgcolor: alpha(theme.palette.grey[500], 0.2)
                                      }}
                                    >
                                      <Box 
                                        sx={{ 
                                          height: '100%', 
                                          borderRadius: 3, 
                                          width: `${(payroll.presentDays / payroll.workingDays) * 100}%`,
                                          bgcolor: payroll.presentDays / payroll.workingDays > 0.8 
                                            ? theme.palette.success.main 
                                            : payroll.presentDays / payroll.workingDays > 0.6 
                                              ? theme.palette.warning.main 
                                              : theme.palette.error.main,
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              {payroll.bonusAmount > 0 ? (
                                <Typography color="success.main" fontWeight="medium">
                                  +₹{payroll.bonusAmount.toLocaleString('en-IN')}
                                </Typography>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              {payroll.deductions > 0 ? (
                                <Typography color="error.main" fontWeight="medium">
                                  -₹{payroll.deductions.toLocaleString('en-IN')}
                                </Typography>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight="bold">
                                ₹{payroll.netSalary.toLocaleString('en-IN')}
                              </Typography>
                            </TableCell>
                      <TableCell>
                        <Chip
                          label={payroll.paymentStatus}
                                size="small"
                          color={
                                  payroll.paymentStatus === 'Paid' ? 'success' : 
                                  payroll.paymentStatus === 'Pending' ? 'warning' : 'error'
                                }
                                variant={payroll.paymentStatus === 'Paid' ? 'filled' : 'outlined'}
                                sx={{ fontWeight: 'medium' }}
                        />
                      </TableCell>
                      <TableCell>
                              <Box sx={{ display: 'flex' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetailsDialog(payroll);
                              }}
                                    sx={{ color: theme.palette.info.main }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Payroll">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDialog(payroll);
                              }}
                                    sx={{ color: theme.palette.primary.main }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {payroll.paymentStatus === 'Pending' && (
                                  <Tooltip title="Process Payment">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPaymentDialog(payroll);
                                }}
                                      sx={{ color: theme.palette.success.main }}
                                    >
                                      <AttachMoneyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePayroll(payroll._id);
                              }}
                                    sx={{ color: theme.palette.error.main }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                          
                          {/* Expandable Detail Row */}
                    <TableRow>
                            <TableCell colSpan={9} sx={{ p: 0, borderBottom: isExpanded ? 1 : 'none' }}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ py: 3, px: 4, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
                                  <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" gutterBottom color="textSecondary">
                                  Salary Breakdown
                                </Typography>
                                      <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Grid container spacing={2}>
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Base Salary:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="body2">₹{payroll.baseSalary.toLocaleString('en-IN')}</Typography>
                                          </Grid>
                                          
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Overtime Amount:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="body2">₹{payroll.overtimeAmount.toLocaleString('en-IN')}</Typography>
                                          </Grid>
                                          
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Bonus Amount:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="success.main">+₹{payroll.bonusAmount.toLocaleString('en-IN')}</Typography>
                                          </Grid>
                                          
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Deductions:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="error.main">-₹{payroll.deductions.toLocaleString('en-IN')}</Typography>
                                          </Grid>
                                          
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Tax Amount:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="error.main">-₹{payroll.taxAmount.toLocaleString('en-IN')}</Typography>
                                          </Grid>
                                          
                                          <Grid item xs={12}><Divider /></Grid>
                                          
                                          <Grid item xs={6}>
                                            <Typography variant="subtitle2">Net Salary:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="subtitle2" fontWeight="bold">₹{payroll.netSalary.toLocaleString('en-IN')}</Typography>
                                          </Grid>
                                        </Grid>
                                      </Paper>
                                    </Grid>
                                    
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" gutterBottom color="textSecondary">
                                        Additional Information
                                      </Typography>
                                      <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Grid container spacing={2}>
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Working Days:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="body2">{payroll.workingDays} days</Typography>
                                          </Grid>
                                          
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Present Days:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="body2">{payroll.presentDays} days</Typography>
                                          </Grid>
                                          
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Absent Days:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="body2">{payroll.absentDays} days</Typography>
                                          </Grid>
                                          
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Late Days:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="body2">{payroll.lateDays} days</Typography>
                                          </Grid>
                                          
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Leave Days:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="body2">{payroll.leaveDays || 0} days</Typography>
                                          </Grid>
                                          
                                          <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Overtime Hours:</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="body2">{payroll.overtimeHours} hours</Typography>
                                          </Grid>
                                          
                                          {payroll.deductionReasons && (
                                            <>
                                              <Grid item xs={12}>
                                                <Typography variant="body2" color="textSecondary">Deduction Reasons:</Typography>
                                              </Grid>
                                              <Grid item xs={12}>
                                                <Typography variant="body2">{payroll.deductionReasons}</Typography>
                                              </Grid>
                                            </>
                                          )}
                              </Grid>
                                      </Paper>
                                    </Grid>
                                    
                                    {payroll.paymentStatus === 'Paid' && payroll.paymentDate && (
                                      <Grid item xs={12}>
                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.success.light, 0.1) }}>
                                          <Grid container spacing={2} alignItems="center">
                                            <Grid item>
                                              <CheckIcon color="success" />
                                            </Grid>
                                            <Grid item xs>
                                              <Typography variant="body2">
                                                Payment of ₹{payroll.netSalary.toLocaleString('en-IN')} processed on {format(new Date(payroll.paymentDate), 'dd MMM yyyy')} via {payroll.paymentMethod}
                                </Typography>
                                            </Grid>
                                            <Grid item>
                                              <Button 
                                          size="small"
                                                startIcon={<PrintIcon />}
                                                variant="outlined"
                                                color="primary"
                                              >
                                                Print Receipt
                                              </Button>
                              </Grid>
                                          </Grid>
                                        </Paper>
                                      </Grid>
                                    )}
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                      );
                    })}
          </TableBody>
        </Table>
            </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filterPayrolls(payrolls).length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
          </>
        )}
      </Paper>

      {/* Generate Payroll Dialog */}
      <Dialog 
        open={openGenerateDialog} 
        onClose={handleCloseGenerateDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          elevation: 5,
          sx: {
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: 6, 
          bgcolor: theme.palette.primary.main 
        }} />
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MonetizationOnIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6">Generate Payroll</Typography>
          </Box>
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleCloseGenerateDialog}
          sx={{
            position: 'absolute',
            right: 8,
            top: 12,
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  label="Select Employee"
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee._id} value={employee._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: employee.name ? 
                              `hsl(${employee.name.charCodeAt(0) * 10 % 360}, 70%, 50%)` : 
                              'grey.500',
                            color: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            mr: 2,
                            fontSize: '0.8rem'
                          }}
                        >
                          {employee.name ? employee.name.charAt(0).toUpperCase() : '?'}
                        </Box>
                        <Box>
                          {employee.name}
                          <Typography variant="caption" color="textSecondary" display="block">
                            {employee.department} • ₹{employee.salary.toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Month"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {format(new Date(0, i), 'MMMM')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Year"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <MenuItem key={i} value={new Date().getFullYear() - i}>
                      {new Date().getFullYear() - i}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

      {/* Process Payment Dialog */}
      <Dialog 
        open={openPaymentDialog} 
        onClose={handleClosePaymentDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 5,
          sx: {
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: 6, 
          bgcolor: theme.palette.success.main 
        }} />
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoneyIcon sx={{ mr: 1, color: theme.palette.success.main }} />
            <Typography variant="h6">Process Payment</Typography>
          </Box>
        </DialogTitle>
          <IconButton
            aria-label="close"
          onClick={handleClosePaymentDialog}
            sx={{
              position: 'absolute',
              right: 8,
            top: 12,
            }}
          >
            <CloseIcon />
          </IconButton>
        <DialogContent dividers>
          {selectedPayroll && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper 
                  variant="outlined" 
                  sx={{
                    p: 2, 
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    mb: 2
                  }}
                >
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Payment Details
                    </Typography>
                  </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Employee:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedPayroll.employeeId.name}
                    </Typography>
              </Grid>

                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Period:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {format(new Date(selectedPayroll.year, selectedPayroll.month - 1), 'MMMM yyyy')}
                        </Typography>
                  </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Net Salary:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{selectedPayroll.netSalary.toLocaleString('en-IN')}
                        </Typography>
                  </Grid>
                </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    label="Payment Method"
                  >
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Check">Check</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {paymentMethod === 'Bank Transfer' && (
              <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Bank Account Details
                    </Typography>
                  </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Account Number:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {selectedPayroll.employeeId.bankDetails?.accountNumber || 'Not provided'}
                    </Typography>
                  </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Bank Name:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {selectedPayroll.employeeId.bankDetails?.bankName || 'Not provided'}
                    </Typography>
                  </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">IFSC Code:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {selectedPayroll.employeeId.bankDetails?.ifscCode || 'Not provided'}
                    </Typography>
                  </Grid>
                </Grid>
                    
                    {(!selectedPayroll.employeeId.bankDetails?.accountNumber || 
                      !selectedPayroll.employeeId.bankDetails?.ifscCode) && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Some bank details are missing. Please update employee profile.
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              )}
              
              {paymentMethod === 'Check' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Check Number"
                    placeholder="Enter check number"
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  placeholder="Any additional notes about this payment..."
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleClosePaymentDialog} color="inherit">
            Cancel
          </Button>
            <Button
            onClick={updatePaymentStatus} 
              variant="contained"
              color="success"
            startIcon={<CheckIcon />}
            >
              Mark as Paid
            </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Payroll Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCloseEditDialog} 
        maxWidth="md"
        fullWidth
        PaperProps={{
          elevation: 5,
          sx: {
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: 6, 
          bgcolor: theme.palette.primary.main 
        }} />
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6">Edit Payroll</Typography>
          </Box>
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleCloseEditDialog}
          sx={{
            position: 'absolute',
            right: 8,
            top: 12,
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          {editingPayroll && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    mb: 3
                  }}
                >
                  <Grid container spacing={1}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="textSecondary">Employee:</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {editingPayroll.employeeId.name}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="textSecondary">Department:</Typography>
                <Typography variant="body1">
                        {editingPayroll.employeeId.department}
                </Typography>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="textSecondary">Period:</Typography>
                <Typography variant="body1">
                        {format(new Date(editingPayroll.year, editingPayroll.month - 1), 'MMMM yyyy')}
                </Typography>
              </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="textSecondary">Status:</Typography>
                      <Chip 
                        label={editingPayroll.paymentStatus} 
                        size="small"
                        color={
                          editingPayroll.paymentStatus === 'Paid' ? 'success' : 
                          editingPayroll.paymentStatus === 'Pending' ? 'warning' : 'error'
                        }
                        sx={{ fontWeight: 'medium' }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Attendance Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                        label="Working Days"
                  type="number"
                        InputProps={{
                          inputProps: { min: 0, max: 31 }
                        }}
                        value={editingPayroll.workingDays}
                  onChange={(e) => setEditingPayroll({
                    ...editingPayroll,
                          workingDays: Number(e.target.value)
                        })}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Present Days"
                        type="number"
                  InputProps={{
                          inputProps: { min: 0, max: editingPayroll.workingDays }
                        }}
                        value={editingPayroll.presentDays}
                        onChange={(e) => setEditingPayroll({
                          ...editingPayroll,
                          presentDays: Number(e.target.value),
                          absentDays: editingPayroll.workingDays - Number(e.target.value)
                        })}
                />
              </Grid>
                    
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                        label="Absent Days"
                  type="number"
                        InputProps={{
                          inputProps: { min: 0, max: editingPayroll.workingDays }
                        }}
                        value={editingPayroll.absentDays}
                  onChange={(e) => setEditingPayroll({
                    ...editingPayroll,
                          absentDays: Number(e.target.value),
                          presentDays: editingPayroll.workingDays - Number(e.target.value)
                        })}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Late Days"
                        type="number"
                  InputProps={{
                          inputProps: { min: 0, max: editingPayroll.presentDays }
                        }}
                        value={editingPayroll.lateDays}
                        onChange={(e) => setEditingPayroll({
                          ...editingPayroll,
                          lateDays: Number(e.target.value)
                        })}
                />
              </Grid>
                    
                    <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                        label="Leave Days"
                        type="number"
                        InputProps={{
                          inputProps: { min: 0 }
                        }}
                        value={editingPayroll.leaveDays}
                  onChange={(e) => setEditingPayroll({
                    ...editingPayroll,
                          leaveDays: Number(e.target.value)
                        })}
                />
              </Grid>
                    
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Overtime Hours"
                  type="number"
                        InputProps={{
                          inputProps: { min: 0, step: 0.5 }
                        }}
                  value={editingPayroll.overtimeHours}
                  onChange={(e) => setEditingPayroll({
                    ...editingPayroll,
                          overtimeHours: Number(e.target.value)
                        })}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Salary Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Base Salary"
                        type="number"
                  InputProps={{
                          inputProps: { min: 0 },
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        value={editingPayroll.baseSalary}
                        onChange={(e) => setEditingPayroll({
                          ...editingPayroll,
                          baseSalary: Number(e.target.value)
                        })}
                />
              </Grid>
                    
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                        label="Overtime Amount"
                  type="number"
                        InputProps={{
                          inputProps: { min: 0 },
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        value={editingPayroll.overtimeAmount}
                  onChange={(e) => setEditingPayroll({
                    ...editingPayroll,
                          overtimeAmount: Number(e.target.value)
                        })}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Bonus Amount"
                        type="number"
                  InputProps={{
                          inputProps: { min: 0 },
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        value={editingPayroll.bonusAmount}
                        onChange={(e) => setEditingPayroll({
                          ...editingPayroll,
                          bonusAmount: Number(e.target.value)
                        })}
                />
              </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Deductions"
                        type="number"
                        InputProps={{
                          inputProps: { min: 0 },
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        value={editingPayroll.deductions}
                        onChange={(e) => setEditingPayroll({
                          ...editingPayroll,
                          deductions: Number(e.target.value)
                        })}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Tax Amount"
                        type="number"
                        InputProps={{
                          inputProps: { min: 0 },
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        value={editingPayroll.taxAmount}
                        onChange={(e) => setEditingPayroll({
                          ...editingPayroll,
                          taxAmount: Number(e.target.value)
                        })}
                      />
                    </Grid>
                    
              <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Net Salary"
                        type="number"
                        InputProps={{
                          inputProps: { min: 0 },
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          readOnly: true,
                          sx: { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                        }}
                        value={
                          editingPayroll.baseSalary + 
                          editingPayroll.overtimeAmount + 
                          editingPayroll.bonusAmount - 
                          editingPayroll.deductions - 
                          editingPayroll.taxAmount
                        }
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Additional Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Deduction Reasons"
                        multiline
                        rows={2}
                        value={editingPayroll.deductionReasons || ''}
                        onChange={(e) => setEditingPayroll({
                          ...editingPayroll,
                          deductionReasons: e.target.value
                        })}
                        placeholder="Explain reasons for deductions (if any)..."
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={2}
                        value={editingPayroll.notes || ''}
                        onChange={(e) => setEditingPayroll({
                          ...editingPayroll,
                          notes: e.target.value
                        })}
                        placeholder="Any additional notes about this payroll..."
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseEditDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={updatePayroll}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
            Save Changes
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
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PayrollPage;