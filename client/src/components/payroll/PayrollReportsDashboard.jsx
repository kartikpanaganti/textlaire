import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { FaDownload, FaCalendarAlt, FaBuilding, FaChartPie, FaChartBar, FaChartLine, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const PayrollReportsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'), // Jan 1st of current year
    endDate: format(new Date(), 'yyyy-MM-dd'), // Today
  });
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [exportLoading, setExportLoading] = useState(false);

  // List of departments (should be fetched from API in production)
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

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedDepartment]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/payroll/reports', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          department: selectedDepartment
        }
      });

      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        toast.error('Failed to fetch report data: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error(error.response?.data?.message || 'An error occurred while fetching reports');
    } finally {
      setLoading(false);
    }
  };

  // Simple Excel export using XLSX
  const handleBasicExportToExcel = () => {
    if (!reportData) return;

    try {
      const payrollData = reportData.payrolls.map(p => ({
        'Employee ID': p.employeeDetails.employeeID,
        'Employee Name': p.employeeDetails.name,
        'Department': p.employeeDetails.department,
        'Position': p.employeeDetails.position,
        'Month': p.month,
        'Year': p.year,
        'Basic Salary': p.basicSalary,
        'Allowances': Object.values(p.allowances).reduce((sum, val) => sum + val, 0),
        'Deductions': Object.values(p.deductions).reduce((sum, val) => sum + val, 0),
        'Bonus': p.bonus,
        'Tax': p.deductions.incomeTax,
        'Net Salary': p.netSalary,
        'Payment Status': p.paymentStatus,
        'Payment Date': p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(payrollData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payroll Report');

      // Generate filename with date range
      const fileName = `Payroll_Report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Report exported as ${fileName}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export report to Excel');
    }
  };

  // Enhanced Excel export using ExcelJS
  const handleExportToExcel = async () => {
    if (!reportData) {
      toast.error('No report data available for export');
      return;
    }
    
    try {
      setExportLoading(true);
      const toastId = toast.loading('Generating detailed Excel report...');
      
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Textlaire Payroll System';
      workbook.lastModifiedBy = 'Payroll Reports';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Add a summary worksheet
      const summarySheet = workbook.addWorksheet('Summary', {
        properties: { tabColor: { argb: '6495ED' } }
      });
      
      // Create title with merged cells
      summarySheet.mergeCells('A1:H1');
      const titleCell = summarySheet.getCell('A1');
      titleCell.value = 'TEXTLAIRE TECHNOLOGIES - PAYROLL REPORT';
      titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: '0000FF' }
      };
      titleCell.alignment = { horizontal: 'center' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F2F2F2' }
      };
      
      // Add report period
      summarySheet.mergeCells('A2:H2');
      const periodCell = summarySheet.getCell('A2');
      periodCell.value = `Report Period: ${format(new Date(dateRange.startDate), 'dd MMM yyyy')} to ${format(new Date(dateRange.endDate), 'dd MMM yyyy')}`;
      periodCell.font = {
        name: 'Arial',
        size: 12,
        italic: true
      };
      periodCell.alignment = { horizontal: 'center' };
      
      // Add department filter if applied
      if (selectedDepartment) {
        summarySheet.mergeCells('A3:H3');
        const deptCell = summarySheet.getCell('A3');
        deptCell.value = `Department: ${departments.find(d => d.value === selectedDepartment)?.label || selectedDepartment}`;
        deptCell.font = {
          name: 'Arial',
          size: 12,
          italic: true
        };
        deptCell.alignment = { horizontal: 'center' };
      }
      
      // Add summary information
      summarySheet.addRow([]);
      summarySheet.addRow(['SUMMARY STATISTICS']);
      const statsRow = summarySheet.lastRow;
      statsRow.font = { bold: true, size: 14 };
      statsRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DDEBF7' }
      };
      
      // Ensure analytics exists before accessing its properties
      const analytics = reportData.analytics || {};
      
      // Add summary rows with null checks to prevent errors
      summarySheet.addRow(['Total Employees', analytics.totalEmployees || 0]);
      summarySheet.addRow(['Total Payroll Amount', (analytics.totalPayroll || 0).toFixed(2)]);
      summarySheet.addRow(['Average Salary', (analytics.avgSalary || 0).toFixed(2)]);
      summarySheet.addRow(['Highest Salary', (analytics.highestSalary || 0).toFixed(2)]);
      summarySheet.addRow(['Lowest Salary', (analytics.lowestSalary || 0).toFixed(2)]);
      summarySheet.addRow(['Total Tax Deductions', (analytics.taxDeductions || 0).toFixed(2)]);
      summarySheet.addRow(['Total Bonuses Paid', (analytics.bonusDistributed || 0).toFixed(2)]);
      
      // Format the numbers in the summary section
      for (let i = 7; i <= 12; i++) {
        if (i !== 6) { // Skip the employee count row
          const cell = summarySheet.getCell(`B${i}`);
          cell.numFmt = '₹#,##0.00';
        }
      }
      
      // Add payment status breakdown if available
      summarySheet.addRow([]);
      summarySheet.addRow(['PAYMENT STATUS BREAKDOWN']);
      const statusHeaderRow = summarySheet.lastRow;
      statusHeaderRow.font = { bold: true, size: 14 };
      statusHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DDEBF7' }
      };
      
      // Safely add payment status data
      try {
        if (analytics.paymentStatusDistribution) {
          Object.entries(analytics.paymentStatusDistribution).forEach(([status, count]) => {
            summarySheet.addRow([status, count]);
          });
        }
      } catch (error) {
        console.warn('Error adding payment status data', error);
        summarySheet.addRow(['Error', 'Failed to load payment status data']);
      }
      
      // Set column widths
      summarySheet.getColumn('A').width = 25;
      summarySheet.getColumn('B').width = 20;
      
      // Add a detailed payroll worksheet
      const payrollSheet = workbook.addWorksheet('Payroll Details', {
        properties: { tabColor: { argb: '92D050' } }
      });
      
      // Add headers with styling
      const payrollHeaders = [
        'Employee ID', 'Employee Name', 'Department', 'Position', 
        'Month', 'Year', 'Basic Salary', 'House Rent', 'Medical', 
        'Travel', 'Food', 'Other Allowances', 'Total Allowances',
        'Professional Tax', 'Income Tax', 'PF', 'Health Insurance',
        'Loan Repayment', 'Other Deductions', 'Total Deductions',
        'Bonus', 'Net Salary', 'Payment Status', 'Payment Date'
      ];
      
      payrollSheet.addRow(payrollHeaders);
      
      // Style the headers
      const headerRow = payrollSheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Add data rows
      try {
        if (reportData.payrolls && Array.isArray(reportData.payrolls)) {
          reportData.payrolls.forEach(p => {
            if (!p) return; // Skip if undefined
            
            // Safely extract employee details
            const employeeDetails = p.employeeDetails || {};
            const allowances = p.allowances || {};
            const deductions = p.deductions || {};
            
            // Calculate totals safely
            const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + (val || 0), 0);
            const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
            
            payrollSheet.addRow([
              employeeDetails.employeeID || 'N/A',
              employeeDetails.name || 'N/A',
              employeeDetails.department || 'N/A',
              employeeDetails.position || 'N/A',
              p.month || 'N/A',
              p.year || 'N/A',
              p.basicSalary || 0,
              allowances.houseRent || 0,
              allowances.medical || 0,
              allowances.travel || 0,
              allowances.food || 0,
              (allowances.special || 0) + (allowances.other || 0),
              totalAllowances,
              deductions.professionalTax || 0,
              deductions.incomeTax || 0,
              deductions.providentFund || 0,
              deductions.healthInsurance || 0,
              deductions.loanRepayment || 0,
              (deductions.absentDeduction || 0) + (deductions.lateDeduction || 0) + (deductions.other || 0),
              totalDeductions,
              p.bonus || 0,
              p.netSalary || 0,
              p.paymentStatus || 'N/A',
              p.paymentDate ? format(new Date(p.paymentDate), 'dd/MM/yyyy') : 'N/A'
            ]);
          });
        } else {
          // Add a message row if no payroll data is available
          payrollSheet.addRow(['No payroll data available'].concat(Array(payrollHeaders.length - 1).fill('')));
        }
      } catch (error) {
        console.error('Error adding payroll data rows', error);
        payrollSheet.addRow(['Error processing payroll data'].concat(Array(payrollHeaders.length - 1).fill('')));
      }
      
      // Apply conditional formatting
      try {
        payrollSheet.eachRow((row, rowIndex) => {
          if (rowIndex > 1) { // Skip header row
            // Style alternating rows
            const rowColor = rowIndex % 2 === 0 ? 'F2F2F2' : 'FFFFFF';
            row.eachCell((cell, colIndex) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: rowColor }
              };
              
              // Add borders to all cells
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
              
              // Format currency cells
              if (colIndex >= 7 && colIndex <= 22 && colIndex !== 19) {
                cell.numFmt = '₹#,##0.00';
              }
              
              // Color code payment status
              if (colIndex === 23) {
                const status = cell.value;
                if (status === 'Paid') {
                  cell.font = { color: { argb: '00B050' } }; // Green
                } else if (status === 'Pending') {
                  cell.font = { color: { argb: 'FF9900' } }; // Orange
                } else if (status === 'Failed') {
                  cell.font = { color: { argb: 'FF0000' } }; // Red
                } else if (status === 'Processing') {
                  cell.font = { color: { argb: '0070C0' } }; // Blue
                }
              }
            });
          }
        });
      } catch (error) {
        console.warn('Error applying conditional formatting', error);
      }
      
      // Adjust column widths
      payrollSheet.columns.forEach(column => {
        column.width = 15;
      });
      payrollSheet.getColumn('B').width = 25; // Employee Name
      payrollSheet.getColumn('C').width = 20; // Department
      payrollSheet.getColumn('D').width = 20; // Position
      
      // Add a department summary sheet
      const deptSummarySheet = workbook.addWorksheet('Department Summary', {
        properties: { tabColor: { argb: 'FF9900' } }
      });
      
      // Add headers
      deptSummarySheet.addRow(['Department', 'Employee Count', 'Total Salary', 'Average Salary', 'Min Salary', 'Max Salary']);
      
      // Style the headers
      const deptHeaderRow = deptSummarySheet.getRow(1);
      deptHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' }
        };
        cell.alignment = { horizontal: 'center' };
      });
      
      // Add department data
      try {
        if (analytics.salaryByDepartment) {
          Object.entries(analytics.salaryByDepartment).forEach(([dept, data]) => {
            deptSummarySheet.addRow([
              dept,
              data.count || 0,
              data.total || 0,
              data.average || 0,
              data.min || 0,
              data.max || 0
            ]);
          });
        } else {
          deptSummarySheet.addRow(['No department data available', '', '', '', '', '']);
        }
      } catch (error) {
        console.warn('Error adding department data', error);
        deptSummarySheet.addRow(['Error', 'Failed to load department data', '', '', '', '']);
      }
      
      // Format numbers
      deptSummarySheet.eachRow((row, rowIndex) => {
        if (rowIndex > 1) {
          for (let i = 3; i <= 6; i++) {
            const cell = row.getCell(i);
            cell.numFmt = '₹#,##0.00';
          }
        }
      });
      
      // Set column widths
      deptSummarySheet.getColumn('A').width = 25;
      deptSummarySheet.getColumn('B').width = 15;
      deptSummarySheet.getColumn('C').width = 15;
      deptSummarySheet.getColumn('D').width = 15;
      deptSummarySheet.getColumn('E').width = 15;
      deptSummarySheet.getColumn('F').width = 15;
      
      // Add monthly trend sheet
      const trendSheet = workbook.addWorksheet('Monthly Trend', {
        properties: { tabColor: { argb: 'A9D08E' } }
      });
      
      // Add headers
      trendSheet.addRow(['Month', 'Total Salary', 'Tax Deductions', 'Bonuses', 'Employee Count', 'Average Salary']);
      
      // Style the headers
      const trendHeaderRow = trendSheet.getRow(1);
      trendHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' }
        };
        cell.alignment = { horizontal: 'center' };
      });
      
      // Add trend data
      try {
        if (analytics.salaryTrend && Array.isArray(analytics.salaryTrend)) {
          analytics.salaryTrend.forEach(item => {
            if (item) {
              const employeeCount = item.employeeCount || 0;
              const totalSalary = item.totalSalary || 0;
              const avgSalary = employeeCount > 0 ? totalSalary / employeeCount : 0;
              
              trendSheet.addRow([
                item.period || 'N/A',
                totalSalary,
                item.taxes || 0,
                item.bonus || 0,
                employeeCount,
                avgSalary
              ]);
            }
          });
        } else {
          trendSheet.addRow(['No trend data available', 0, 0, 0, 0, 0]);
        }
      } catch (error) {
        console.warn('Error adding trend data', error);
        trendSheet.addRow(['Error', 'Failed to load trend data', 0, 0, 0, 0]);
      }
      
      // Format numbers
      trendSheet.eachRow((row, rowIndex) => {
        if (rowIndex > 1) {
          for (let i = 2; i <= 4; i++) {
            const cell = row.getCell(i);
            cell.numFmt = '₹#,##0.00';
          }
          const avgCell = row.getCell(6);
          avgCell.numFmt = '₹#,##0.00';
        }
      });
      
      // Set column widths
      trendSheet.getColumn('A').width = 15;
      trendSheet.getColumn('B').width = 15;
      trendSheet.getColumn('C').width = 15;
      trendSheet.getColumn('D').width = 15;
      trendSheet.getColumn('E').width = 15;
      trendSheet.getColumn('F').width = 15;
      
      // Generate file name with date range
      const fileName = `Textlaire_Payroll_Report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;
      
      try {
        // Write the workbook to a buffer and save
        const buffer = await workbook.xlsx.writeBuffer();
        if (!buffer) {
          throw new Error('Failed to generate Excel buffer');
        }
        
        saveAs(new Blob([buffer]), fileName);
        toast.success('Enhanced Excel report downloaded successfully', { id: toastId });
      } catch (saveError) {
        console.error('Error saving Excel file:', saveError);
        toast.error('Failed to save Excel file: ' + saveError.message, { id: toastId });
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export detailed Excel report: ' + (error.message || 'Unknown error'));
    } finally {
      setExportLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no data yet
  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
        <FaChartPie className="text-5xl mb-4" />
        <p>No report data available. Please adjust filters and try again.</p>
      </div>
    );
  }

  // Chart data preparation for department distribution
  const departmentChartData = {
    labels: Object.keys(reportData.analytics.salaryByDepartment),
    datasets: [
      {
        label: 'Total Salary by Department',
        data: Object.values(reportData.analytics.salaryByDepartment).map(d => d.total),
        backgroundColor: [
          '#4299e1', '#48bb78', '#f6ad55', '#f56565', '#9f7aea',
          '#ed64a6', '#38b2ac', '#667eea', '#f687b3', '#68d391',
          '#c53030', '#4fd1c5', '#9f7aea'
        ],
        hoverOffset: 4
      }
    ]
  };

  // Chart data for monthly trend
  const trendChartData = {
    labels: reportData.analytics.salaryTrend.map(t => t.period),
    datasets: [
      {
        label: 'Total Salary',
        data: reportData.analytics.salaryTrend.map(t => t.totalSalary),
        borderColor: '#4299e1',
        backgroundColor: 'rgba(66, 153, 225, 0.2)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Tax Deductions',
        data: reportData.analytics.salaryTrend.map(t => t.taxes),
        borderColor: '#f56565',
        backgroundColor: 'rgba(245, 101, 101, 0.2)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Bonus',
        data: reportData.analytics.salaryTrend.map(t => t.bonus),
        borderColor: '#48bb78',
        backgroundColor: 'rgba(72, 187, 120, 0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  // Chart data for payment status distribution
  const paymentStatusChartData = {
    labels: Object.keys(reportData.analytics.paymentStatusDistribution),
    datasets: [
      {
        label: 'Payment Status',
        data: Object.values(reportData.analytics.paymentStatusDistribution),
        backgroundColor: [
          '#48bb78', // Paid - Green
          '#f6ad55', // Pending - Orange
          '#f56565', // Failed - Red
          '#4299e1'  // Processing - Blue
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">
          Payroll Reports & Analytics
        </h2>
        
        {/* Export button */}
        <button
          onClick={handleExportToExcel}
          disabled={exportLoading}
          className={`flex items-center px-4 py-2 ${exportLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded transition-colors duration-200`}
        >
          {exportLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
              Exporting...
            </>
          ) : (
            <>
              <FaFileExcel className="mr-2" />
              Enhanced Excel Export
            </>
          )}
        </button>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCalendarAlt className="text-gray-400" />
            </div>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCalendarAlt className="text-gray-400" />
            </div>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Department
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaBuilding className="text-gray-400" />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            >
              {departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500'}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'departments' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500'}`}
          onClick={() => setActiveTab('departments')}
        >
          Departments
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'trends' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500'}`}
          onClick={() => setActiveTab('trends')}
        >
          Salary Trends
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Total Payroll</h3>
                <p className="text-3xl font-bold">₹{reportData.analytics.totalPayroll.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p className="text-sm mt-2">{reportData.analytics.totalEmployees} employees</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Average Salary</h3>
                <p className="text-3xl font-bold">₹{reportData.analytics.avgSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p className="text-sm mt-2">Per employee</p>
              </div>
              
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Tax Deductions</h3>
                <p className="text-3xl font-bold">₹{reportData.analytics.taxDeductions.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p className="text-sm mt-2">Total for period</p>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Bonus Distributed</h3>
                <p className="text-3xl font-bold">₹{reportData.analytics.bonusDistributed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p className="text-sm mt-2">Total incentives</p>
              </div>
            </div>

            {/* Payment Status Chart */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Payment Status Distribution</h3>
              <div className="h-72 w-full">
                <Pie data={paymentStatusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
              </div>
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Salary Distribution by Department</h3>
              <div className="h-80 w-full">
                <Pie data={departmentChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employees</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Payroll</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Average Salary</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(reportData.analytics.salaryByDepartment).map(([dept, data]) => (
                    <tr key={dept} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{dept}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{data.employees}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{data.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{data.average.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Monthly Salary, Tax & Bonus Trend</h3>
              <div className="h-80 w-full">
                <Line data={trendChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Average Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tax Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bonus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employees</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.analytics.salaryTrend.map((trend) => (
                    <tr key={trend.period} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{trend.period}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{trend.totalSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{trend.averageSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{trend.taxes.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{trend.bonus.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{trend.employees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollReportsDashboard;
