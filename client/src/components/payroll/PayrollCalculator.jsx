import React, { useState, useEffect, useMemo } from 'react';
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
  CircularProgress,
  Fade,
  Grow,
  Paper,
  Chip,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
  History as HistoryIcon,
  CloudUpload as CloudUploadIcon,
  GroupAdd as GroupAddIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  MoneyOff as MoneyOffIcon,
  Print as PrintIcon,
  AccessTime as TimeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  MonetizationOn as MonetizationOnIcon,
  PriceCheck as PriceCheckIcon
} from '@mui/icons-material';
import apiClient from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import AttendanceTracker from './AttendanceTracker';

// Add date format helper function at the top level
const formatDate = (date) => {
  if (!date) return '';

  // Handle both string and Date objects
  const d = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(d.getTime())) return '';

  // Format with leading zeros
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

const PayrollCalculator = ({ onPayrollCreated }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payPeriod, setPayPeriod] = useState({
    startDate: null,
    endDate: null
  });
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

  // Add new state to track if dates are locked
  const [datesLocked, setDatesLocked] = useState(false);

  // Add new state variables for calculation mode
  const [calculationMode, setCalculationMode] = useState('automatic'); // 'automatic' or 'manual'
  const [showAttendance, setShowAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);

  // Add new state for manual inputs
  const [manualInputs, setManualInputs] = useState({
    workingDays: 0,
    overtimeHours: 0,
    leaves: 0,
    halfDays: 0
  });

  // Add state for manual editing of preview values
  const [editingPreview, setEditingPreview] = useState(false);
  const [manualPreviewValues, setManualPreviewValues] = useState({
    basicSalary: 0,
    overtime: { hours: 0, rate: 0, amount: 0 },
    allowances: {
      housing: 0,
      transport: 0,
      meal: 0
    },
    deductions: {
      tax: 0,
      insurance: 0
    },
    customAllowances: [],
    customDeductions: []
  });

  // Add new state to force re-render
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Update handleInputChange to lock dates after they're set
  const handleInputChange = async (field, value) => {
    // Prevent changes to date fields if dates are locked
    if ((field === 'payPeriodStart' || field === 'payPeriodEnd') && datesLocked) {
      setError('Dates are locked. Please click Reset to change pay period dates.');
      return;
    }

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

    // Lock dates after both start and end dates are set
    if ((field === 'payPeriodStart' || field === 'payPeriodEnd') && !datesLocked) {
      const startDate = field === 'payPeriodStart' ? value : formData.payPeriodStart;
      const endDate = field === 'payPeriodEnd' ? value : formData.payPeriodEnd;

      if (startDate && endDate) {
        // Validate date range
        if (new Date(endDate) < new Date(startDate)) {
          setError('End date cannot be before start date');
          return;
        }

        // Lock dates after they're both valid
        setDatesLocked(true);
        // Show a notification that dates are locked
        setSuccess('Pay period dates are now locked. Click Reset to change dates.');
        setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
      }
    }

    // If employee is selected and dates are changed, check for overlapping periods
    if ((field === 'payPeriodStart' || field === 'payPeriodEnd') && formData.employeeId) {
      try {
        const startDate = field === 'payPeriodStart' ? value : formData.payPeriodStart;
        const endDate = field === 'payPeriodEnd' ? value : formData.payPeriodEnd;

        if (startDate && endDate) {
          // Validate date range
          if (new Date(endDate) < new Date(startDate)) {
            setError('End date cannot be before start date');
            return;
          }

          // Check for overlapping periods
          const response = await apiClient.post('/api/payroll/check-overlap', {
            employeeId: formData.employeeId,
            payPeriodStart: startDate,
            payPeriodEnd: endDate
          });

          if (response.data.overlapping) {
            const start = formatDate(response.data.overlappingPeriod.start);
            const end = formatDate(response.data.overlappingPeriod.end);
            setError(`Overlapping pay period exists from ${start} to ${end}. Please select a different period.`);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking overlapping periods:', error);
        const errorMessage = error.response?.data?.message || 'Error checking pay period overlap. Please try again.';
        setError(errorMessage);
        return;
      }
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

  // Function to calculate pro-rated salary
  const calculateProRatedSalary = (salary, startDate, endDate) => {
    if (!startDate || !endDate || !salary) return 0;

      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Reset hours to ensure we're comparing just the dates
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
    // Function to get days in a month
    const getDaysInMonth = (year, month) => {
      return new Date(year, month + 1, 0).getDate();
    };

    // Special case: If start and end are in the same month
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      const daysInMonth = getDaysInMonth(start.getFullYear(), start.getMonth());
      const daysInPeriod = end.getDate() - start.getDate() + 1; // Include both start and end days
      const dailyRate = salary / daysInMonth;

      // Only return full salary if it's the entire month
      if (start.getDate() === 1 && end.getDate() === daysInMonth) {
        return salary;
      }

      // Otherwise calculate pro-rated amount for the days in the period
      return Math.round((dailyRate * daysInPeriod) * 100) / 100;
    }

    // For periods spanning multiple months
    let totalSalary = 0;
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);

      if (currentDate.getMonth() === start.getMonth() && currentDate.getFullYear() === start.getFullYear()) {
        // First month - always calculate partial month
        const daysToCount = daysInMonth - start.getDate() + 1;
        const dailyRate = salary / daysInMonth;
        totalSalary += dailyRate * daysToCount;
      } else if (currentDate.getMonth() === end.getMonth() && currentDate.getFullYear() === end.getFullYear()) {
        // Last month - always calculate partial month
        const daysToCount = end.getDate();
        const dailyRate = salary / daysInMonth;
        totalSalary += dailyRate * daysToCount;
      } else {
        // Full month in between
        totalSalary += salary;
      }

      // Move to first day of next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1);
    }

    // Round to 2 decimal places
    return Math.round(totalSalary * 100) / 100;
  };

  const calculateLivePreview = async (employee, startDate, endDate) => {
    if (!employee) return;

    try {
      // Get payroll settings
      const settings = payrollSettings || await fetchPayrollSettings();

      // Initialize variables
      let finalBasicSalary = 0;
      let overtimeAmount = 0;
      let overtimeHours = 0;
      let overtimeRate = 0;

      // Function to get days in a month
      const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      };

      // Calculate days in the period
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) {
        // Check if start and end are in the same month
        const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

        // Get total days in the month(s)
        const totalDaysInStartMonth = getDaysInMonth(start);
        const totalDaysInEndMonth = sameMonth ? totalDaysInStartMonth : getDaysInMonth(end);

        // Calculate total days in the pay period
        let totalDaysInPeriod;
        if (sameMonth) {
          totalDaysInPeriod = end.getDate() - start.getDate() + 1; // Include both start and end days
        } else {
          // For periods spanning multiple months
          const daysInStartMonth = totalDaysInStartMonth - start.getDate() + 1;
          const daysInEndMonth = end.getDate();

          // Add days from any full months in between
          let fullMonthDays = 0;
          let currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1); // First day of next month

          while (currentDate.getFullYear() < end.getFullYear() ||
            (currentDate.getFullYear() === end.getFullYear() && currentDate.getMonth() < end.getMonth())) {
            fullMonthDays += getDaysInMonth(currentDate);
            currentDate.setMonth(currentDate.getMonth() + 1);
          }

          totalDaysInPeriod = daysInStartMonth + fullMonthDays + daysInEndMonth;
        }

        const monthlyBaseSalary = employee.salary || 0;

        if (calculationMode === 'automatic' && attendanceData) {
          // Calculate based on attendance records
          const presentDays = attendanceData.filter(a => a.status === 'Present').length;
          const halfDays = attendanceData.filter(a => a.status === 'Half Day').length;

          // Calculate effective working days
          const effectiveWorkingDays = presentDays + (halfDays * 0.5);
      
      // Calculate pro-rated salary
          if (sameMonth) {
            finalBasicSalary = (monthlyBaseSalary / totalDaysInStartMonth) * effectiveWorkingDays;
          } else {
            // For multi-month periods, calculate based on the total days in the period
            finalBasicSalary = (monthlyBaseSalary * effectiveWorkingDays) / totalDaysInPeriod;
          }

          // Get overtime from attendance
          overtimeHours = attendanceData.reduce((total, record) => total + (record.overtime || 0), 0);
        } else {
          // Manual mode calculations
          const workingDays = manualInputs.workingDays || 0;
          const halfDays = manualInputs.halfDays || 0;

          // Calculate effective working days
          const effectiveWorkingDays = workingDays + (halfDays * 0.5);

          // Check if this is a full month period (from 1st to last day of month)
          const isFullMonth = sameMonth && start.getDate() === 1 && end.getDate() === totalDaysInStartMonth;

          // Special case: If the pay period is a full month and working days equals total days in month
          if (isFullMonth && workingDays === totalDaysInStartMonth) {
            finalBasicSalary = monthlyBaseSalary;
          }
          // Special case: If the pay period spans multiple months and working days equals total days in period
          else if (!sameMonth && workingDays === totalDaysInPeriod) {
            // Calculate the proportion of the monthly salary for the total period
            const daysInStartMonth = totalDaysInStartMonth - start.getDate() + 1;
            const daysInEndMonth = end.getDate();

            const startMonthSalary = (monthlyBaseSalary / totalDaysInStartMonth) * daysInStartMonth;
            const endMonthSalary = (monthlyBaseSalary / totalDaysInEndMonth) * daysInEndMonth;

            // Add salary for any full months in between
            let fullMonthsSalary = 0;
            let currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1); // First day of next month

            while (currentDate.getFullYear() < end.getFullYear() ||
              (currentDate.getFullYear() === end.getFullYear() && currentDate.getMonth() < end.getMonth())) {
              fullMonthsSalary += monthlyBaseSalary;
              currentDate.setMonth(currentDate.getMonth() + 1);
            }

            finalBasicSalary = startMonthSalary + fullMonthsSalary + endMonthSalary;
          }
          // For full month with manual working days
          else if (isFullMonth) {
            // For a full month, simply calculate based on the working days relative to total days in month
            const dailyRate = monthlyBaseSalary / totalDaysInStartMonth;
            finalBasicSalary = dailyRate * effectiveWorkingDays;

            // Round to 2 decimal places for consistency
            finalBasicSalary = Math.round(finalBasicSalary * 100) / 100;
          }
          // Regular case: Pro-rate based on working days vs total days in period
          else {
            if (sameMonth) {
              // For same month, calculate based on the manually entered working days
              // Use the total days in the month as the denominator, not just the days in the period
              const dailyRate = monthlyBaseSalary / totalDaysInStartMonth;
              finalBasicSalary = dailyRate * effectiveWorkingDays;

              // Round to 2 decimal places for consistency
              finalBasicSalary = Math.round(finalBasicSalary * 100) / 100;
            } else {
              // For multi-month periods, calculate the daily rate based on the monthly salary
              // and multiply by the effective working days
              const dailyRate = monthlyBaseSalary / totalDaysInStartMonth; // Use start month for consistency
              finalBasicSalary = dailyRate * effectiveWorkingDays;

              // Round to 2 decimal places for consistency
              finalBasicSalary = Math.round(finalBasicSalary * 100) / 100;
            }
          }

          // Get overtime from manual input
          overtimeHours = manualInputs.overtimeHours || 0;
        }

        // Calculate overtime rate and amount
        // Overtime rate = (Monthly Base / (Total Days × 8 hours)) × 1.5
        // Use the days in the month of the start date for consistency
        overtimeRate = (employee.salary / (totalDaysInStartMonth * 8)) * 1.5;
        overtimeAmount = overtimeHours * overtimeRate;

        // Calculate allowances based on monthly base salary (not pro-rated)
      const allowances = {
          housing: settings.allowances?.housing?.type === 'percentage'
            ? (employee.salary * (settings.allowances.housing.value / 100))
            : (settings.allowances?.housing?.value || 0),
          transport: settings.allowances?.transport?.value || 0,
          meal: settings.allowances?.meal?.value || 0,
          other: settings.allowances?.other?.value || 0
        };

        // Calculate deductions based on pro-rated salary
      const deductions = {
          tax: calculationOptions.taxCalculation
            ? calculateDeduction(settings.deductions?.tax, finalBasicSalary)
            : 0,
          insurance: calculateDeduction(settings.deductions?.insurance, finalBasicSalary),
          other: calculateDeduction(settings.deductions?.other, finalBasicSalary)
        };

        // Calculate totals
        const totalAllowances = Object.values(allowances).reduce((sum, value) => sum + value, 0) +
          customAllowances.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        const totalDeductions = Object.values(deductions).reduce((sum, value) => sum + value, 0) +
          customDeductions.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        const totalEarnings = finalBasicSalary + overtimeAmount + totalAllowances;
        const netSalary = totalEarnings - totalDeductions;

        // Update live preview with rounded values
      setLivePreview({
          basicSalary: Math.round(finalBasicSalary * 100) / 100,
          overtime: {
            hours: overtimeHours,
            rate: Math.round(overtimeRate * 100) / 100,
            amount: Math.round(overtimeAmount * 100) / 100
          },
          allowances: {
            housing: Math.round(allowances.housing * 100) / 100,
            transport: Math.round(allowances.transport * 100) / 100,
            meal: Math.round(allowances.meal * 100) / 100,
            other: Math.round(allowances.other * 100) / 100
          },
          deductions: {
            tax: Math.round(deductions.tax * 100) / 100,
            insurance: Math.round(deductions.insurance * 100) / 100,
            other: Math.round(deductions.other * 100) / 100
          },
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          netSalary: Math.round(netSalary * 100) / 100,
        employeeDetails: {
          name: employee.name,
          employeeID: employee.employeeID,
          department: employee.department,
          position: employee.position
        }
      });
      }
    } catch (error) {
      console.error('Error calculating live preview:', error);
      setError('Error calculating salary preview');
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
    payrollSettings,
    manualInputs,
    calculationMode,
    attendanceData
  ]);

  // Helper function to calculate allowance
  const calculateAllowance = (allowance, basicSalary) => {
    if (!allowance || typeof allowance !== 'object') return 0;
    
    try {
      if (allowance.type === 'percentage') {
        // For percentage-based allowances, calculate based on the monthly base salary
        return (basicSalary * (parseFloat(allowance.value) || 0)) / 100;
      } else {
        // For fixed allowances, return the fixed value
        return parseFloat(allowance.value) || 0;
      }
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

  // Add a print function to handle printing payroll details
  const handlePrintPayroll = () => {
    try {
      // Get the current live preview data
      const data = livePreview;

      if (!data || !data.employeeDetails) {
        setError('No preview data available to print.');
        return;
      }

      // Create a new window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError('Popup was blocked. Please allow popups and try again.');
        return;
      }

      const printDate = formatDate(new Date());

      // Create the print content with proper styling and data handling
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Textlaire - Payroll Details</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media print {
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 20px;
              }
              .container {
                max-width: 100%;
                margin: 0 auto;
              }
              .company-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #1976d2;
                margin: 0;
              }
              .document-title {
                font-size: 18px;
                color: #666;
                margin: 5px 0 0 0;
              }
              .section {
                margin-bottom: 20px;
                page-break-inside: avoid;
              }
              .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
              }
              .label {
                font-weight: bold;
                color: #333;
              }
              .value {
                margin-bottom: 5px;
              }
              .table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
              }
              .table th, .table td {
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #000;
              }
              .table th {
                background-color: #f0f0f0;
              }
              .total-row {
                font-weight: bold;
                border-top: 2px solid #000;
              }
              @page {
                size: A4;
                margin: 1.5cm;
              }
              .print-footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="company-header">
              <h1 class="company-name">TEXTLAIRE</h1>
              <p class="document-title">Payroll Statement</p>
              <p style="margin: 5px 0;">Generated on ${printDate}</p>
            </div>

            <div class="section">
              <h2>Employee Information</h2>
              <div class="grid">
                <div>
                  <div class="label">Employee Name</div>
                  <div class="value">${data.employeeDetails.name || 'N/A'}</div>
                </div>
                <div>
                  <div class="label">Employee ID</div>
                  <div class="value">${data.employeeDetails.employeeID || 'N/A'}</div>
                </div>
                <div>
                  <div class="label">Department</div>
                  <div class="value">${data.employeeDetails.department || 'N/A'}</div>
                </div>
                <div>
                  <div class="label">Designation</div>
                  <div class="value">${data.employeeDetails.position || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Pay Period Details</h2>
              <div class="grid">
                <div>
                  <div class="label">Start Date</div>
                  <div class="value">${formatDate(formData.payPeriodStart)}</div>
                </div>
                <div>
                  <div class="label">End Date</div>
                  <div class="value">${formatDate(formData.payPeriodEnd)}</div>
                </div>
                <div>
                  <div class="label">Working Days</div>
                  <div class="value">${manualInputs.workingDays || 'N/A'}</div>
                </div>
                <div>
                  <div class="label">Overtime Hours</div>
                  <div class="value">${data.overtime?.hours || '0'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Earnings</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th style="text-align: right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Basic Salary</td>
                    <td style="text-align: right">${data.basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  ${Object.entries(data.allowances || {}).map(([key, value]) => `
                    <tr>
                      <td>${key.charAt(0).toUpperCase() + key.slice(1)}</td>
                      <td style="text-align: right">${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                  ${data.overtime?.amount ? `
                    <tr>
                      <td>Overtime</td>
                      <td style="text-align: right">${data.overtime.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ` : ''}
                  <tr class="total-row">
                    <td>Total Earnings</td>
                    <td style="text-align: right">${data.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Deductions</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th style="text-align: right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(data.deductions || {}).map(([key, value]) => `
                    <tr>
                      <td>${key.charAt(0).toUpperCase() + key.slice(1)}</td>
                      <td style="text-align: right">${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td>Total Deductions</td>
                    <td style="text-align: right">${data.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Net Salary</h2>
              <table class="table">
                <tbody>
                  <tr class="total-row">
                    <td>Net Payable Amount</td>
                    <td style="text-align: right">${data.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="print-footer">
              <p>This is a computer-generated document. No signature is required.</p>
              <p>For any queries, please contact the HR department.</p>
            </div>
          </div>

          <script>
            document.addEventListener('DOMContentLoaded', function() {
              // Wait for fonts and images to load
              window.onload = function() {
                // Small delay to ensure styles are applied
                setTimeout(function() {
                  window.print();
                  // Close the window after printing
                  setTimeout(function() {
                    window.close();
                  }, 500);
                }, 500);
              };
            });
          </script>
        </body>
        </html>
      `;

      // Write the content and close the document
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();

    } catch (error) {
      console.error('Error printing payroll:', error);
      setError('Failed to print payroll details. Please try again.');
    }
  };

  // Update the handleViewDetails function to include printing option
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

  // Add the missing handleReset function
  const handleReset = () => {
    // Reset form data
    setFormData({
      employeeId: '',
      payPeriodStart: null,
      payPeriodEnd: null
    });

    // Reset selected employee
    setSelectedEmployee('');
    setSelectedEmployeeDetails(null);

    // Reset custom items
    setCustomAllowances([]);
    setCustomDeductions([]);

    // Reset calculation options to defaults
    setCalculationOptions({
      includeOvertime: true,
      includeBonuses: true,
      includeLeaveDeductions: true,
      taxCalculation: true
    });

    // Reset preview data
    setLivePreview({
      basicSalary: 0,
      overtime: { hours: 0, rate: 0, amount: 0 },
      allowances: {},
      deductions: {},
      totalEarnings: 0,
      totalDeductions: 0,
      netSalary: 0
    });

    // Reset calculated payroll
    setCalculatedPayroll(null);

    // Clear any error or success messages
    setError('');
    setSuccess('');

    // Unlock dates
    setDatesLocked(false);
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

  // Memoized calculations for better performance
  const summaryData = useMemo(() => {
    if (!previewData) return null;
    return {
      totalAllowances: Object.values(previewData.allowances || {})
        .filter(value => typeof value === 'number')
        .reduce((sum, value) => sum + value, 0),
      totalDeductions: Object.values(previewData.deductions || {})
        .filter(value => typeof value === 'number')
        .reduce((sum, value) => sum + value, 0),
      overtimePercentage: previewData.overtime?.amount
        ? (previewData.overtime.amount / previewData.basicSalary * 100).toFixed(1)
        : 0
    };
  }, [previewData]);

  // Custom styled components
  const StyledCard = ({ children, elevation = 3, ...props }) => (
    <Grow in timeout={500}>
      <Card
        elevation={elevation}
        sx={{
          borderRadius: 2,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme => theme.shadows[8]
          },
          ...props.sx
        }}
        {...props}
      >
        {children}
      </Card>
    </Grow>
  );

  const SummaryChip = ({ icon: Icon, label, value, color = 'primary' }) => (
    <Chip
      icon={<Icon />}
      label={`${label}: ${value}`}
      color={color}
      sx={{
        p: 2,
        height: 'auto',
        '& .MuiChip-label': { fontSize: '1rem' },
        '& .MuiChip-icon': { fontSize: '1.5rem' }
      }}
    />
  );

  // Enhanced preview section
  const renderPreview = () => (
    <StyledCard elevation={4} key={`preview-${refreshKey}`}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <VisibilityIcon color="primary" />
          Live Payroll Preview
        </Typography>

        {livePreview ? (
          <Fade in={true} timeout={800}>
            <Box>
              {/* Controls for the preview */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                {previewData.employeeDetails && (
                  <Box sx={{ display: 'flex' }}>
                    <Tooltip title="Refresh Preview">
                      <IconButton
                        color="primary"
                        onClick={handleRefreshPreview}
                        sx={{ mr: 1 }}
                        disabled={calculating || editingPreview}
                      >
                        {calculating ? <CircularProgress size={24} /> : <RefreshIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print Payroll">
                      <IconButton
                        color="primary"
                        onClick={handlePrintPayroll}
                        disabled={editingPreview}
                      >
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              {/* Summary Chips */}
              <Stack direction="row"
                spacing={2}
                sx={{ flexWrap: 'wrap', mb: 3 }}
                justifyContent="space-between">
                <SummaryChip
                  icon={MonetizationOnIcon}
                  label="Basic Salary"
                  value={formatCurrency(previewData.basicSalary)}
                  color="primary"
                />
                <SummaryChip
                  icon={TrendingUpIcon}
                  label="Total Earnings"
                  value={formatCurrency(previewData.totalEarnings)}
                  color="success"
                />
                <SummaryChip
                  icon={MoneyOffIcon}
                  label="Total Deductions"
                  value={formatCurrency(previewData.totalDeductions)}
                  color="error"
                />
                <SummaryChip
                  icon={PriceCheckIcon}
                  label="Net Salary"
                  value={formatCurrency(previewData.netSalary)}
                  color="success"
                />
              </Stack>

              {/* Pro-rated Details */}
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Pro-rated Calculation
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      Monthly Base: {formatCurrency(selectedEmployeeDetails?.salary)}
                    </Typography>
                    <Typography variant="body2">
                      Period: {formatDate(formData.payPeriodStart)} to {formatDate(formData.payPeriodEnd)}
                    </Typography>
                    {calculationMode === 'manual' && (
                      <Typography variant="body2">
                        Working Days: {manualInputs.workingDays} {manualInputs.halfDays > 0 ? `+ ${manualInputs.halfDays} half days` : ''}
                      </Typography>
                    )}
                    <Typography variant="body2" color="primary">
                      Pro-rated Amount: {formatCurrency(previewData.basicSalary)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Salary Breakdown with animations */}
              <Grid container spacing={3}>
                {/* Earnings Section */}
                <Grid item xs={12} md={6}>
                  <StyledCard elevation={2} sx={{ bgcolor: 'success.light' }}>
                    <CardContent>
                      <Typography variant="subtitle1" color="white" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUpIcon sx={{ mr: 1 }} />
                          Earnings Breakdown
                        </Box>
                      </Typography>
                      <Stack spacing={2}>
                        {/* Pro-rated Base */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography color="white">Pro-rated Base</Typography>
                          <Typography color="white">{formatCurrency(previewData.basicSalary)}</Typography>
                        </Box>

                        {/* Overtime */}
                        {previewData.overtime?.amount > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color="white">
                              Overtime ({previewData.overtime.hours}hrs @ ₹{previewData.overtime.rate.toFixed(2)}/hr)
                            </Typography>
                            <Typography color="white">{formatCurrency(previewData.overtime.amount)}</Typography>
                          </Box>
                        )}

                        {/* Standard Allowances */}
                        {Object.entries(previewData.allowances || {})
                          .filter(([key, value]) => key !== 'custom' && value > 0)
                          .map(([key, value]) => (
                            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography color="white">{key.charAt(0).toUpperCase() + key.slice(1)}</Typography>
                              <Typography color="white">{formatCurrency(value)}</Typography>
                            </Box>
                          ))
                        }

                        {/* Custom Allowances */}
                        {customAllowances.map((allowance, index) => (
                          <Box key={`custom-allowance-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color="white">{allowance.name}</Typography>
                            <Typography color="white">{formatCurrency(parseFloat(allowance.amount))}</Typography>
                          </Box>
                        ))}

                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography color="white" fontWeight="bold">Total Earnings</Typography>
                          <Typography color="white" fontWeight="bold">{formatCurrency(previewData.totalEarnings)}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </StyledCard>
                </Grid>

                {/* Deductions Section */}
                <Grid item xs={12} md={6}>
                  <StyledCard elevation={2} sx={{ bgcolor: 'error.light' }}>
                    <CardContent>
                      <Typography variant="subtitle1" color="white" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MoneyOffIcon sx={{ mr: 1 }} />
                          Deductions Breakdown
                        </Box>
                      </Typography>
                      <Stack spacing={2}>
                        {/* Standard Deductions */}
                        {Object.entries(previewData.deductions || {})
                          .filter(([key, value]) => key !== 'custom' && typeof value === 'number')
                          .map(([key, value]) => (
                            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography color="white">{key.charAt(0).toUpperCase() + key.slice(1)}</Typography>
                              <Typography color="white">-{value.toFixed(2)}</Typography>
                            </Box>
                          ))
                        }

                        {/* Custom Deductions */}
                        {customDeductions.map((deduction, index) => (
                          <Box key={`custom-deduction-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color="white">{deduction.name}</Typography>
                            <Typography color="white">-{parseFloat(deduction.amount).toFixed(2)}</Typography>
                          </Box>
                        ))}

                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography color="white" fontWeight="bold">Total Deductions</Typography>
                          <Typography color="white" fontWeight="bold">-{previewData.totalDeductions.toFixed(2)}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </StyledCard>
                </Grid>

                {/* Net Salary Section */}
                <Grid item xs={12}>
                  <StyledCard elevation={4} sx={{ bgcolor: 'primary.main' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6" color="white">Net Salary</Typography>
                          <Typography variant="caption" color="white">
                            Total Earnings - Total Deductions
                          </Typography>
                        </Box>
                        <Typography variant="h4" color="white">
                          {formatCurrency(previewData.netSalary)}
                        </Typography>
                      </Box>
                      {/* Progress bar showing earnings vs deductions */}
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress
                          variant="buffer"
                          value={(previewData.totalEarnings / (previewData.totalEarnings + previewData.totalDeductions)) * 100}
                          valueBuffer={100}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                        <Typography variant="caption" color="white" sx={{ mt: 1, display: 'block' }}>
                          Earnings: {formatCurrency(previewData.totalEarnings)} | Deductions: {formatCurrency(previewData.totalDeductions)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary">
              Select an employee and pay period to see live preview
            </Typography>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );

  // Add handler for attendance updates
  const handleAttendanceUpdate = () => {
    if (selectedEmployeeDetails && formData.payPeriodStart && formData.payPeriodEnd) {
      calculateLivePreview(selectedEmployeeDetails, formData.payPeriodStart, formData.payPeriodEnd);
    }
  };

  // Add handler for refreshing the preview
  const handleRefreshPreview = () => {
    if (selectedEmployeeDetails && formData.payPeriodStart && formData.payPeriodEnd) {
      // Show a brief loading indicator
      setCalculating(true);

      // Use setTimeout to create a visual indication of refreshing
      setTimeout(() => {
        calculateLivePreview(selectedEmployeeDetails, formData.payPeriodStart, formData.payPeriodEnd);
        setCalculating(false);

        // Show a brief success message
        setSuccess('Preview refreshed successfully');
        setTimeout(() => setSuccess(''), 2000); // Clear success message after 2 seconds
      }, 300);
    } else {
      setError('Please select an employee and pay period first');
      setTimeout(() => setError(''), 3000); // Clear error message after 3 seconds
    }
  };

  // Add handler for manual input changes
  const handleManualInputChange = (field, value) => {
    const newValue = parseFloat(value) || 0;
    setManualInputs(prev => {
      const updatedInputs = {
        ...prev,
        [field]: newValue
      };

      // Trigger recalculation immediately if we have the necessary data
      if (selectedEmployeeDetails && formData.payPeriodStart && formData.payPeriodEnd) {
        // Use setTimeout to ensure state update completes first
        setTimeout(() => {
          calculateLivePreview(selectedEmployeeDetails, formData.payPeriodStart, formData.payPeriodEnd);
        }, 0);
      }

      return updatedInputs;
    });
  };

  // Initialize manual preview values when live preview updates
  useEffect(() => {
    if (previewData) {
      setManualPreviewValues({
        basicSalary: previewData.basicSalary || 0,
        overtime: {
          hours: previewData.overtime?.hours || 0,
          rate: previewData.overtime?.rate || 0,
          amount: previewData.overtime?.amount || 0
        },
        allowances: {
          housing: previewData.allowances?.housing || 0,
          transport: previewData.allowances?.transport || 0,
          meal: previewData.allowances?.meal || 0,
          other: previewData.allowances?.other || 0
        },
        deductions: {
          tax: previewData.deductions?.tax || 0,
          insurance: previewData.deductions?.insurance || 0,
          other: previewData.deductions?.other || 0
        },
        customAllowances: customAllowances.map(item => ({ ...item })),
        customDeductions: customDeductions.map(item => ({ ...item }))
      });
    }
  }, [previewData, customAllowances, customDeductions]);

  // Function to handle manual changes to preview values
  const handleManualPreviewChange = (category, field, value) => {
    const numValue = parseFloat(value) || 0;

    setManualPreviewValues(prev => {
      const updated = { ...prev };

      if (category === 'basic') {
        updated.basicSalary = numValue;
      }
      else if (category === 'overtime') {
        if (field === 'hours') {
          updated.overtime.hours = numValue;
          // Update amount based on hours and rate
          updated.overtime.amount = numValue * updated.overtime.rate;
        } else if (field === 'rate') {
          updated.overtime.rate = numValue;
          // Update amount based on hours and rate
          updated.overtime.amount = updated.overtime.hours * numValue;
        } else {
          updated.overtime[field] = numValue;
        }
      }
      else if (category === 'allowances') {
        updated.allowances[field] = numValue;
      }
      else if (category === 'deductions') {
        updated.deductions[field] = numValue;
        console.log(`Updated ${field} deduction to:`, numValue);
      }
      else if (category === 'customAllowances') {
        updated.customAllowances[field].amount = value;
      }
      else if (category === 'customDeductions') {
        updated.customDeductions[field].amount = value;
      }

      return updated;
    });
  };

  // Function to apply manual preview values
  const applyManualPreviewValues = () => {
    try {
      // Ensure all values are valid numbers
      const validDeductions = {};
      Object.entries(manualPreviewValues.deductions).forEach(([key, value]) => {
        validDeductions[key] = parseFloat(value) || 0;
      });

      const validAllowances = {};
      Object.entries(manualPreviewValues.allowances).forEach(([key, value]) => {
        validAllowances[key] = parseFloat(value) || 0;
      });

      // Calculate totals based on manual values
      const totalAllowances = Object.values(validAllowances).reduce((sum, value) => sum + value, 0) +
        manualPreviewValues.customAllowances.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

      const totalDeductions = Object.values(validDeductions).reduce((sum, value) => sum + value, 0) +
        manualPreviewValues.customDeductions.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

      const totalEarnings = parseFloat(manualPreviewValues.basicSalary) +
        parseFloat(manualPreviewValues.overtime.amount) +
        totalAllowances;
      const netSalary = totalEarnings - totalDeductions;

      console.log("Calculated values before applying:", {
        allowances: validAllowances,
        totalAllowances: totalAllowances,
        deductions: validDeductions,
        totalDeductions: totalDeductions,
        totalEarnings: totalEarnings,
        netSalary: netSalary
      });

      // Apply the manual values to the live preview
      setLivePreview(prevPreview => {
        // Create deep copies to ensure the values are properly updated
        const updatedPreview = {
          ...prevPreview,
          basicSalary: parseFloat(manualPreviewValues.basicSalary) || 0,
          overtime: {
            hours: parseFloat(manualPreviewValues.overtime.hours) || 0,
            rate: parseFloat(manualPreviewValues.overtime.rate) || 0,
            amount: parseFloat(manualPreviewValues.overtime.amount) || 0
          },
          allowances: { ...validAllowances },
          deductions: { ...validDeductions },
          totalEarnings: totalEarnings,
          totalDeductions: totalDeductions,
          netSalary: netSalary
        };

        // Force trigger a re-render by changing the reference
        setTimeout(() => {
          // This forces the preview to update with the new values
          setRefreshKey(prev => prev + 1);
        }, 100);

        return updatedPreview;
      });

      // Update custom items with the manual values
      setCustomAllowances([...manualPreviewValues.customAllowances]);
      setCustomDeductions([...manualPreviewValues.customDeductions]);

      // Exit editing mode
      setEditingPreview(false);

      // Show success message
      setSuccess('Manual values applied successfully');
      setTimeout(() => setSuccess(''), 2000); // Clear success message after 2 seconds
    } catch (error) {
      console.error("Error applying manual adjustments:", error);
      setError("Failed to apply manual adjustments. Please check your values.");
    }
  };

  // Modify the render function to include the new UI elements
  const renderCalculationMode = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Calculation Mode</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={calculationMode === 'automatic'}
                  onChange={(e) => {
                    const newMode = e.target.checked ? 'automatic' : 'manual';
                    setCalculationMode(newMode);

                    // Trigger recalculation immediately if we have the necessary data
                    if (selectedEmployeeDetails && formData.payPeriodStart && formData.payPeriodEnd) {
                      // Use setTimeout to ensure state update completes first
                      setTimeout(() => {
                        calculateLivePreview(selectedEmployeeDetails, formData.payPeriodStart, formData.payPeriodEnd);
                      }, 0);
                    }
                  }}
                />
              }
              label="Automatic Calculation (Based on Attendance)"
            />
          </Grid>
          {calculationMode === 'automatic' ? (
            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => setShowAttendance(!showAttendance)}
                startIcon={<TimeIcon />}
              >
                {showAttendance ? 'Hide Attendance' : 'Show Attendance'}
              </Button>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Working Days"
                    type="number"
                    value={manualInputs.workingDays}
                    onChange={(e) => handleManualInputChange('workingDays', e.target.value)}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Overtime Hours"
                    type="number"
                    value={manualInputs.overtimeHours}
                    onChange={(e) => handleManualInputChange('overtimeHours', e.target.value)}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Leaves"
                    type="number"
                    value={manualInputs.leaves}
                    onChange={(e) => handleManualInputChange('leaves', e.target.value)}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Half Days"
                    type="number"
                    value={manualInputs.halfDays}
                    onChange={(e) => handleManualInputChange('halfDays', e.target.value)}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  // Function to handle adding custom allowance in edit mode
  const handleAddCustomValueInEditMode = (type) => {
    if (!editingPreview) return;

    // Create a new empty item
    const newItem = { name: `New ${type}`, amount: '0' };

    if (type === 'allowance') {
      setManualPreviewValues(prev => ({
        ...prev,
        customAllowances: [...prev.customAllowances, newItem]
      }));
    } else {
      setManualPreviewValues(prev => ({
        ...prev,
        customDeductions: [...prev.customDeductions, newItem]
      }));
    }
  };

  // Function to handle removing custom item in edit mode
  const handleRemoveCustomValueInEditMode = (type, index) => {
    if (!editingPreview) return;

    if (type === 'allowance') {
      setManualPreviewValues(prev => ({
        ...prev,
        customAllowances: prev.customAllowances.filter((_, i) => i !== index)
      }));
    } else {
      setManualPreviewValues(prev => ({
        ...prev,
        customDeductions: prev.customDeductions.filter((_, i) => i !== index)
      }));
    }
  };

  // Function to update custom item name in edit mode
  const handleCustomNameChange = (type, index, value) => {
    if (!editingPreview) return;

    if (type === 'allowance') {
      setManualPreviewValues(prev => {
        const updatedAllowances = [...prev.customAllowances];
        updatedAllowances[index] = { ...updatedAllowances[index], name: value };
        return {
          ...prev,
          customAllowances: updatedAllowances
        };
      });
    } else {
      setManualPreviewValues(prev => {
        const updatedDeductions = [...prev.customDeductions];
        updatedDeductions[index] = { ...updatedDeductions[index], name: value };
        return {
          ...prev,
          customDeductions: updatedDeductions
        };
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Fade in timeout={800}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountBalanceIcon sx={{ mr: 2 }} />
        Payroll Calculator
        <Tooltip title="View Payroll History">
          <IconButton onClick={() => setShowHistory(true)} sx={{ ml: 2 }}>
            <HistoryIcon />
          </IconButton>
        </Tooltip>
      </Typography>
      </Box>
      </Fade>

      <Grid container spacing={3}>
        {/* Input Form Section */}
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
                      onChange={(date) => {
                        if (datesLocked) {
                          setError('Dates are locked. Please click Reset to change pay period dates.');
                          return;
                        }
                        handleInputChange('payPeriodStart', date);
                      }}
                      format="dd/MM/yyyy"
                      onOpen={() => {
                        if (datesLocked) {
                          setError('Dates are locked. Please click Reset to change pay period dates.');
                          return false; // Prevent opening
                        }
                        return true;
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          disabled: loading || calculating || datesLocked,
                          size: "medium",
                          helperText: datesLocked ? "Locked - Click Reset to change" : "",
                          InputProps: {
                            readOnly: datesLocked, // Make input read-only when locked
                          }
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
                      onChange={(date) => {
                        if (datesLocked) {
                          setError('Dates are locked. Please click Reset to change pay period dates.');
                          return;
                        }
                        handleInputChange('payPeriodEnd', date);
                      }}
                      format="dd/MM/yyyy"
                      onOpen={() => {
                        if (datesLocked) {
                          setError('Dates are locked. Please click Reset to change pay period dates.');
                          return false; // Prevent opening
                        }
                        return true;
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          disabled: loading || calculating || datesLocked,
                          size: "medium",
                          helperText: datesLocked ? "Locked - Click Reset to change" : "",
                          InputProps: {
                            readOnly: datesLocked, // Make input read-only when locked
                          }
                        },
                        popper: {
                          placement: "bottom-start"
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                {/* Move Calculation Mode here, right after pay period */}
                <Grid item xs={12}>
                  {renderCalculationMode()}
                </Grid>

                {/* Show Attendance Tracker if needed */}
                <Grid item xs={12}>
                  {showAttendance && selectedEmployee && formData.payPeriodStart && formData.payPeriodEnd && (
                    <Box sx={{ mb: 3 }}>
                      <AttendanceTracker
                        employeeId={selectedEmployee}
                        startDate={formData.payPeriodStart}
                        endDate={formData.payPeriodEnd}
                        onAttendanceUpdate={handleAttendanceUpdate}
                      />
                    </Box>
                  )}
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

                {/* Manual Adjustment Section */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">
                        Manual Adjustments
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={editingPreview}
                            onChange={(e) => {
                              setEditingPreview(e.target.checked);
                              if (e.target.checked) {
                                // When enabling manual mode, ensure we have the latest values from previewData
                                if (previewData) {
                                  // Ensure all deduction values are valid numbers
                                  const validDeductions = {
                                    tax: parseFloat(previewData.deductions?.tax) || 0,
                                    insurance: parseFloat(previewData.deductions?.insurance) || 0,
                                    other: parseFloat(previewData.deductions?.other) || 0
                                  };

                                  console.log("Initializing manual deductions:", validDeductions);

                                  setManualPreviewValues({
                                    basicSalary: previewData.basicSalary || 0,
                                    overtime: {
                                      hours: previewData.overtime?.hours || 0,
                                      rate: previewData.overtime?.rate || 0,
                                      amount: previewData.overtime?.amount || 0
                                    },
                                    allowances: {
                                      housing: previewData.allowances?.housing || 0,
                                      transport: previewData.allowances?.transport || 0,
                                      meal: previewData.allowances?.meal || 0,
                                      other: previewData.allowances?.other || 0
                                    },
                                    deductions: validDeductions,
                                    customAllowances: customAllowances.map(item => ({ ...item })),
                                    customDeductions: customDeductions.map(item => ({ ...item }))
                                  });
                                }
                              } else {
                                // Revert to original values if turning off manual mode without saving
                                if (previewData) {
                                  setManualPreviewValues({
                                    basicSalary: previewData.basicSalary || 0,
                                    overtime: {
                                      hours: previewData.overtime?.hours || 0,
                                      rate: previewData.overtime?.rate || 0,
                                      amount: previewData.overtime?.amount || 0
                                    },
                                    allowances: {
                                      housing: previewData.allowances?.housing || 0,
                                      transport: previewData.allowances?.transport || 0,
                                      meal: previewData.allowances?.meal || 0,
                                      other: previewData.allowances?.other || 0
                                    },
                                    deductions: {
                                      tax: parseFloat(previewData.deductions?.tax) || 0,
                                      insurance: parseFloat(previewData.deductions?.insurance) || 0,
                                      other: parseFloat(previewData.deductions?.other) || 0
                                    },
                                    customAllowances: customAllowances.map(item => ({ ...item })),
                                    customDeductions: customDeductions.map(item => ({ ...item }))
                                  });
                                }
                              }
                            }}
                          />
                        }
                        label="Enable Manual Adjustments"
                      />
                    </Box>

                    {editingPreview && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Base Salary</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Pro-rated Base Salary"
                              value={manualPreviewValues.basicSalary}
                              onChange={(e) => handleManualPreviewChange('basic', null, e.target.value)}
                              InputProps={{
                                startAdornment: <Typography sx={{ mr: 0.5 }}>₹</Typography>
                              }}
                            />
                          </Grid>
                        </Grid>

                        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Overtime</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="Hours"
                              value={manualPreviewValues.overtime.hours}
                              onChange={(e) => handleManualPreviewChange('overtime', 'hours', e.target.value)}
                              InputProps={{
                                endAdornment: <Typography sx={{ ml: 0.5 }}>hrs</Typography>
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="Rate"
                              value={manualPreviewValues.overtime.rate}
                              onChange={(e) => handleManualPreviewChange('overtime', 'rate', e.target.value)}
                              InputProps={{
                                startAdornment: <Typography sx={{ mr: 0.5 }}>₹</Typography>,
                                endAdornment: <Typography sx={{ ml: 0.5 }}>/hr</Typography>
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="Amount"
                              value={manualPreviewValues.overtime.amount}
                              onChange={(e) => handleManualPreviewChange('overtime', 'amount', e.target.value)}
                              InputProps={{
                                startAdornment: <Typography sx={{ mr: 0.5 }}>₹</Typography>
                              }}
                            />
                          </Grid>
                        </Grid>

                        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Standard Allowances</Typography>
                        <Grid container spacing={2}>
                          {Object.entries(manualPreviewValues.allowances).map(([key, value]) => (
                            <Grid item xs={12} sm={3} key={key}>
                              <TextField
                                fullWidth
                                label={key.charAt(0).toUpperCase() + key.slice(1)}
                                value={value}
                                onChange={(e) => handleManualPreviewChange('allowances', key, e.target.value)}
                                InputProps={{
                                  startAdornment: <Typography sx={{ mr: 0.5 }}>₹</Typography>
                                }}
                                type="number"
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            </Grid>
                          ))}
                        </Grid>

                        {/* Summary of Allowances */}
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Total Manual Allowances:
                          </Typography>
                          <Typography variant="h6">
                            ₹{Object.values(manualPreviewValues.allowances).reduce((sum, value) => sum + (parseFloat(value) || 0), 0).toFixed(2)}
                          </Typography>
                        </Box>

                        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Standard Deductions</Typography>
                        <Grid container spacing={2}>
                          {Object.entries(manualPreviewValues.deductions).map(([key, value]) => (
                            <Grid item xs={12} sm={4} key={key}>
                              <TextField
                                fullWidth
                                label={key.charAt(0).toUpperCase() + key.slice(1)}
                                value={value}
                                onChange={(e) => handleManualPreviewChange('deductions', key, e.target.value)}
                                InputProps={{
                                  startAdornment: <Typography sx={{ mr: 0.5 }}>₹</Typography>
                                }}
                                type="number"
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            </Grid>
                          ))}
                        </Grid>

                        {/* Summary of Deductions */}
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', color: 'white', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Total Manual Deductions:
                          </Typography>
                          <Typography variant="h6">
                            ₹{Object.values(manualPreviewValues.deductions).reduce((sum, value) => sum + (parseFloat(value) || 0), 0).toFixed(2)}
                          </Typography>
                        </Box>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">Custom Allowances</Typography>
                          <Button
                            size="small"
                            onClick={() => handleAddCustomValueInEditMode('allowance')}
                            startIcon={<AddIcon />}
                            variant="outlined"
                          >
                            Add Custom Allowance
                          </Button>
                        </Box>
                        {manualPreviewValues.customAllowances.length > 0 ? (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            {manualPreviewValues.customAllowances.map((allowance, index) => (
                              <Grid item xs={12} key={`custom-allowance-${index}`}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <TextField
                                    label="Name"
                                    value={allowance.name}
                                    onChange={(e) => handleCustomNameChange('allowance', index, e.target.value)}
                                    sx={{ flexGrow: 1 }}
                                  />
                                  <TextField
                                    label="Amount"
                                    value={allowance.amount}
                                    onChange={(e) => handleManualPreviewChange('customAllowances', index, e.target.value)}
                                    InputProps={{
                                      startAdornment: <Typography sx={{ mr: 0.5 }}>₹</Typography>
                                    }}
                                    sx={{ width: '150px' }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveCustomValueInEditMode('allowance', index)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        ) : null}

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">Custom Deductions</Typography>
                          <Button
                            size="small"
                            onClick={() => handleAddCustomValueInEditMode('deduction')}
                            startIcon={<AddIcon />}
                            variant="outlined"
                          >
                            Add Custom Deduction
                          </Button>
                        </Box>
                        {manualPreviewValues.customDeductions.length > 0 ? (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            {manualPreviewValues.customDeductions.map((deduction, index) => (
                              <Grid item xs={12} key={`custom-deduction-${index}`}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <TextField
                                    label="Name"
                                    value={deduction.name}
                                    onChange={(e) => handleCustomNameChange('deduction', index, e.target.value)}
                                    sx={{ flexGrow: 1 }}
                                  />
                                  <TextField
                                    label="Amount"
                                    value={deduction.amount}
                                    onChange={(e) => handleManualPreviewChange('customDeductions', index, e.target.value)}
                                    InputProps={{
                                      startAdornment: <Typography sx={{ mr: 0.5 }}>₹</Typography>
                                    }}
                                    sx={{ width: '150px' }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveCustomValueInEditMode('deduction', index)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        ) : null}

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => setEditingPreview(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={applyManualPreviewValues}
                            sx={{
                              px: 3,
                              py: 1.2,
                              boxShadow: theme => theme.shadows[4],
                              '&:hover': {
                                boxShadow: theme => theme.shadows[6],
                              }
                            }}
                          >
                            Apply Adjustments
                          </Button>
                        </Box>
                      </>
                    )}
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

        {/* Preview Section */}
        <Grid item xs={12} md={6}>
          {renderPreview()}
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
                      {formatDate(record.date)}
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
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Tooltip title="Print Payroll">
                      <IconButton
                        color="primary"
                        onClick={() => handlePrintPayroll(record)}
                        size="small"
                      >
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
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
    </Box>
  );
};

export default PayrollCalculator; 