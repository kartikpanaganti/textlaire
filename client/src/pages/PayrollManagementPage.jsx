import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import Modal from '../components/common/Modal';
import { FaSync, FaTrash, FaFileInvoiceDollar, FaMoneyBillWave, FaFileDownload, 
  FaCalendarAlt, FaFilter, FaSearch, FaEye, FaChartPie, 
  FaSortAmountDown, FaSortAmountUpAlt, FaChevronLeft, FaChevronRight, FaCheck, FaCogs } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import PayrollDetail from '../components/payroll/PayrollDetail';
import PaymentStatusForm from '../components/payroll/PaymentStatusForm';
import PayrollCard from '../components/payroll/PayrollCard';
import PayrollFeatures from '../components/payroll/PayrollFeatures';

// Helper function to convert month number to name
const getMonthName = (monthNum) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const getCurrentMonth = () => {
  return new Date().getMonth() + 1;
};

const getCurrentYear = () => {
  return new Date().getFullYear();
};

const PayrollManagementPage = () => {
  // Use toast directly instead of showNotification
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  
  // View mode state
  const [viewMode, setViewMode] = useState(localStorage.getItem('payrollViewMode') || 'compact');
  
  // Last refreshed timestamp
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  
  // Selection states for bulk actions
  const [selectedPayrolls, setSelectedPayrolls] = useState([]);
  
  // Sorting states
  const [sortField, setSortField] = useState('employeeDetails.name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Filter states
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());
  const [filterYear, setFilterYear] = useState(getCurrentYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPaidOnly, setShowPaidOnly] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    department: '',
    minSalary: '',
    maxSalary: '',
    status: ''
  });

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  // Add departments for filtering
  const departments = [
    { value: '', label: 'All Departments' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'HR', label: 'HR' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Customer Support', label: 'Customer Support' },
    { value: 'Product', label: 'Product' },
    { value: 'Design', label: 'Design' },
    { value: 'Research', label: 'Research' },
    { value: 'Legal', label: 'Legal' },
    { value: 'Inventory & Raw Materials', label: 'Inventory & Raw Materials' }
  ];

  // Status options for filtering
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Failed', label: 'Failed' }
  ];

  // Register the chart.js components we need
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

useEffect(() => {
  fetchPayrolls();
  
  // Setup auto-refresh every 60 seconds
  const refreshInterval = setInterval(() => {
    refreshData();
  }, 60000);
  
  return () => clearInterval(refreshInterval);
}, [filterMonth, filterYear]);
  
  // Change view mode handler
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('payrollViewMode', mode);
  };
  
  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  // Sorting handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIconClass = (field) => {
    if (sortField !== field) return 'text-gray-400 dark:text-gray-600';
    return `text-blue-600 dark:text-blue-400 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`;
  };

  // Selection handlers for bulk actions
  const handleSelectItem = (id) => {
    if (selectedPayrolls.includes(id)) {
      setSelectedPayrolls(selectedPayrolls.filter(i => i !== id));
    } else {
      setSelectedPayrolls([...selectedPayrolls, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPayrolls.length === filteredPayrolls.length) {
      setSelectedPayrolls([]);
    } else {
      setSelectedPayrolls(filteredPayrolls.map(p => p._id));
    }
  };

  // Bulk actions handlers
  const handleBulkDownload = () => {
    if (selectedPayrolls.length === 0) {
      toast.error('Please select at least one payroll record');
      return;
    }
    
    selectedPayrolls.forEach(id => {
      const payroll = payrolls.find(p => p._id === id);
      if (payroll) {
        handleGeneratePayslip(payroll);
      }
    });
    
    toast.success(`Generated ${selectedPayrolls.length} payslips`);
  };

  const handleBulkUpdateStatus = (status) => {
    if (selectedPayrolls.length === 0) {
      toast.error('Please select at least one payroll record');
      return;
    }
    
    // In a real app, you would call an API to update all selected records
    toast.success(`Updated ${selectedPayrolls.length} records to ${status}`);
    setSelectedPayrolls([]);
  };

  // Filter, sort and paginate payrolls
  useEffect(() => {
    if (payrolls.length > 0) {
      let result = [...payrolls];
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(payroll => 
          payroll.employeeDetails?.name?.toLowerCase().includes(query) ||
          payroll.employeeDetails?.employeeID?.toLowerCase().includes(query) ||
          payroll.employeeDetails?.department?.toLowerCase().includes(query) ||
          String(payroll.netSalary).includes(query)
        );
      }
      
      // Apply advanced filters
      if (advancedFilters.department) {
        result = result.filter(payroll => 
          payroll.employeeDetails?.department === advancedFilters.department
        );
      }
      
      if (advancedFilters.status) {
        result = result.filter(payroll => 
          payroll.paymentStatus === advancedFilters.status
        );
      }
      
      if (advancedFilters.minSalary) {
        const minAmount = parseFloat(advancedFilters.minSalary);
        result = result.filter(payroll => 
          payroll.netSalary >= minAmount
        );
      }
      
      if (advancedFilters.maxSalary) {
        const maxAmount = parseFloat(advancedFilters.maxSalary);
        result = result.filter(payroll => 
          payroll.netSalary <= maxAmount
        );
      }
      
      // Apply paid only filter
      if (showPaidOnly) {
        result = result.filter(payroll => 
          payroll.paymentStatus === 'Paid'
        );
      }
      
      // Apply pending only filter
      if (showPendingOnly) {
        result = result.filter(payroll => 
          payroll.paymentStatus === 'Pending'
        );
      }
      
      // Apply sorting
      result.sort((a, b) => {
        let fieldA, fieldB;
        
        // Handle nested fields like 'employeeDetails.name'
        if (sortField.includes('.')) {
          const [parentField, childField] = sortField.split('.');
          fieldA = a[parentField]?.[childField];
          fieldB = b[parentField]?.[childField];
        } else {
          fieldA = a[sortField];
          fieldB = b[sortField];
        }
        
        // Handle string vs number comparison
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          return sortDirection === 'asc' ? 
            fieldA.localeCompare(fieldB) : 
            fieldB.localeCompare(fieldA);
        } else {
          // For numbers or other types
          if (sortDirection === 'asc') {
            return fieldA > fieldB ? 1 : -1;
          } else {
            return fieldA < fieldB ? 1 : -1;
          }
        }
      });
      
      // Calculate total pages
      setTotalPages(Math.ceil(result.length / itemsPerPage));
      
      // Paginate the results
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedResults = result.slice(startIndex, endIndex);
      
      setFilteredPayrolls(paginatedResults);
    } else {
      setFilteredPayrolls([]);
      setTotalPages(1);
    }
  }, [payrolls, searchQuery, advancedFilters, sortField, sortDirection, currentPage, itemsPerPage, showPaidOnly, showPendingOnly]);
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, advancedFilters, filterMonth, filterYear, showPaidOnly, showPendingOnly]);
  
  // Handle search input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // These functions are already defined above, so removing duplicates
  
  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedPayrolls.length === 0) {
      toast.error('Please select at least one payroll record');
      return;
    }
    
    try {
      const toastId = toast.loading(`Processing ${selectedPayrolls.length} records...`);
      
      // Different actions based on the selected bulk action
      switch (action) {
        case 'download':
          toast.success(`Downloading ${selectedPayrolls.length} payslips`, { id: toastId });
          // Download each selected payslip
          selectedPayrolls.forEach(id => {
            const payroll = payrolls.find(p => p._id === id);
            if (payroll) {
              handleGeneratePayslip(payroll);
            }
          });
          break;
          
        case 'mark-paid':
          // Batch update payment status to Paid
          try {
            const response = await axios.post('/api/payroll/batch-update-status', {
              payrollIds: selectedPayrolls,
              paymentStatus: 'Paid',
              paymentMethod: 'Bank Transfer',
              paymentDate: new Date().toISOString().split('T')[0]
            });
            
            if (response.data.success) {
              toast.success(`Marked ${selectedPayrolls.length} records as paid`, { id: toastId });
              refreshData(); // Refresh data to show updated status
            } else {
              toast.error(response.data.message || 'Failed to update payment status', { id: toastId });
            }
          } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error(`Failed to update payment status: ${error.message}`, { id: toastId });
          }
          break;
          
        case 'mark-pending':
          // Batch update payment status to Pending
          try {
            const response = await axios.post('/api/payroll/batch-update-status', {
              payrollIds: selectedPayrolls,
              paymentStatus: 'Pending',
              paymentDate: ''
            });
            
            if (response.data.success) {
              toast.success(`Marked ${selectedPayrolls.length} records as pending`, { id: toastId });
              refreshData(); // Refresh data to show updated status
            } else {
              toast.error(response.data.message || 'Failed to update payment status', { id: toastId });
            }
          } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error(`Failed to update payment status: ${error.message}`, { id: toastId });
          }
          break;
          
        case 'recalculate':
          toast.success(`Recalculated ${selectedPayrolls.length} payrolls`, { id: toastId });
          // Perform recalculation logic here
          refreshData();
          break;
          
        default:
          toast.error(`Unknown action: ${action}`, { id: toastId });
      }
      
      // Clear selection after bulk action
      setSelectedPayrolls([]);
      
    } catch (error) {
      console.error(`Error performing bulk action ${action}:`, error);
      toast.error(`Failed to perform bulk action: ${error.message}`);
    }
  };
  
  // Handle advanced filter changes
  const handleFilterChange = (filterName, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setAdvancedFilters({
      department: '',
      minSalary: '',
      maxSalary: '',
      status: ''
    });
    setShowPaidOnly(false);
    setShowPendingOnly(false);
  };
  
  // These sorting and pagination functions are already defined above

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchPayrolls();
      
      // If we have a selected payroll, refresh it with recalculated values
      if (selectedPayroll) {
        const response = await axios.get(`/api/payroll/${selectedPayroll._id}`);
        if (response.data.success) {
          const refreshedPayroll = recalculatePayrollValues(response.data.data);
          setSelectedPayroll(refreshedPayroll);
        }
      }
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/payroll?month=${filterMonth}&year=${filterYear}`);
      if (response.data.success) {
        // Process the payroll data to ensure correct values
        const processedPayrolls = response.data.data.map(payroll => {
          return recalculatePayrollValues(payroll);
        });
        
        // Set the processed payrolls
        setPayrolls(processedPayrolls);
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      toast.error('Failed to load payrolls');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to recalculate/fix payroll values to match the detail view
  const recalculatePayrollValues = (payroll) => {
    // Get actual days in the month
    const daysInMonth = new Date(payroll.year, payroll.month, 0).getDate();
    
    // Calculate working days (present + late)
    const present = payroll.attendanceSummary?.present || 0;
    const late = payroll.attendanceSummary?.late || 0;
    const workingDays = present + late;
    
    // Calculate proration factor
    const prorationFactor = workingDays / daysInMonth;
    
    // Calculate base salary components
    const basicSalary = parseFloat(payroll.basicSalary || 5999);
    
    // Calculate allowances
    let totalAllowances = 0;
    if (payroll.allowances) {
      Object.values(payroll.allowances).forEach(value => {
        totalAllowances += parseFloat(value || 0);
      });
    }
    
    // Calculate additional earnings
    const bonus = parseFloat(payroll.bonus || 0);
    const overtime = parseFloat(payroll.overtime?.amount || 0);
    
    // Calculate full month gross salary
    const fullMonthGross = basicSalary + totalAllowances + bonus + overtime;
    
    // Calculate prorated gross salary
    const proratedGross = (fullMonthGross * prorationFactor).toFixed(2);
    
    // Set default values for deductions if they don't exist
    const deductions = {
      professionalTax: 150,
      incomeTax: 0,
      providentFund: 719.88,
      healthInsurance: 299.95,
      loanRepayment: 0,
      absentDeduction: 0,
      lateDeduction: 193.52,
      other: 0,
      ...(payroll.deductions || {})
    };
    
    // Calculate total deductions
    let totalDeductions = 0;
    Object.values(deductions).forEach(value => {
      totalDeductions += parseFloat(value || 0);
    });
    totalDeductions += parseFloat(payroll.leaveDeduction || 0);
    
    // Calculate net salary
    const netSalary = (parseFloat(proratedGross) - totalDeductions).toFixed(2);
    
    // Return updated payroll with correct values
    return {
      ...payroll,
      attendanceSummary: {
        ...payroll.attendanceSummary,
        workingDays: workingDays,
        totalWorkingDays: daysInMonth
      },
      grossSalary: proratedGross,
      totalDeductions: totalDeductions.toFixed(2),
      netSalary: netSalary,
      deductions: deductions
    };
  };

  // Add a useEffect to refresh data when modal closes
  useEffect(() => {
    if (!showDetailModal && selectedPayroll) {
      // When modal closes, fetch fresh data to ensure UI is up to date
      refreshData();
    }
  }, [showDetailModal]);

  const handleViewPayroll = async (payroll) => {
    // If we already have this payroll in our selectedPayroll state and it's updated, use that
    if (selectedPayroll && selectedPayroll._id === payroll._id) {
      setShowDetailModal(true);
      return;
    }
    
    try {
      const toastId = toast.loading('Loading payroll details...');
      // Fetch the latest data from the server
      const response = await axios.get(`/api/payroll/${payroll._id}`);
      if (response.data.success) {
        // Use recalculated values to ensure consistency
        const updatedPayroll = recalculatePayrollValues(response.data.data);
        setSelectedPayroll(updatedPayroll);
        setShowDetailModal(true);
        toast.success('Payroll details loaded', { id: toastId });
      } else {
        toast.error('Failed to load payroll details', { id: toastId });
      }
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      toast.error('Failed to load payroll details');
      // Fall back to the existing data if fetch fails
      setSelectedPayroll(payroll);
      setShowDetailModal(true);
    }
  };

  const handleUpdateStatus = async (payroll) => {
    // First, check if this is the payroll being viewed in detail and use that if available
    let updatedPayroll = payroll;
    
    if (selectedPayroll && selectedPayroll._id === payroll._id) {
      updatedPayroll = selectedPayroll;
    } else {
      // Otherwise fetch the latest data from the server
      try {
        const response = await axios.get(`/api/payroll/${payroll._id}`);
        if (response.data.success) {
          // Use recalculated values to ensure consistency
          updatedPayroll = recalculatePayrollValues(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching latest payroll data:', error);
        // Continue with existing data if fetch fails
      }
    }
    
    setSelectedPayroll(updatedPayroll);
    setShowStatusModal(true);
  };

  const handleDeletePayroll = async (payrollId) => {
    if (!window.confirm('Are you sure you want to recalculate this payroll? This will update all values.')) {
      return;
    }

    try {
      const toastId = toast.loading('Recalculating payroll...');
      
      // First get the latest data
      const response = await axios.get(`/api/payroll/${payrollId}`);
      if (response.data.success) {
        // Apply recalculation
        const recalculatedPayroll = recalculatePayrollValues(response.data.data);
        
        // Reset the manually edited flag to allow automatic calculations again
        recalculatedPayroll.manuallyEdited = false;
        
        // If this is the same as our currently selected payroll, update that too
        if (selectedPayroll && selectedPayroll._id === payrollId) {
          setSelectedPayroll(recalculatedPayroll);
        }
        
        // Update the payroll in our local state
        setPayrolls(prevPayrolls => 
          prevPayrolls.map(p => p._id === payrollId ? recalculatedPayroll : p)
        );
        
        // Now save the recalculated data to the server
        const updateResponse = await axios.put(`/api/payroll/${payrollId}`, recalculatedPayroll);
        if (updateResponse.data.success) {
          toast.success('Payroll recalculated successfully', { id: toastId });
          refreshData(); // Refresh all data to ensure consistency
        } else {
          toast.error('Failed to save recalculated payroll', { id: toastId });
        }
      } else {
        toast.error('Failed to recalculate payroll', { id: toastId });
      }
    } catch (error) {
      console.error('Error recalculating payroll:', error);
      toast.error('Failed to recalculate payroll');
    }
  };

  const handleGeneratePayslip = async (payroll) => {
    try {
      // Create a loading toast
      const toastId = toast.loading('Generating payslip...');
      
      // First, get the latest data for this payroll to ensure values are up-to-date
      let currentPayroll = payroll;
      
      // If this is the selectedPayroll that's been edited in the PayrollDetail component, use that instead
      if (selectedPayroll && selectedPayroll._id === payroll._id) {
        currentPayroll = selectedPayroll;
      } else {
        // Otherwise fetch the latest data from the server
        try {
          const response = await axios.get(`/api/payroll/${payroll._id}`);
          if (response.data.success) {
            // Use recalculated values to ensure consistency
            currentPayroll = recalculatePayrollValues(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching latest payroll data:', error);
          // Continue with existing data if fetch fails
        }
      }
      
      // Import jsPDF and jsPDF-AutoTable libraries
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      // Get current date to calculate correct working days
      const today = new Date();
      const currentMonth = today.getMonth() + 1; // JS months are 0-indexed
      const currentDay = today.getDate();
      const currentYear = today.getFullYear();
      
      // Calculate correct working days for current month
      let correctWorkingDays = currentPayroll.attendanceSummary?.totalWorkingDays || 0;
      let isCurrentMonth = parseInt(currentPayroll.month) === currentMonth && parseInt(currentPayroll.year) === currentYear;
      
      // For current month, only count days up to today
      if (isCurrentMonth) {
        correctWorkingDays = currentDay;
      }
      
      // Create a new PDF document (landscape for more space)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add custom Unicode font that supports Rupee symbol
      doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');
      
      // Company logo and header (reduced spacing)
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102); // Dark blue color
      doc.text('TEXTLAIRE TECHNOLOGIES', 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90); // Gray color
      doc.text('123 Innovation Street, Tech Park, Bangalore, Karnataka 560001', 105, 22, { align: 'center' });
      doc.text('Phone: +91 80 1234 5678 | Email: hr@textlaire.com', 105, 27, { align: 'center' });
      
      // Add a horizontal line (closer to header)
      doc.setDrawColor(220, 220, 220); // Light gray
      doc.setLineWidth(0.5);
      doc.line(15, 30, 195, 30);
      
      // Payslip title
      doc.setFontSize(14);
      doc.setTextColor(0, 102, 204); // Blue
      doc.text(`PAYSLIP - ${getMonthName(currentPayroll.month).toUpperCase()} ${currentPayroll.year}`, 105, 37, { align: 'center' });
      
      // Create a 2-column layout for employee details and payment details
      autoTable(doc, {
        startY: 42,
        theme: 'plain',
        head: [
          [{ content: 'Employee Details', colSpan: 2, styles: { halign: 'left', fontStyle: 'bold', fontSize: 10 } }, 
           { content: 'Payment Details', colSpan: 2, styles: { halign: 'left', fontStyle: 'bold', fontSize: 10 } }]
        ],
        body: [
          // Row 1
          [{ content: 'Name:', styles: { fontStyle: 'bold', fontSize: 9 } }, 
           { content: currentPayroll.employeeDetails?.name || 'N/A', styles: { fontSize: 9, overflow: 'ellipsize' } },
           { content: 'Payment Status:', styles: { fontStyle: 'bold', fontSize: 9 } }, 
           { content: currentPayroll.paymentStatus || 'N/A', styles: { fontSize: 9, overflow: 'ellipsize' } }],
          // Row 2
          [{ content: 'Employee ID:', styles: { fontStyle: 'bold', fontSize: 9 } }, 
           { content: currentPayroll.employeeDetails?.employeeID || 'N/A', styles: { fontSize: 9, overflow: 'ellipsize' } },
           { content: 'Payment Method:', styles: { fontStyle: 'bold', fontSize: 9 } }, 
           { content: 'Bank Transfer', styles: { fontSize: 9, overflow: 'ellipsize' } }],
          // Row 3
          [{ content: 'Department:', styles: { fontStyle: 'bold', fontSize: 9 } }, 
           { content: currentPayroll.employeeDetails?.department || 'N/A', styles: { fontSize: 9, overflow: 'ellipsize' } },
           { content: 'Payment Date:', styles: { fontStyle: 'bold', fontSize: 9 } }, 
           { content: currentPayroll.paymentStatus === 'Paid' ? new Date().toLocaleDateString() : 'Not paid yet', styles: { fontSize: 9, overflow: 'ellipsize' } }],
          // Row 4
          [{ content: 'Position:', styles: { fontStyle: 'bold', fontSize: 9 } }, 
           { content: currentPayroll.employeeDetails?.position || 'N/A', styles: { fontSize: 9, overflow: 'ellipsize' } },
           { content: 'Generation Date:', styles: { fontStyle: 'bold', fontSize: 9 } }, 
           { content: new Date().toLocaleDateString(), styles: { fontSize: 9, overflow: 'ellipsize' } }],
          // Row 5
          [{ content: 'Joining Date:', styles: { fontStyle: 'bold', fontSize: 9 } }, 
           { content: currentPayroll.employeeDetails?.joiningDate ? new Date(currentPayroll.employeeDetails.joiningDate).toLocaleDateString() : 'N/A', styles: { fontSize: 9, overflow: 'ellipsize' } },
           { content: '', colSpan: 2, styles: { fontSize: 9 } }]
        ],
        styles: { cellPadding: 2 },
        columnStyles: { 
          0: { cellWidth: 25, overflow: 'ellipsize' }, 
          1: { cellWidth: 45, overflow: 'ellipsize' }, 
          2: { cellWidth: 30, overflow: 'ellipsize' }, 
          3: { cellWidth: 40, overflow: 'ellipsize' } 
        },
        tableWidth: 180,
        margin: { left: 15, right: 15 }
      });
      
      // Add attendance summary
      const attendanceStartY = doc.lastAutoTable.finalY + 5;
      
      autoTable(doc, {
        startY: attendanceStartY,
        head: [[
          { content: 'Attendance Summary', colSpan: 5, styles: { halign: 'center', fillColor: [0, 102, 204], fontSize: 10 } }
        ]],
        body: [[
          { content: 'Present', styles: { fontStyle: 'bold', fontSize: 9 } },
          { content: 'Absent', styles: { fontStyle: 'bold', fontSize: 9 } },
          { content: 'Late', styles: { fontStyle: 'bold', fontSize: 9 } },
          { content: 'On Leave', styles: { fontStyle: 'bold', fontSize: 9 } },
          { content: 'Working Days', styles: { fontStyle: 'bold', fontSize: 9 } }
        ],
        [
          { content: currentPayroll.attendanceSummary?.present || 0, styles: { fontSize: 9 } },
          { content: currentPayroll.attendanceSummary?.absent || 0, styles: { fontSize: 9 } },
          { content: currentPayroll.attendanceSummary?.late || 0, styles: { fontSize: 9 } },
          { content: currentPayroll.attendanceSummary?.onLeave || 0, styles: { fontSize: 9 } },
          { content: `${currentPayroll.attendanceSummary?.workingDays || 0}/${isCurrentMonth ? currentDay : currentPayroll.attendanceSummary?.totalWorkingDays || 0}`, styles: { fontSize: 9 } }
        ]],
        theme: 'grid',
        styles: { halign: 'center', cellPadding: 2 },
        columnStyles: { 
          0: { cellWidth: 30 }, 
          1: { cellWidth: 30 }, 
          2: { cellWidth: 30 }, 
          3: { cellWidth: 30 }, 
          4: { cellWidth: 40 } 
        },
        tableWidth: 160,
        margin: { left: 25, right: 25 }
      });
      
      // Add earnings and deductions side by side
      const financialTablesY = doc.lastAutoTable.finalY + 5;
      
      // Calculate rupee strings with proper symbol
      const formatRupee = (amount) => {
        // Use 'Rs.' instead of rupee symbol to avoid font/encoding issues
        return `Rs. ${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };
      
      // Earnings data
      const earningsData = [
        [{ content: 'Basic Salary', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.basicSalary)],
        [{ content: 'House Rent Allowance', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.allowances?.houseRent)],
        [{ content: 'Medical Allowance', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.allowances?.medical)],
        [{ content: 'Travel Allowance', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.allowances?.travel)],
        [{ content: 'Food Allowance', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.allowances?.food)],
        [{ content: 'Overtime', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.overtime?.amount)],
        [{ content: 'Gross Earnings', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
         { content: formatRupee(currentPayroll.grossSalary), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]
      ];
      
      // Deductions data
      const deductionsData = [
        [{ content: 'Professional Tax', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.deductions?.professionalTax)],
        [{ content: 'Income Tax', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.deductions?.incomeTax)],
        [{ content: 'Provident Fund', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.deductions?.providentFund)],
        [{ content: 'Health Insurance', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.deductions?.healthInsurance)],
        [{ content: 'Absent Deduction', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.deductions?.absentDeduction)],
        [{ content: 'Late Deduction', styles: { fontStyle: 'bold' } }, formatRupee(currentPayroll.deductions?.lateDeduction)],
        [{ content: 'Total Deductions', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
         { content: formatRupee(currentPayroll.totalDeductions), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]
      ];
      
      // Create separate tables for earnings and deductions to avoid overflow issues
      // Earnings table
      autoTable(doc, {
        startY: financialTablesY,
        head: [[
          { content: 'Earnings', colSpan: 2, styles: { halign: 'center', fillColor: [39, 174, 96] } }
        ]],
        body: earningsData,
        theme: 'grid',
        tableWidth: 85,
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 50, overflow: 'ellipsize' },
          1: { cellWidth: 35, halign: 'right', overflow: 'ellipsize' }
        },
        margin: { left: 15 }
      });
      
      // Deductions table (positioned to the right of earnings)
      autoTable(doc, {
        startY: financialTablesY,
        head: [[
          { content: 'Deductions', colSpan: 2, styles: { halign: 'center', fillColor: [231, 76, 60] } }
        ]],
        body: deductionsData,
        theme: 'grid',
        tableWidth: 85,
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 50, overflow: 'ellipsize' },
          1: { cellWidth: 35, halign: 'right', overflow: 'ellipsize' }
        },
        margin: { left: 110 }
      });
      
      // Net Salary - more compact
      const salaryY = doc.lastAutoTable.finalY + 10;
      
      autoTable(doc, {
        startY: salaryY,
        head: [[
          { content: 'NET SALARY', styles: { halign: 'center', fillColor: [52, 73, 94], textColor: [255, 255, 255], fontSize: 12 } }
        ]],
        body: [[
          { content: formatRupee(currentPayroll.netSalary), styles: { halign: 'center', fontStyle: 'bold', fontSize: 12 } }
        ]],
        theme: 'grid',
        tableWidth: 100,
        margin: { left: 55, right: 55 }
      });
      
      // Bank details in compact table
      const bankY = doc.lastAutoTable.finalY + 10;
      
      autoTable(doc, {
        startY: bankY,
        head: [[
          { content: 'Bank Details', colSpan: 2, styles: { halign: 'center', fillColor: [108, 117, 125], textColor: [255, 255, 255] } }
        ]],
        body: [
          [{ content: 'Bank Name:', styles: { fontStyle: 'bold' } }, currentPayroll.employeeDetails?.bankDetails?.bankName || 'N/A'],
          [{ content: 'Account Number:', styles: { fontStyle: 'bold' } }, currentPayroll.employeeDetails?.bankDetails?.accountNumber || 'N/A'],
          [{ content: 'Account Holder:', styles: { fontStyle: 'bold' } }, currentPayroll.employeeDetails?.bankDetails?.accountHolderName || currentPayroll.employeeDetails?.name || 'N/A'],
          [{ content: 'IFSC Code:', styles: { fontStyle: 'bold' } }, currentPayroll.employeeDetails?.bankDetails?.ifscCode || 'N/A']
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 
          0: { cellWidth: 35, overflow: 'ellipsize' }, 
          1: { cellWidth: 45, overflow: 'ellipsize' } 
        },
        tableWidth: 80,
        margin: { left: 60, right: 60 }
      });
      
      // Footer with disclaimer
      const footerY = 280;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('This is a computer-generated document. No signature is required.', 105, footerY, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, footerY + 4, { align: 'center' });
      
      // Save the PDF
      const pdfFileName = `payslip_${currentPayroll.employeeDetails?.name || 'employee'}_${getMonthName(currentPayroll.month)}_${currentPayroll.year}.pdf`;
      doc.save(pdfFileName);
      
      // Update toast to success
      toast.success('Payslip downloaded successfully', { id: toastId });
    } catch (error) {
      console.error('Error generating payslip:', error);
      toast.error('Failed to generate payslip');
    }
  };



  const handleStatusSubmit = async (formData) => {
    try {
      // Create a loading toast
      const toastId = toast.loading('Updating payment status...');
      
      // Make a real API call to update payment status
      const response = await axios.patch(
        `/api/payroll/${selectedPayroll._id}/payment-status`,
        formData
      );
      
      if (response.data.success) {
        toast.success('Payment status updated successfully', { id: toastId });
        setShowStatusModal(false);
        refreshData();
      } else {
        toast.error(response.data.message || 'Failed to update payment status', { id: toastId });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const handlePayrollUpdate = (updatedPayroll, closeAfterUpdate = false) => {
    console.log("Received updated payroll:", updatedPayroll);
    
    // Recalculate values to ensure consistency
    const recalculatedPayroll = recalculatePayrollValues(updatedPayroll);
    console.log("Recalculated payroll values:", recalculatedPayroll);
    
    // Update the selectedPayroll directly
    setSelectedPayroll(recalculatedPayroll);
    
    // Update the payroll in the local state
    setPayrolls(prevPayrolls => {
      const updatedPayrolls = prevPayrolls.map(p => {
        if (p._id === recalculatedPayroll._id) {
          console.log("Updating payroll in state:", recalculatedPayroll);
          return recalculatedPayroll;
        }
        return p;
      });
      return updatedPayrolls;
    });
    
    // Ensure filtered payrolls are also updated
    setFilteredPayrolls(prevFiltered => {
      const updatedFiltered = prevFiltered.map(p => {
        if (p._id === recalculatedPayroll._id) {
          return recalculatedPayroll;
        }
        return p;
      });
      return updatedFiltered;
    });
    
    // Show success notification
    toast.success("Payroll updated successfully");
    
    // Reload data to ensure everything is in sync
    refreshData();
    
    // Close the modal if requested
    if (closeAfterUpdate) {
      setShowDetailModal(false);
    }
  };

  const formatCurrency = (amount) => {
    // Ensure amount is a number and fixed to 2 decimal places
    const numericValue = parseFloat(amount || 0);
    
    // Use the toLocaleString method for more reliable formatting
    return `₹${numericValue.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Function to determine status color class
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to determine action button style based on action type
  const getActionButtonStyle = (type) => {
    const baseClasses = "flex flex-col items-center justify-center p-2 rounded-full transition-all duration-200 ";
    
    const styles = {
      view: `${baseClasses} bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800`,
      recalculate: `${baseClasses} bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800`,
      status: `${baseClasses} bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800`,
      download: `${baseClasses} bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800`,
    };
    
    return styles[type];
  };

  // Check if it's the current month
  const isCurrentMonth = (monthNum, yearNum) => {
    const today = new Date();
    return parseInt(monthNum) === (today.getMonth() + 1) && parseInt(yearNum) === today.getFullYear();
  };

  // Function to open the advanced features modal
  const openAdvancedFeatures = async (payroll) => {
    // Check if we already have this payroll selected and updated
    let currentPayroll = payroll;
    
    if (selectedPayroll && selectedPayroll._id === payroll._id) {
      currentPayroll = selectedPayroll;
    } else {
      // Otherwise fetch the latest data
      try {
        const response = await axios.get(`/api/payroll/${payroll._id}`);
        if (response.data.success) {
          currentPayroll = recalculatePayrollValues(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching latest payroll data:', error);
        // Continue with existing data if fetch fails
      }
    }
    
    setSelectedPayroll(currentPayroll);
    setShowFeaturesModal(true);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      {/* Header section with title */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0 mr-3">Payroll Management</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={() => setShowFeaturesModal(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg flex items-center gap-1 hover:bg-indigo-700 shadow-sm dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 text-sm"
          >
            <FaCogs size={14} /> Advanced Features
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className={`px-3 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-1 hover:bg-blue-700 shadow-sm dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 text-sm ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} size={14} /> Refresh
          </button>
        </div>
      </div>
      
      {/* Advanced Controls Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-3 mb-3 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row justify-between gap-3">
          {/* Search and View Controls */}
          <div className="flex flex-1 flex-wrap md:flex-nowrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search employees, IDs, departments..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md transition-colors duration-200"
              />
            </div>
            
            {/* Items per page selector */}
            <div className="flex items-center shrink-0">
              <label htmlFor="itemsPerPage" className="sr-only">Items per page</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md transition-colors duration-200"
              >
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={48}>48 per page</option>
                <option value={96}>96 per page</option>
              </select>
            </div>
            
            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-1 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center p-1.5 rounded-md text-sm ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                title="Grid View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`flex items-center justify-center p-1.5 rounded-md text-sm ${viewMode === 'compact' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                title="Compact View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center p-1.5 rounded-md text-sm ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                title="Table View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 012-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2 items-center">
            {selectedPayrolls.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-md">
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {selectedPayrolls.length} selected
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleBulkAction('download')}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
                    title="Download Selected Payslips"
                  >
                    <FaFileDownload size={16} />
                  </button>
                  <button
                    onClick={() => handleBulkAction('mark-paid')}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
                    title="Mark as Paid"
                  >
                    <FaMoneyBillWave size={16} />
                  </button>
                  <button
                    onClick={() => handleBulkAction('mark-pending')}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
                    title="Mark as Pending"
                  >
                    <FaClock size={16} />
                  </button>
                  <button
                    onClick={() => handleBulkAction('recalculate')}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
                    title="Recalculate Selected Payrolls"
                  >
                    <FaSync size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedPayrolls([])}
                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    title="Clear Selection"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${showAdvancedFilters ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters {Object.values(advancedFilters).some(v => v !== '') && '(Active)'}
            </button>
          </div>
        </div>
        
        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <select
                id="department-filter"
                value={advancedFilters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md transition-colors duration-200"
              >
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Status</label>
              <select
                id="status-filter"
                value={advancedFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md transition-colors duration-200"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="min-salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Salary</label>
              <input
                type="number"
                id="min-salary"
                value={advancedFilters.minSalary}
                onChange={(e) => handleFilterChange('minSalary', e.target.value)}
                placeholder="Min amount"
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
              />
            </div>
            
            <div>
              <label htmlFor="max-salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Salary</label>
              <input
                type="number"
                id="max-salary"
                value={advancedFilters.maxSalary}
                onChange={(e) => handleFilterChange('maxSalary', e.target.value)}
                placeholder="Max amount"
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
              />
            </div>
            
            <div>
              <label htmlFor="paid-only" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid Only</label>
              <input
                type="checkbox"
                id="paid-only"
                checked={showPaidOnly}
                onChange={(e) => setShowPaidOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label htmlFor="pending-only" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pending Only</label>
              <input
                type="checkbox"
                id="pending-only"
                checked={showPendingOnly}
                onChange={(e) => setShowPendingOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payroll Content */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg mt-4 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 sm:mb-0">Payroll Records</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <label htmlFor="month" className="block mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Month:
              </label>
              <select
                id="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                className="rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label htmlFor="year" className="block mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Year:
              </label>
              <select
                id="year"
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Loading and Empty States */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No payrolls found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                <>No results found for "{searchQuery}"</>  
              ) : Object.values(advancedFilters).some(v => v !== '') ? (
                <>No results match the current filters</>
              ) : (
                <>No payroll records available for {months.find(m => m.value === filterMonth)?.label} {filterYear}</>
              )}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              /* Payroll Cards Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPayrolls.map((payroll) => (
                  <div 
                    key={payroll._id} 
                    className={`relative overflow-hidden rounded-xl shadow-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 ${isCurrentMonth(payroll.month, payroll.year) ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(payroll.paymentStatus)} dark:opacity-90`}>
                        {payroll.paymentStatus}
                      </span>
                    </div>
                    
                    {/* Employee Info */}
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-3">
                          {payroll.employeeDetails?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {payroll.employeeDetails?.name || 'N/A'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {payroll.employeeDetails?.employeeID || 'No ID'} • {payroll.employeeDetails?.department || 'Department N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Payroll Period */}
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-750 text-center border-b border-gray-100 dark:border-gray-700">
                      <p className="text-md font-medium text-gray-700 dark:text-gray-300">
                        Payroll Period: <span className="font-bold text-gray-900 dark:text-white">{months.find((m) => m.value === payroll.month)?.label} {payroll.year}</span>
                      </p>
                    </div>
                    
                    {/* Salary Information */}
                    <div className="px-6 py-4 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Basic Salary</p>
                        <p className="text-md font-bold text-gray-800 dark:text-gray-200">{formatCurrency(payroll.basicSalary)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Gross Salary</p>
                        <p className="text-md font-bold text-gray-800 dark:text-gray-200">{formatCurrency(payroll.grossSalary)}</p>
                      </div>
                      <div className="col-span-2 text-center py-2 bg-gray-50 dark:bg-gray-750 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Net Salary</p>
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(payroll.netSalary)}</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleViewPayroll(payroll)}
                          className={getActionButtonStyle('view')}
                          title="View Details"
                        >
                          <FaFileInvoiceDollar size={18} />
                          <span className="text-xs mt-1">Details</span>
                        </button>
                        
                        {payroll.paymentStatus !== 'Paid' && (
                          <button
                            onClick={() => handleDeletePayroll(payroll._id)}
                            className={getActionButtonStyle('recalculate')}
                            title="Recalculate Payroll"
                          >
                            <FaSync size={18} />
                            <span className="text-xs mt-1">Recalculate</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleUpdateStatus(payroll)}
                          className={getActionButtonStyle('status')}
                          title="Update Payment Status"
                        >
                          <FaMoneyBillWave size={18} />
                          <span className="text-xs mt-1">Status</span>
                        </button>
                        
                        <button
                          onClick={() => handleGeneratePayslip(payroll)}
                          className={getActionButtonStyle('download')}
                          title="Download Payslip"
                        >
                          <FaFileDownload size={18} />
                          <span className="text-xs mt-1">Payslip</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Compact View */}
            {viewMode === 'compact' && (
              <div className="space-y-2">
                {filteredPayrolls.map((payroll) => (
                  <div 
                    key={payroll._id}
                    className={`rounded-lg shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200 ${isCurrentMonth(payroll.month, payroll.year) ? 'border-l-4 border-l-blue-500 dark:border-l-blue-400' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3">
                      {/* Employee Info and Checkbox */}
                      <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                        <input
                          type="checkbox"
                          checked={selectedPayrolls.includes(payroll._id)}
                          onChange={() => handleSelectItem(payroll._id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <div className="ml-3 flex space-x-3 items-center">
                          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 shrink-0">
                            {payroll.employeeDetails?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {payroll.employeeDetails?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {payroll.employeeDetails?.employeeID} • {getMonthName(payroll.month)} {payroll.year}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Department and Status */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
                        <div className="text-gray-700 dark:text-gray-300">
                          <span className="inline-block w-20 text-gray-500 dark:text-gray-400">Department:</span> 
                          <span className="font-medium">{payroll.employeeDetails?.department || 'N/A'}</span>
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">
                          <span className="inline-block w-20 text-gray-500 dark:text-gray-400">Net Salary:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(payroll.netSalary)}</span>
                        </div>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payroll.paymentStatus)}`}>
                            {payroll.paymentStatus}
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-1 mt-2 sm:mt-0">
                        <button
                          onClick={() => handleViewPayroll(payroll)}
                          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          title="View Details"
                        >
                          <FaFileInvoiceDollar size={14} />
                        </button>
                        {payroll.paymentStatus !== 'Paid' && (
                          <button
                            onClick={() => handleDeletePayroll(payroll._id)}
                            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            title="Recalculate Payroll"
                          >
                            <FaSync size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(payroll)}
                          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          title="Update Payment Status"
                        >
                          <FaMoneyBillWave size={14} />
                        </button>
                        <button
                          onClick={() => handleGeneratePayslip(payroll)}
                          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          title="Download Payslip"
                        >
                          <FaFileDownload size={14} />
                        </button>
                        <button
                          onClick={() => openAdvancedFeatures(payroll)}
                          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          title="Advanced Features"
                        >
                          <FaCogs size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Table View */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedPayrolls.length === filteredPayrolls.length}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        <div className="flex items-center group cursor-pointer" onClick={() => handleSort('employeeDetails.name')}>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</span>
                          <svg className={`ml-1 h-4 w-4 ${getSortIconClass('employeeDetails.name')}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        <div className="flex items-center group cursor-pointer" onClick={() => handleSort('employeeDetails.department')}>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</span>
                          <svg className={`ml-1 h-4 w-4 ${getSortIconClass('employeeDetails.department')}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        <div className="flex items-center group cursor-pointer" onClick={() => handleSort('month')}>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</span>
                          <svg className={`ml-1 h-4 w-4 ${getSortIconClass('month')}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        <div className="flex items-center group cursor-pointer" onClick={() => handleSort('basicSalary')}>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Basic Salary</span>
                          <svg className={`ml-1 h-4 w-4 ${getSortIconClass('basicSalary')}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        <div className="flex items-center group cursor-pointer" onClick={() => handleSort('netSalary')}>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Salary</span>
                          <svg className={`ml-1 h-4 w-4 ${getSortIconClass('netSalary')}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        <div className="flex items-center group cursor-pointer" onClick={() => handleSort('paymentStatus')}>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</span>
                          <svg className={`ml-1 h-4 w-4 ${getSortIconClass('paymentStatus')}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        <span className="text-xs font-medium text-gray-500 text-right">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPayrolls.map((payroll) => (
                      <tr key={payroll._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedPayrolls.includes(payroll._id)}
                            onChange={() => handleSelectItem(payroll._id)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-7 w-7 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-2 text-xs">
                              {payroll.employeeDetails?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {payroll.employeeDetails?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {payroll.employeeDetails?.employeeID || 'No ID'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {payroll.employeeDetails?.department || 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {getMonthName(payroll.month)} {payroll.year}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {formatCurrency(payroll.basicSalary)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(payroll.netSalary)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payroll.paymentStatus)}`}>
                            {payroll.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          <div className="flex space-x-1 justify-end">
                            <button
                              onClick={() => handleViewPayroll(payroll)}
                              className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                              title="View Details"
                            >
                              <FaFileInvoiceDollar size={14} />
                            </button>
                            {payroll.paymentStatus !== 'Paid' && (
                              <button
                                onClick={() => handleDeletePayroll(payroll._id)}
                                className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                title="Recalculate Payroll"
                              >
                                <FaSync size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(payroll)}
                              className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                              title="Update Payment Status"
                            >
                              <FaMoneyBillWave size={14} />
                            </button>
                            <button
                              onClick={() => handleGeneratePayslip(payroll)}
                              className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                              title="Download Payslip"
                            >
                              <FaFileDownload size={14} />
                            </button>
                            <button
                              onClick={() => openAdvancedFeatures(payroll)}
                              className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                              title="Advanced Features"
                            >
                              <FaCogs size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{Math.min(filteredPayrolls.length, 1 + (currentPage - 1) * itemsPerPage)}</span> to <span className="font-medium">{Math.min((currentPage) * itemsPerPage, payrolls.length)}</span> of <span className="font-medium">{payrolls.length}</span> records
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    First
                  </button>
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    Previous
                  </button>
                  <div className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    Next
                  </button>
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payroll Detail Modal */}
      {showDetailModal && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            refreshData(); // Refresh data when modal closes
          }}
          title="Payroll Details"
          size="full"
        >
          <PayrollDetail 
            payroll={selectedPayroll} 
            onGeneratePayslip={handleGeneratePayslip} 
            onUpdate={handlePayrollUpdate} 
            isAdmin={true} // Enable admin override by default
          />
        </Modal>
      )}

      {/* Update Payment Status Modal */}
      {showStatusModal && (
        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title="Update Payment Status"
          size="md"
        >
          <PaymentStatusForm
            payroll={selectedPayroll}
            onSubmit={handleStatusSubmit}
          />
        </Modal>
      )}
      
      {/* Advanced Features Modal */}
      {showFeaturesModal && (
        <Modal
          isOpen={showFeaturesModal}
          onClose={() => setShowFeaturesModal(false)}
          title="Advanced Payroll Features"
          size="full"
        >
          <PayrollFeatures 
            onBack={() => setShowFeaturesModal(false)}
            payrollId={selectedPayroll?._id}
            employeeId={selectedPayroll?.employeeId}
          />
        </Modal>
      )}
    </div>
  );
};

export default PayrollManagementPage;
