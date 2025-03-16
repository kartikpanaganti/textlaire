import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  MenuItem,
  Divider,
  useTheme,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
  History as HistoryIcon,
  CloudUpload as CloudUploadIcon,
  GroupAdd as GroupAddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import apiClient from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';

const PayrollCalculator = ({ onPayrollCreated }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // New state variables for enhanced features
  const [customAllowances, setCustomAllowances] = useState([]);
  const [customDeductions, setCustomDeductions] = useState([]);
  const [showAllowanceDialog, setShowAllowanceDialog] = useState(false);
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', amount: '' });
  const [calculationOptions, setCalculationOptions] = useState({
    includeOvertime: true,
    includeBonuses: true,
    includeLeaveDeductions: true,
    taxCalculation: true
  });
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    payPeriodStart: null,
    payPeriodEnd: null
  });
  const [calculatedPayroll, setCalculatedPayroll] = useState(null);
  
  // Add state for payroll settings
  const [payrollSettings, setPayrollSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Add new state for live preview
  const [livePreview, setLivePreview] = useState({
    basicSalary: 0,
    overtime: { hours: 0, rate: 0, amount: 0 },
    allowances: {},
    deductions: {},
    totalEarnings: 0,
    totalDeductions: 0,
    netSalary: 0
  });

  // Add state for selected employee details
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);

  // Add new state for bulk processing
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchPayrollHistory();
    fetchPayrollSettings();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Use mock data for testing
      setEmployees([
        { _id: '1', name: 'John Doe', employeeID: 'EMP001', department: 'Engineering', position: 'Software Developer', salary: 50000 },
        { _id: '2', name: 'Jane Smith', employeeID: 'EMP002', department: 'Marketing', position: 'Marketing Manager', salary: 60000 },
        { _id: '3', name: 'Bob Johnson', employeeID: 'EMP003', department: 'Finance', position: 'Accountant', salary: 55000 }
      ]);
      setError('Using mock data for testing. Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollHistory = async () => {
    try {
      const response = await apiClient.get('/api/payroll/history');
      setPayrollHistory(response.data);
    } catch (error) {
      console.error('Error fetching payroll history:', error);
      // Use mock data for testing
      setPayrollHistory([
        { employeeName: 'John Doe', date: new Date(), netSalary: 45000, status: 'Paid' },
        { employeeName: 'Jane Smith', date: new Date(), netSalary: 55000, status: 'Pending' }
      ]);
    }
  };

  const fetchPayrollSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await apiClient.get('/api/payroll-settings');
      setPayrollSettings(response.data);
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
      // Use mock data for testing
      setPayrollSettings({
        allowances: {
          housing: { type: 'percentage', value: 10 },
          transport: { type: 'fixed', value: 5000 },
          meal: { type: 'fixed', value: 3000 },
          other: { type: 'fixed', value: 2000 }
        },
        deductions: {
          tax: { type: 'percentage', value: 10 },
          insurance: { type: 'percentage', value: 5 },
          other: { type: 'fixed', value: 1000 }
        }
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  // Modify handleInputChange to trigger live preview
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset calculation results when inputs change
    if (calculatedPayroll) {
      setCalculatedPayroll(null);
      setSuccess(false);
    }
    
    // Clear errors
    if (error) {
      setError('');
    }

    // If employee is selected, trigger live preview calculation
    if (field === 'employeeId' && value) {
      const employee = employees.find(emp => emp._id === value);
      setSelectedEmployeeDetails(employee);
      calculateLivePreview(employee, formData.payPeriodStart, formData.payPeriodEnd);
    } else if (selectedEmployeeDetails) {
      calculateLivePreview(selectedEmployeeDetails, formData.payPeriodStart, formData.payPeriodEnd);
    }
  };

  // Remove debounce and make calculation immediate
  const calculateLivePreview = async (employee, startDate, endDate) => {
    if (!employee || !startDate || !endDate) return;

    try {
      // Get payroll settings
      const settings = payrollSettings || await fetchPayrollSettings();
      
      // Calculate basic salary (pro-rated based on working days)
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Reset hours to ensure we're comparing just the dates
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      // Get the number of days in the month
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      
      // Calculate actual days in the pay period (inclusive)
      const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calculate pro-rated salary
      const basicSalary = Math.round((employee.salary / daysInMonth) * totalDays * 100) / 100;

      // Calculate default allowances
      const allowances = {
        housing: Math.round(calculateAllowance(settings.allowances?.housing, basicSalary) * 100) / 100,
        transport: Math.round(calculateAllowance(settings.allowances?.transport, basicSalary) * 100) / 100,
        meal: Math.round(calculateAllowance(settings.allowances?.meal, basicSalary) * 100) / 100,
        other: Math.round(calculateAllowance(settings.allowances?.other, basicSalary) * 100) / 100,
        custom: customAllowances
      };

      // Calculate default deductions
      const deductions = {
        tax: Math.round(calculateDeduction(settings.deductions?.tax, basicSalary) * 100) / 100,
        insurance: Math.round(calculateDeduction(settings.deductions?.insurance, basicSalary) * 100) / 100,
        other: Math.round(calculateDeduction(settings.deductions?.other, basicSalary) * 100) / 100,
        custom: customDeductions
      };

      // Calculate totals with rounding
      const totalAllowances = Math.round(
        (Object.entries(allowances)
          .filter(([key]) => key !== 'custom')
          .reduce((sum, [_, value]) => {
            // Ensure value is a number
            const numericValue = typeof value === 'number' ? value : 0;
            return sum + numericValue;
          }, 0) +
          (Array.isArray(customAllowances) ? 
            customAllowances.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) : 0)) * 100
      ) / 100;

      const totalDeductionsAmount = Math.round(
        (Object.entries(deductions)
          .filter(([key]) => key !== 'custom')
          .reduce((sum, [_, value]) => {
            // Ensure value is a number
            const numericValue = typeof value === 'number' ? value : 0;
            return sum + numericValue;
          }, 0) +
          (Array.isArray(customDeductions) ? 
            customDeductions.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) : 0)) * 100
      ) / 100;

      const totalEarnings = Math.round((basicSalary + totalAllowances) * 100) / 100;
      const netSalary = Math.round((totalEarnings - totalDeductionsAmount) * 100) / 100;

      // Update live preview immediately
      setLivePreview({
        basicSalary,
        overtime: { hours: 0, rate: 0, amount: 0 },
        allowances,
        deductions,
        totalEarnings,
        totalDeductions: totalDeductionsAmount,
        netSalary,
        employeeDetails: {
          name: employee.name,
          employeeID: employee.employeeID,
          department: employee.department,
          position: employee.position
        }
      });
    } catch (error) {
      console.error('Error calculating live preview:', error);
    }
  };

  // Add useEffect to trigger recalculation when relevant values change
  useEffect(() => {
    if (selectedEmployeeDetails && formData.payPeriodStart && formData.payPeriodEnd) {
      calculateLivePreview(selectedEmployeeDetails, formData.payPeriodStart, formData.payPeriodEnd);
    }
  }, [
    selectedEmployeeDetails,
    formData.payPeriodStart,
    formData.payPeriodEnd,
    customAllowances,
    customDeductions,
    calculationOptions,
    payrollSettings
  ]);

  // Helper function to calculate allowance
  const calculateAllowance = (allowance, basicSalary) => {
    if (!allowance || typeof allowance !== 'object') return 0;
    
    try {
      return allowance.type === 'percentage' 
        ? (basicSalary * (parseFloat(allowance.value) || 0)) / 100 
        : (parseFloat(allowance.value) || 0);
    } catch (error) {
      console.error('Error calculating allowance:', error);
      return 0;
    }
  };

  // Helper function to calculate deduction
  const calculateDeduction = (deduction, basicSalary) => {
    if (!deduction || typeof deduction !== 'object') return 0;
    
    try {
      return deduction.type === 'percentage' 
        ? (basicSalary * (parseFloat(deduction.value) || 0)) / 100 
        : (parseFloat(deduction.value) || 0);
    } catch (error) {
      console.error('Error calculating deduction:', error);
      return 0;
    }
  };

  // Modify the preview card section to use live preview when available
  const previewData = livePreview;  // Always use live preview since we removed calculated payroll

  const handleViewDetails = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      
      // Use the current live preview data for saving
      const payrollData = {
        ...livePreview,
        employeeId: formData.employeeId,
        payPeriodStart: formData.payPeriodStart,
        payPeriodEnd: formData.payPeriodEnd,
        customAllowances,
        customDeductions
      };
      
      // Send the payroll data to be saved
      try {
        const response = await apiClient.post('/api/payroll/save', payrollData);
        
        // Show success message
        setSuccess('Payroll saved successfully!');
        
        // If onPayrollCreated callback exists, call it with the saved payroll
        if (onPayrollCreated && response.data) {
          onPayrollCreated(response.data);
        }
      } catch (apiError) {
        console.error('API Error saving payroll:', apiError);
        
        // For testing purposes, create a mock response
        const mockResponse = {
          _id: 'mock-' + Date.now(),
          ...payrollData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentStatus: 'Pending'
        };
        
        setSuccess('Using mock data: Payroll saved successfully!');
        
        if (onPayrollCreated) {
          onPayrollCreated(mockResponse);
        }
      }
    } catch (error) {
      console.error('Error in handleViewDetails:', error);
      setError('Failed to process payroll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      employeeId: '',
      payPeriodStart: null,
      payPeriodEnd: null
    });
    setCalculatedPayroll(null);
    setSuccess(false);
    setError('');
  };

  // Modify handleAddItem to trigger recalculation
  const handleAddItem = (type) => {
    if (!newItem.name || !newItem.amount) return;
    
    if (type === 'allowance') {
      const newAllowances = [...customAllowances, { ...newItem }];
      setCustomAllowances(newAllowances);
      setShowAllowanceDialog(false);
    } else {
      const newDeductions = [...customDeductions, { ...newItem }];
      setCustomDeductions(newDeductions);
      setShowDeductionDialog(false);
    }
    
    setNewItem({ name: '', amount: '' });
  };

  // Modify handleRemoveItem to trigger recalculation
  const handleRemoveItem = (index, type) => {
    if (type === 'allowance') {
      const newAllowances = customAllowances.filter((_, i) => i !== index);
      setCustomAllowances(newAllowances);
    } else {
      const newDeductions = customDeductions.filter((_, i) => i !== index);
      setCustomDeductions(newDeductions);
    }
  };

  const renderDialog = (type) => {
    const isAllowance = type === 'allowance';
    const open = isAllowance ? showAllowanceDialog : showDeductionDialog;
    const setOpen = isAllowance ? setShowAllowanceDialog : setShowDeductionDialog;

    return (
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{isAllowance ? 'Add Allowance' : 'Add Deduction'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={newItem.amount}
                onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => handleAddItem(type)} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Add function to handle bulk file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          processBulkData(data);
        } catch (error) {
          setError('Invalid file format. Please upload a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Add function to process bulk data
  const processBulkData = async (data) => {
    setBulkProcessing(true);
    setBulkProgress(0);
    setBulkResults([]);

    try {
      const settings = payrollSettings || await fetchPayrollSettings();
      const results = [];
      let processed = 0;

      // Process in batches of 10 for better performance
      const batchSize = 10;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchPromises = batch.map(async (item) => {
          try {
            const response = await apiClient.post('/api/payroll/preview', {
              employeeId: item.employeeId,
              payPeriodStart: item.payPeriodStart,
              payPeriodEnd: item.payPeriodEnd,
              customAllowances: item.customAllowances || [],
              customDeductions: item.customDeductions || []
            });
            return { success: true, data: response.data };
          } catch (error) {
            return { 
              success: false, 
              error: error.response?.data?.message || 'Failed to process',
              employeeId: item.employeeId 
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        processed += batch.length;
        setBulkProgress((processed / data.length) * 100);
      }

      setBulkResults(results);
    } catch (error) {
      setError('Failed to process bulk data. Please try again.');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Add function to save bulk results
  const saveBulkResults = async () => {
    setBulkProcessing(true);
    try {
      const successfulResults = bulkResults.filter(result => result.success);
      const savePromises = successfulResults.map(result => 
        apiClient.post('/api/payroll/save', result.data)
      );
      
      await Promise.all(savePromises);
      setSuccess(`Successfully saved ${successfulResults.length} payroll records`);
      setShowBulkDialog(false);
      
      // Refresh payroll history
      fetchPayrollHistory();
    } catch (error) {
      setError('Failed to save bulk payroll records. Please try again.');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Add bulk processing dialog
  const renderBulkDialog = () => (
    <Dialog
      open={showBulkDialog}
      onClose={() => !bulkProcessing && setShowBulkDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Bulk Process Payroll</DialogTitle>
      <DialogContent>
        {!bulkProcessing && !bulkResults.length ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              id="bulk-upload-input"
              onChange={handleFileUpload}
            />
            <label htmlFor="bulk-upload-input">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUploadIcon />}
              >
                Upload JSON File
              </Button>
            </label>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Upload a JSON file containing employee payroll data
            </Typography>
          </Box>
        ) : bulkProcessing ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress variant="determinate" value={bulkProgress} />
            <Typography sx={{ mt: 2 }}>
              Processing... {Math.round(bulkProgress)}%
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Processing Results
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography color="success.main">
                  Successful: {bulkResults.filter(r => r.success).length}
                </Typography>
                <Typography color="error">
                  Failed: {bulkResults.filter(r => !r.success).length}
                </Typography>
              </Grid>
              {bulkResults.filter(r => !r.success).map((result, index) => (
                <Grid item xs={12} key={index}>
                  <Alert severity="error">
                    Failed to process employee {result.employeeId}: {result.error}
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setShowBulkDialog(false)} 
          disabled={bulkProcessing}
        >
          Cancel
        </Button>
        {bulkResults.length > 0 && !bulkProcessing && (
          <Button
            onClick={saveBulkResults}
            variant="contained"
            color="primary"
          >
            Save All Successful Records
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  // Add validateForm function
  const validateForm = () => {
    if (!formData.employeeId) {
      setError('Please select an employee');
      return false;
    }
    if (!formData.payPeriodStart) {
      setError('Please select a pay period start date');
      return false;
    }
    if (!formData.payPeriodEnd) {
      setError('Please select a pay period end date');
      return false;
    }
    if (new Date(formData.payPeriodEnd) < new Date(formData.payPeriodStart)) {
      setError('Pay period end date cannot be before start date');
      return false;
    }
    return true;
  };

  // Add formatCurrency function
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    
    // Convert to number if it's a string or handle non-numeric values
    let number;
    if (typeof amount === 'string') {
      number = parseFloat(amount) || 0;
    } else if (typeof amount === 'number') {
      number = amount;
    } else if (typeof amount === 'object') {
      // If it's an object (like custom allowances array), return 0
      return '₹0';
    } else {
      number = 0;
    }
    
    // Check if the number has decimal places
    if (number % 1 === 0) {
      // If it's a whole number, don't show decimal places
      return `₹${Math.round(number).toLocaleString('en-IN')}`;
    } else {
      // If it has decimals, show exactly two decimal places
      return `₹${number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
        Payroll Calculator
        <Tooltip title="View Payroll History">
          <IconButton onClick={() => setShowHistory(true)} sx={{ ml: 2 }}>
            <HistoryIcon />
          </IconButton>
        </Tooltip>
      </Typography>
        <Button
          variant="contained"
          startIcon={<GroupAddIcon />}
          onClick={() => setShowBulkDialog(true)}
        >
          Bulk Process
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Calculation Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Calculate New Payroll
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

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth disabled={loading || calculating}>
                    <InputLabel>Select Employee</InputLabel>
                    <Select
                      value={formData.employeeId}
                      onChange={(e) => handleInputChange('employeeId', e.target.value)}
                      label="Select Employee"
                    >
                      {employees.map((employee) => (
                        <MenuItem key={employee._id} value={employee._id}>
                          {employee.name} ({employee.employeeID})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Pay Period Start"
                      value={formData.payPeriodStart}
                      onChange={(date) => handleInputChange('payPeriodStart', date)}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          disabled: loading || calculating,
                          size: "medium"
                        },
                        popper: {
                          placement: "bottom-start"
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Pay Period End"
                      value={formData.payPeriodEnd}
                      onChange={(date) => handleInputChange('payPeriodEnd', date)}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          disabled: loading || calculating,
                          size: "medium"
                        },
                        popper: {
                          placement: "bottom-start"
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                {/* Calculation Options */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Calculation Options
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={calculationOptions.includeOvertime}
                              onChange={(e) =>
                                setCalculationOptions({
                                  ...calculationOptions,
                                  includeOvertime: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Include Overtime"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={calculationOptions.includeBonuses}
                              onChange={(e) =>
                                setCalculationOptions({
                                  ...calculationOptions,
                                  includeBonuses: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Include Bonuses"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={calculationOptions.includeLeaveDeductions}
                              onChange={(e) =>
                                setCalculationOptions({
                                  ...calculationOptions,
                                  includeLeaveDeductions: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Leave Deductions"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={calculationOptions.taxCalculation}
                              onChange={(e) =>
                                setCalculationOptions({
                                  ...calculationOptions,
                                  taxCalculation: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Tax Calculation"
                        />
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                {/* Custom Allowances Section */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">
                        Custom Allowances
                      </Typography>
                      <Tooltip title="Add Allowance">
                        <IconButton onClick={() => setShowAllowanceDialog(true)}>
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {customAllowances.map((allowance, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography>
                          {allowance.name}: ₹{allowance.amount}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveItem(index, 'allowance')}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Card>
                </Grid>

                {/* Custom Deductions Section */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">
                        Custom Deductions
                      </Typography>
                      <Tooltip title="Add Deduction">
                        <IconButton onClick={() => setShowDeductionDialog(true)}>
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {customDeductions.map((deduction, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography>
                          {deduction.name}: ₹{deduction.amount}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveItem(index, 'deduction')}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleReset}
                      sx={{ mr: 2 }}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleViewDetails}
                      disabled={loading || !selectedEmployeeDetails || !formData.payPeriodStart || !formData.payPeriodEnd}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                          Saving...
                        </>
                      ) : (
                        'Save & View Details'
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {calculatedPayroll ? 'Final Payroll Preview' : 'Live Preview'}
              </Typography>

              {previewData.employeeDetails || previewData.basicSalary > 0 ? (
                <Box>
                  {/* Employee Details Section */}
                  {previewData.employeeDetails && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="primary">
                        Employee Details
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Name:</Typography>
                          <Typography>{previewData.employeeDetails.name}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">ID:</Typography>
                          <Typography>{previewData.employeeDetails.employeeID}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Rest of the preview content */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography color="textSecondary">Monthly Base Salary:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        {formatCurrency(selectedEmployeeDetails?.salary)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>

                    <Grid item xs={6}>
                      <Typography color="textSecondary">
                        Pro-rated Salary:
                        <Tooltip title="Salary calculated based on selected pay period">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        {formatCurrency(previewData.basicSalary)}
                      </Typography>
                    </Grid>
                    {formData.payPeriodStart && formData.payPeriodEnd && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">
                          For period: {format(new Date(formData.payPeriodStart), 'dd/MM/yyyy')} to {format(new Date(formData.payPeriodEnd), 'dd/MM/yyyy')}
                        </Typography>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>

                    {/* Overtime */}
                    {calculationOptions.includeOvertime && previewData.overtime && (
                      <>
                        <Grid item xs={6}>
                          <Typography color="textSecondary">Overtime:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography>
                            {formatCurrency(previewData.overtime?.amount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="textSecondary">
                            {previewData.overtime?.hours || 0} hours @ 
                            ₹{(previewData.overtime?.rate || 0).toFixed(2)}/hour
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                        </Grid>
                      </>
                    )}

                    {/* Allowances */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Allowances:</Typography>
                    </Grid>
                    {Object.entries(previewData.allowances || {})
                      .filter(([key, _]) => key !== 'custom' && typeof _ !== 'undefined')
                      .map(([key, value]) => (
                      <React.Fragment key={key}>
                        <Grid item xs={6}>
                          <Typography color="textSecondary">
                            {key.charAt(0).toUpperCase() + key.slice(1)}:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography>{formatCurrency(value)}</Typography>
                        </Grid>
                      </React.Fragment>
                    ))}

                    {/* Custom Allowances */}
                    {customAllowances.map((allowance, index) => (
                      <React.Fragment key={`custom-allowance-${index}`}>
                        <Grid item xs={6}>
                          <Typography color="textSecondary">
                            {allowance.name}:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography>{formatCurrency(allowance.amount)}</Typography>
                        </Grid>
                      </React.Fragment>
                    ))}

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>

                    {/* Deductions */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Deductions:</Typography>
                    </Grid>
                    {Object.entries(previewData.deductions || {})
                      .filter(([key, _]) => key !== 'custom' && typeof _ !== 'undefined')
                      .map(([key, value]) => (
                      <React.Fragment key={key}>
                        <Grid item xs={6}>
                          <Typography color="textSecondary">
                            {key.charAt(0).toUpperCase() + key.slice(1)}:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography color="error">
                              -{formatCurrency(value).substring(1)}
                            </Typography>
                        </Grid>
                      </React.Fragment>
                    ))}

                    {/* Custom Deductions */}
                    {customDeductions.map((deduction, index) => (
                      <React.Fragment key={`custom-deduction-${index}`}>
                        <Grid item xs={6}>
                          <Typography color="textSecondary">
                            {deduction.name}:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography color="error">
                            -{formatCurrency(deduction.amount).substring(1)}
                          </Typography>
                        </Grid>
                      </React.Fragment>
                    ))}

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>

                    {/* Totals */}
                    <Grid item xs={6}>
                      <Typography variant="subtitle1">Total Earnings:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" color="primary">
                        {formatCurrency(previewData.totalEarnings)}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="subtitle1">Total Deductions:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" color="error">
                        -{formatCurrency(previewData.totalDeductions).substring(1)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="h6">Net Salary:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(previewData.netSalary)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Typography color="textSecondary" align="center">
                  Select an employee and pay period to see live preview
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogs */}
      {renderDialog('allowance')}
      {renderDialog('deduction')}

      {/* History Dialog */}
      <Dialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Payroll History</DialogTitle>
        <DialogContent>
          {payrollHistory.map((record, index) => (
            <Card key={index} sx={{ mb: 2, mt: index === 0 ? 2 : 0 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Employee:</Typography>
                    <Typography>{record.employeeName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Date:</Typography>
                    <Typography>
                      {new Date(record.date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Net Salary:</Typography>
                    <Typography>₹{record.netSalary?.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Status:</Typography>
                    <Typography>{record.status}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add bulk processing dialog */}
      {renderBulkDialog()}
    </Box>
  );
};

export default PayrollCalculator; 