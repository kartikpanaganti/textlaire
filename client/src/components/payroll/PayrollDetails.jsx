import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Button,
  useTheme,
  Chip,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControlLabel,
  Switch,
  FormGroup
} from '@mui/material';
import {
  CalendarToday,
  Person,
  Work,
  AccountBalance,
  Receipt,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import apiClient from '../../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import PaymentDialog from './PaymentDialog';

const PayrollDetails = ({ 
  id: propId, 
  payrollData: propPayrollData, 
  loading: propLoading, 
  error: propError,
  onUpdate,
  onDelete,
  isEmbedded = false
}) => {
  const theme = useTheme();
  const params = useParams();
  const navigate = useNavigate();
  
  // Use prop id if provided, otherwise use from URL params
  const id = propId || params?.id;
  
  const [payroll, setPayroll] = useState(propPayrollData || null);
  const [loading, setLoading] = useState(propLoading !== undefined ? propLoading : true);
  const [error, setError] = useState(propError || null);
  const [editMode, setEditMode] = useState(false);
  const [editedPayroll, setEditedPayroll] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [calculationOptions, setCalculationOptions] = useState({
    includeBasicSalary: true,
    includeOvertime: true,
    includeAllowances: true,
    includeDeductions: true
  });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editingEarnings, setEditingEarnings] = useState(false);
  const [earningsData, setEarningsData] = useState({
    basicSalary: 0,
    overtime: { hours: 0, rate: 0, amount: 0 },
    allowances: {
      housing: 0,
      transport: 0,
      meal: 0,
      other: 0,
      custom: []
    },
    deductions: {
      tax: 0,
      insurance: 0,
      other: 0,
      custom: []
    }
  });

  // If props change, update state
  useEffect(() => {
    if (propPayrollData) {
      setPayroll(propPayrollData);
      setEditedPayroll(propPayrollData);
      setLoading(false);
    } else if (propId) {
      fetchPayroll(propId);
    }
  }, [propId, propPayrollData]);

  useEffect(() => {
    if (payroll) {
      setEarningsData({
        basicSalary: payroll.basicSalary || 0,
        overtime: payroll.overtime || { hours: 0, rate: 0, amount: 0 },
        allowances: {
          housing: payroll.allowances?.housing || 0,
          transport: payroll.allowances?.transport || 0,
          meal: payroll.allowances?.meal || 0,
          other: payroll.allowances?.other || 0,
          custom: payroll.allowances?.custom || []
        },
        deductions: {
          tax: payroll.deductions?.tax || 0,
          insurance: payroll.deductions?.insurance || 0,
          other: payroll.deductions?.other || 0,
          custom: payroll.deductions?.custom || []
        }
      });
    }
  }, [payroll]);

  const fetchPayroll = async (id) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/payroll/${id}`);
      setPayroll(response.data);
      setEditedPayroll(response.data);
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      setError(error.response?.data?.message || 'Failed to fetch payroll details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setEditedPayroll({ ...payroll });
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedPayroll(payroll);
    setSaveError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await apiClient.put(`/api/payroll/${id}`, editedPayroll);
      setPayroll(response.data);
      setEditMode(false);
      setError(null);
      
      if (typeof onUpdate === 'function') {
        onUpdate(response.data);
      }
    } catch (error) {
      console.error('Error updating payroll:', error);
      setError(error.response?.data?.message || 'Failed to update payroll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await apiClient.delete(`/api/payroll/${id}`);
      
      if (typeof onDelete === 'function') {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting payroll:', error);
      setError(error.response?.data?.message || 'Failed to delete payroll. Please try again.');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const calculateTotals = (payrollData) => {
    if (!payrollData) return { totalEarnings: 0, totalDeductions: 0, netSalary: 0 };

    // Ensure all values are properly converted to numbers and handle null/undefined
    const basicSalary = calculationOptions.includeBasicSalary ? 
      parseFloat(payrollData.basicSalary || 0) : 0;
    
    const overtimeAmount = calculationOptions.includeOvertime ? 
      parseFloat(payrollData.overtime?.amount || 0) : 0;
    
    // Calculate standard allowances
    let totalAllowances = 0;
    if (calculationOptions.includeAllowances) {
      // Standard allowances
      Object.entries(payrollData.allowances || {})
        .filter(([key]) => key !== 'custom')
        .forEach(([_, value]) => {
          totalAllowances += parseFloat(value || 0);
        });
      
      // Custom allowances
      (payrollData.allowances?.custom || []).forEach(item => {
        totalAllowances += parseFloat(item.amount || 0);
      });
    }
    
    // Calculate standard deductions
    let totalDeductions = 0;
    if (calculationOptions.includeDeductions) {
      // Standard deductions
      Object.entries(payrollData.deductions || {})
        .filter(([key]) => key !== 'custom')
        .forEach(([_, value]) => {
          totalDeductions += parseFloat(value || 0);
        });
      
      // Custom deductions
      (payrollData.deductions?.custom || []).forEach(item => {
        totalDeductions += parseFloat(item.amount || 0);
      });
    }

    // Calculate totals
    const totalEarnings = basicSalary + overtimeAmount + totalAllowances;
    const netSalary = totalEarnings - (calculationOptions.includeDeductions ? totalDeductions : 0);

    return {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100
    };
  };

  const handleInputChange = (field, value) => {
    const numericValue = parseFloat(value) || 0;
    const updatedPayroll = {
      ...editedPayroll,
      [field]: numericValue
    };
    const totals = calculateTotals(updatedPayroll);
    setEditedPayroll({
      ...updatedPayroll,
      totalEarnings: totals.totalEarnings,
      totalDeductions: totals.totalDeductions,
      netSalary: totals.netSalary
    });
  };

  const handleAllowanceChange = (key, value) => {
    const numericValue = parseFloat(value) || 0;
    const updatedPayroll = {
      ...editedPayroll,
      allowances: {
        ...editedPayroll.allowances,
        [key]: numericValue
      }
    };
    const totals = calculateTotals(updatedPayroll);
    setEditedPayroll({
      ...updatedPayroll,
      totalEarnings: totals.totalEarnings,
      totalDeductions: totals.totalDeductions,
      netSalary: totals.netSalary
    });
  };

  const handleDeductionChange = (key, value) => {
    const numericValue = parseFloat(value) || 0;
    const updatedPayroll = {
      ...editedPayroll,
      deductions: {
        ...editedPayroll.deductions,
        [key]: numericValue
      }
    };
    const totals = calculateTotals(updatedPayroll);
    setEditedPayroll({
      ...updatedPayroll,
      totalEarnings: totals.totalEarnings,
      totalDeductions: totals.totalDeductions,
      netSalary: totals.netSalary
    });
  };

  const handleOptionChange = (option) => {
    const newOptions = {
      ...calculationOptions,
      [option]: !calculationOptions[option]
    };
    setCalculationOptions(newOptions);
    
    // Recalculate totals with new options
    const totals = calculateTotals(editedPayroll);
    setEditedPayroll(prev => ({
      ...prev,
      totalEarnings: totals.totalEarnings,
      totalDeductions: totals.totalDeductions,
      netSalary: totals.netSalary
    }));
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

  // Add handlers for custom allowances and deductions
  const handleCustomAllowanceChange = (index, value) => {
    const numericValue = parseFloat(value) || 0;
    const updatedCustomAllowances = [...editedPayroll.allowances.custom];
    updatedCustomAllowances[index] = {
      ...updatedCustomAllowances[index],
      amount: numericValue
    };
    
    const updatedPayroll = {
      ...editedPayroll,
      allowances: {
        ...editedPayroll.allowances,
        custom: updatedCustomAllowances
      }
    };
    
    const totals = calculateTotals(updatedPayroll);
    setEditedPayroll({
      ...updatedPayroll,
      totalEarnings: totals.totalEarnings,
      totalDeductions: totals.totalDeductions,
      netSalary: totals.netSalary
    });
  };

  const handleCustomDeductionChange = (index, value) => {
    const numericValue = parseFloat(value) || 0;
    const updatedCustomDeductions = [...editedPayroll.deductions.custom];
    updatedCustomDeductions[index] = {
      ...updatedCustomDeductions[index],
      amount: numericValue
    };
    
    const updatedPayroll = {
      ...editedPayroll,
      deductions: {
        ...editedPayroll.deductions,
        custom: updatedCustomDeductions
      }
    };
    
    const totals = calculateTotals(updatedPayroll);
    setEditedPayroll({
      ...updatedPayroll,
      totalEarnings: totals.totalEarnings,
      totalDeductions: totals.totalDeductions,
      netSalary: totals.netSalary
    });
  };

  // Add a function to handle employee data from preview
  const getEmployeeInfo = () => {
    if (!payroll) return [];
    
    // Handle both preview data format and saved payroll format
    if (payroll.employeeDetails) {
      // Preview data format
      return [
        { label: 'Name', value: payroll.employeeDetails.name, readonly: true },
        { label: 'Employee ID', value: payroll.employeeDetails.employeeID, readonly: true },
        { label: 'Department', value: payroll.employeeDetails.department, readonly: true },
        { label: 'Position', value: payroll.employeeDetails.position, readonly: true }
      ];
    } else if (payroll.employeeId) {
      // Saved payroll format
      return [
        { label: 'Name', value: payroll.employeeId?.name, readonly: true },
        { label: 'Employee ID', value: payroll.employeeId?.employeeID, readonly: true },
        { label: 'Department', value: payroll.employeeId?.department, readonly: true },
        { label: 'Position', value: payroll.employeeId?.position, readonly: true }
      ];
    }
    
    return [];
  };

  const handleInitiatePayment = () => {
    setShowPaymentDialog(true);
  };

  const handlePaymentComplete = (paymentData) => {
    // Update the payroll data with new payment information
    setPayroll(prev => ({
      ...prev,
      paymentMethod: paymentData.paymentMethod,
      paymentStatus: paymentData.paymentStatus,
      paymentDate: paymentData.paymentDate,
      bankDetails: paymentData.bankDetails,
      transactionId: paymentData.transactionId,
      remarks: paymentData.remarks
    }));
    setShowPaymentDialog(false);
  };

  const handleEarningsEdit = () => {
    setEditingEarnings(true);
  };

  const handleEarningsSave = async () => {
    try {
      setLoading(true);
      const updatedPayroll = {
        ...payroll,
        basicSalary: earningsData.basicSalary,
        overtime: earningsData.overtime,
        allowances: earningsData.allowances,
        totalEarnings: calculateTotalEarnings(earningsData),
        netSalary: calculateNetSalary(earningsData, payroll.deductions)
      };

      const response = await apiClient.put(`/api/payroll/${id}`, updatedPayroll);
      setPayroll(response.data);
      setEditingEarnings(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error.response?.data?.message || 'Failed to update earnings');
    } finally {
      setLoading(false);
    }
  };

  const handleEarningsCancel = () => {
    setEditingEarnings(false);
    setEarningsData({
      basicSalary: payroll.basicSalary || 0,
      overtime: payroll.overtime || { hours: 0, rate: 0, amount: 0 },
      allowances: {
        housing: payroll.allowances?.housing || 0,
        transport: payroll.allowances?.transport || 0,
        meal: payroll.allowances?.meal || 0,
        other: payroll.allowances?.other || 0,
        custom: payroll.allowances?.custom || []
      },
      deductions: {
        tax: payroll.deductions?.tax || 0,
        insurance: payroll.deductions?.insurance || 0,
        other: payroll.deductions?.other || 0,
        custom: payroll.deductions?.custom || []
      }
    });
  };

  const calculateTotalEarnings = (data) => {
    const basicSalary = parseFloat(data.basicSalary) || 0;
    const overtimeAmount = parseFloat(data.overtime?.amount) || 0;
    
    // Calculate allowances
    const allowancesTotal = Object.entries(data.allowances)
      .filter(([key]) => key !== 'custom')
      .reduce((sum, [_, value]) => sum + (parseFloat(value) || 0), 0);

    return basicSalary + overtimeAmount + allowancesTotal;
  };

  const calculateNetSalary = (earningsData, deductions) => {
    const totalEarnings = calculateTotalEarnings(earningsData);
    
    // Calculate deductions
    const deductionsTotal = Object.entries(deductions)
      .filter(([key]) => key !== 'custom')
      .reduce((sum, [_, value]) => sum + (parseFloat(value) || 0), 0);

    return totalEarnings - deductionsTotal;
  };

  const handleOvertimeChange = (field, value) => {
    const updatedOvertime = {
      ...earningsData.overtime,
      [field]: parseFloat(value) || 0
    };
    
    // Calculate overtime amount if both hours and rate are set
    if (field === 'hours' || field === 'rate') {
      updatedOvertime.amount = 
        (updatedOvertime.hours || 0) * (updatedOvertime.rate || 0);
    }

    setEarningsData(prev => ({
      ...prev,
      overtime: updatedOvertime
    }));
  };

  const handleEarningsAllowanceChange = (key, value) => {
    setEarningsData(prev => ({
      ...prev,
      allowances: {
        ...prev.allowances,
        [key]: parseFloat(value) || 0
      }
    }));
  };

  // Add handler for deductions in earnings edit mode
  const handleEarningsDeductionChange = (key, value) => {
    setEarningsData(prev => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        [key]: parseFloat(value) || 0
      }
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography component="div" color="error">{error}</Typography>
        <Button onClick={() => isEmbedded ? onDelete() : navigate('/payroll')} sx={{ mt: 2 }}>
          Back to Payroll List
        </Button>
      </Box>
    );
  }

  if (!payroll) return null;

  const sections = [
    {
      title: 'Employee Information',
      icon: <Person />,
      content: getEmployeeInfo()
    },
    {
      title: 'Pay Period',
      icon: <CalendarToday />,
      content: [
        { 
          label: 'Start Date', 
          value: new Date(payroll.payPeriodStart).toLocaleDateString(),
          readonly: true
        },
        { 
          label: 'End Date', 
          value: new Date(payroll.payPeriodEnd).toLocaleDateString(),
          readonly: true
        }
      ]
    },
    {
      title: 'Earnings',
      icon: <Work />,
      content: [
        { 
          label: 'Basic Salary', 
          value: editingEarnings ? earningsData.basicSalary : payroll.basicSalary,
          type: 'number',
          editable: true,
          onChange: (value) => setEarningsData(prev => ({
            ...prev,
            basicSalary: parseFloat(value) || 0
          }))
        },
        { 
          label: 'Overtime Hours', 
          value: editingEarnings ? earningsData.overtime?.hours : payroll.overtime?.hours,
          type: 'number',
          editable: true,
          onChange: (value) => handleOvertimeChange('hours', value)
        },
        { 
          label: 'Overtime Rate', 
          value: editingEarnings ? earningsData.overtime?.rate : payroll.overtime?.rate,
          type: 'number',
          editable: true,
          onChange: (value) => handleOvertimeChange('rate', value)
        },
        { 
          label: 'Overtime Amount', 
          value: editingEarnings ? earningsData.overtime?.amount : payroll.overtime?.amount,
          type: 'number',
          readonly: true
        },
        // Allowances section
        { 
          label: 'Housing Allowance',
          value: editingEarnings ? earningsData.allowances.housing : payroll.allowances?.housing,
          type: 'number',
          editable: true,
          onChange: (value) => handleEarningsAllowanceChange('housing', value)
        },
        { 
          label: 'Transport Allowance',
          value: editingEarnings ? earningsData.allowances.transport : payroll.allowances?.transport,
          type: 'number',
          editable: true,
          onChange: (value) => handleEarningsAllowanceChange('transport', value)
        },
        { 
          label: 'Meal Allowance',
          value: editingEarnings ? earningsData.allowances.meal : payroll.allowances?.meal,
          type: 'number',
          editable: true,
          onChange: (value) => handleEarningsAllowanceChange('meal', value)
        },
        { 
          label: 'Other Allowance',
          value: editingEarnings ? earningsData.allowances.other : payroll.allowances?.other,
          type: 'number',
          editable: true,
          onChange: (value) => handleEarningsAllowanceChange('other', value)
        }
      ]
    },
    {
      title: 'Deductions',
      icon: <Receipt />,
      content: [
        {
          label: 'Tax',
          value: editingEarnings ? earningsData.deductions.tax : payroll.deductions?.tax,
          type: 'number',
          editable: true,
          onChange: (value) => handleEarningsDeductionChange('tax', value)
        },
        {
          label: 'Insurance',
          value: editingEarnings ? earningsData.deductions.insurance : payroll.deductions?.insurance,
          type: 'number',
          editable: true,
          onChange: (value) => handleEarningsDeductionChange('insurance', value)
        },
        {
          label: 'Other Deductions',
          value: editingEarnings ? earningsData.deductions.other : payroll.deductions?.other,
          type: 'number',
          editable: true,
          onChange: (value) => handleEarningsDeductionChange('other', value)
        }
      ]
    },
    {
      title: 'Payment Details',
      icon: <AccountBalance />,
      content: [
        { label: 'Payment Method', value: payroll.paymentMethod },
        { 
          label: 'Status', 
          value: (
            <Box>
              <Chip
                label={payroll.paymentStatus}
                size="small"
                sx={{
                  backgroundColor: getStatusColor(payroll.paymentStatus).main,
                  color: getStatusColor(payroll.paymentStatus).contrastText
                }}
              />
            </Box>
          )
        },
        ...(payroll.paymentDate ? [{ 
          label: 'Payment Date', 
          value: new Date(payroll.paymentDate).toLocaleDateString() 
        }] : []),
        ...(payroll.bankDetails ? [
          { label: 'Bank Name', value: payroll.bankDetails.bankName },
          { label: 'Account Number', value: payroll.bankDetails.accountNumber },
          { label: 'Account Name', value: payroll.bankDetails.accountName }
        ] : [])
      ]
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography component="div" variant="h4">
          Payroll Details
        </Typography>
        <Box>
          {editingEarnings ? (
            <>
              <Button
                variant="outlined"
                onClick={handleEarningsCancel}
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleEarningsSave}
                startIcon={<SaveIcon />}
              >
                Save Earnings
              </Button>
            </>
          ) : (
            <>
              {!isEmbedded && (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/payroll')}
                  sx={{ mr: 2 }}
                >
                  Back to List
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                startIcon={<DeleteIcon />}
                sx={{ mr: 2 }}
              >
                Delete
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleInitiatePayment}
                startIcon={<PaymentIcon />}
                sx={{ mr: 2 }}
              >
                Process Payment
              </Button>
              <Button
                variant="outlined"
                onClick={handleEarningsEdit}
                startIcon={<EditIcon />}
                sx={{ mr: 2 }}
              >
                Edit Earnings
              </Button>
              <Button
                variant="contained"
                onClick={handleEdit}
                startIcon={<EditIcon />}
              >
                Edit Payroll
              </Button>
            </>
          )}
        </Box>
      </Box>

      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {saveError}
        </Alert>
      )}

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Payroll updated successfully
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Calculation Options Card */}
        {editMode && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Calculation Options
                </Typography>
                <FormGroup row>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={calculationOptions.includeBasicSalary}
                            onChange={() => handleOptionChange('includeBasicSalary')}
                            color="primary"
                          />
                        }
                        label="Basic Salary"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={calculationOptions.includeOvertime}
                            onChange={() => handleOptionChange('includeOvertime')}
                            color="primary"
                          />
                        }
                        label="Overtime"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={calculationOptions.includeAllowances}
                            onChange={() => handleOptionChange('includeAllowances')}
                            color="primary"
                          />
                        }
                        label="Allowances"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={calculationOptions.includeDeductions}
                            onChange={() => handleOptionChange('includeDeductions')}
                            color="primary"
                          />
                        }
                        label="Deductions"
                      />
                    </Grid>
                  </Grid>
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>
        )}

        {sections.map((section, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {React.cloneElement(section.icon, { 
                    sx: { mr: 1, color: theme.palette.primary.main } 
                  })}
                  <Typography component="div" variant="h6">
                    {section.title}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {section.content.map((item, i) => (
                    <React.Fragment key={i}>
                      <Grid item xs={6}>
                        <Typography component="div" color="textSecondary">
                          {item.label}:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        {editingEarnings && item.editable ? (
                          <TextField
                            fullWidth
                            size="small"
                            type={item.type || 'text'}
                            value={item.value || ''}
                            onChange={(e) => item.onChange(e.target.value)}
                            InputProps={{
                              startAdornment: typeof item.value === 'number' ? <Typography component="div">₹</Typography> : null
                            }}
                          />
                        ) : (
                          <Typography component="div">
                            {typeof item.value === 'number' ? 
                              `₹${Number(item.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 
                              item.value}
                          </Typography>
                        )}
                        {item.subtext && (
                          <Typography component="div" variant="caption" color="textSecondary">
                            {item.subtext}
                          </Typography>
                        )}
                      </Grid>
                    </React.Fragment>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Summary Card with Live Preview */}
        <Grid item xs={12}>
          <Card sx={{ 
            backgroundColor: theme.palette.primary.main, 
            color: 'white',
            position: 'sticky',
            bottom: 16,
            zIndex: 1
          }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Typography component="div" variant="subtitle1">Total Earnings</Typography>
                  <Typography component="div" variant="h5">
                    ₹{Number(editingEarnings ? 
                      calculateTotalEarnings(earningsData) : 
                      payroll.totalEarnings
                    ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Typography>
                  {editingEarnings && (
                    <Typography component="div" variant="caption" sx={{ opacity: 0.8 }}>
                      Basic + Overtime + Allowances
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography component="div" variant="subtitle1">Total Deductions</Typography>
                  <Typography component="div" variant="h5">
                    ₹{Number(payroll.totalDeductions).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography component="div" variant="subtitle1">Net Salary</Typography>
                  <Typography component="div" variant="h5">
                    ₹{Number(editingEarnings ? 
                      calculateNetSalary(earningsData, payroll.deductions) : 
                      payroll.netSalary
                    ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Typography>
                  {editingEarnings && (
                    <Typography component="div" variant="caption" sx={{ opacity: 0.8 }}>
                      Total Earnings - Total Deductions
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography component="div">
            Are you sure you want to delete this payroll record? This action cannot be undone.
          </Typography>
          {payroll.paymentStatus === 'Paid' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Warning: This payroll has already been marked as paid.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Add PaymentDialog */}
      <PaymentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        payrollId={id}
        onPaymentComplete={handlePaymentComplete}
      />
    </Box>
  );
};

export default PayrollDetails; 