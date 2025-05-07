import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Basic export function (kept for compatibility)
export const exportToExcel = (data, filename = 'attendance_report') => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(record => ({
      Employee: record.employeeId?.name || 'Unknown',
      Date: record.date ? new Date(record.date).toLocaleDateString() : '',
      Status: record.status,
      'Check In': record.checkIn,
      'Check Out': record.checkOut || 'Not checked out',
      Shift: record.shift
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Enhanced export function with better formatting
export const exportToExcelEnhanced = async (data, dateRange = '') => {
  try {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Textlaire';
    workbook.lastModifiedBy = 'Textlaire';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const worksheet = workbook.addWorksheet('Attendance Data', {
      properties: { tabColor: { argb: '4167B8' } }
    });
    
    // ===== HEADER SECTION =====
    // Create title row
    const headerRow = worksheet.addRow(['TEXTLAIRE - ATTENDANCE DATA']);
    // We need to merge all cells in the first row
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = {
      name: 'Arial',
      size: 16,
      bold: true,
      color: { argb: '1A56DB' }
    };
    titleCell.alignment = { horizontal: 'center' };
    headerRow.height = 30;
    
    // Add date row
    const dateRow = worksheet.addRow(['']);
    worksheet.mergeCells('A2:I2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Generated on: ${new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}${dateRange ? ` | Period: ${dateRange}` : ''}`;
    dateCell.font = {
      name: 'Arial',
      size: 10,
      italic: true,
      color: { argb: '6B7280' }
    };
    dateCell.alignment = { horizontal: 'center' };
    
    // Add summary stats header
    const summaryHeaderRow = worksheet.addRow(['Attendance Summary']);
    worksheet.mergeCells('A3:D3');
    const summaryCell = worksheet.getCell('A3');
    summaryCell.font = {
      name: 'Arial',
      size: 12,
      bold: true
    };
    
    // Calculate summary statistics
    const totalRecords = data.length;
    const presentCount = data.filter(r => r.status === 'Present').length;
    const absentCount = data.filter(r => r.status === 'Absent').length;
    const lateCount = data.filter(r => r.status === 'Late').length;
    const leaveCount = data.filter(r => r.status === 'On Leave').length;
    
    // Add stats in a row
    const statsRow = worksheet.addRow([
      `Total Records: ${totalRecords}`,
      `Present: ${presentCount}`,
      `Absent: ${absentCount}`,
      `Late: ${lateCount}`,
      `On Leave: ${leaveCount}`
    ]);
    statsRow.font = { name: 'Arial', size: 10 };
    statsRow.height = 20;
    
    // Add empty row for spacing
    worksheet.addRow([]);
    
    // ===== DATA TABLE SECTION =====
    // Add column headers row
    const columnHeaders = [
      'Employee', 'Date', 'Status', 'Check In', 'Check Out', 'Shift', 'Total Hours', 'Overtime', 'Notes'
    ];
    const tableHeaderRow = worksheet.addRow(columnHeaders);
    
    // Style the table header row
    tableHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1A56DB' }
      };
      cell.font = {
        name: 'Arial',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFF' }
      };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    tableHeaderRow.height = 20;
    
    // Set column widths
    worksheet.getColumn(1).width = 25;  // Employee
    worksheet.getColumn(2).width = 15;  // Date
    worksheet.getColumn(3).width = 12;  // Status
    worksheet.getColumn(4).width = 12;  // Check In
    worksheet.getColumn(5).width = 12;  // Check Out
    worksheet.getColumn(6).width = 12;  // Shift
    worksheet.getColumn(7).width = 12;  // Total Hours
    worksheet.getColumn(8).width = 12;  // Overtime
    worksheet.getColumn(9).width = 25;  // Notes
    
    // Helper function to calculate hours between times
    const calculateHours = (checkIn, checkOut) => {
      if (!checkIn || !checkOut) return 0;
      
      // Convert times to Date objects for the current day
      const today = new Date();
      const [startHour, startMinute] = checkIn.split(':').map(Number);
      const [endHour, endMinute] = checkOut.split(':').map(Number);
      
      const startTime = new Date(today.setHours(startHour, startMinute, 0));
      let endTime = new Date(today.setHours(endHour, endMinute, 0));
      
      // Handle overnight shifts
      if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }
      
      // Calculate total hours worked
      const totalMinutes = (endTime - startTime) / (1000 * 60);
      return (totalMinutes / 60).toFixed(2);
    };
    
    // Helper function to calculate overtime
    const calculateOvertime = (totalHours, shift) => {
      if (!totalHours) return 0;
      
      const standardHours = 8;
      let overtime = 0;
      
      if (totalHours > standardHours) {
        overtime = (totalHours - standardHours).toFixed(2);
      }
      
      return overtime;
    };
    
    // Add data rows
    data.forEach(record => {
      const totalHours = calculateHours(record.checkIn, record.checkOut);
      const overtime = calculateOvertime(totalHours, record.shift);
      
      const dataRow = worksheet.addRow([
        record.employeeId?.name || 'Unknown',
        record.date ? new Date(record.date).toLocaleDateString() : '',
        record.status,
        record.checkIn || '',
        record.checkOut || '',
        record.shift || '',
        totalHours,
        overtime,
        record.notes || ''
      ]);
      
      // Style the status cell based on attendance status
      const statusCell = dataRow.getCell(3);
      
      if (record.status === 'Present') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DCFCE7' } // Light green
        };
        statusCell.font = { color: { argb: '166534' } }; // Dark green
      } else if (record.status === 'Absent') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCCCB' } // Light red
        };
        statusCell.font = { color: { argb: 'B91C1C' } }; // Dark red
      } else if (record.status === 'Late') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FEF9C3' } // Light yellow
        };
        statusCell.font = { color: { argb: '854D0E' } }; // Dark yellow
      } else if (record.status === 'On Leave') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E0E7FF' } // Light blue
        };
        statusCell.font = { color: { argb: '3730A3' } }; // Dark blue
      }
      
      // Add borders to all cells in the row
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle' };
      });
    });
    
    // Add a footer
    const lastRow = worksheet.lastRow.number + 2;
    worksheet.mergeCells(`A${lastRow}:I${lastRow}`);
    const footerCell = worksheet.getCell(`A${lastRow}`);
    footerCell.value = 'Textlaire - Confidential';
    footerCell.font = {
      name: 'Arial',
      size: 10,
      italic: true,
      color: { argb: '6B7280' }
    };
    footerCell.alignment = { horizontal: 'center' };
    
    // Generate Excel file using FileSaver's saveAs function
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Use XLSX.writeFile which doesn't use blob URLs
    const filename = `Textlaire_Attendance_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Use the saveAs function from file-saver
    saveAs(blob, filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

export const exportToPDF = (data) => {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Black color for better visibility
    doc.text('TEXTLAIRE - ATTENDANCE DATA', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black color for better visibility
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
    
    // Prepare data for table
    const tableColumn = ['Employee', 'Date', 'Status', 'Check In', 'Check Out', 'Shift'];
    const tableRows = [];
    
    // Format data for table
    data.forEach(record => {
      const rowData = [
        record.employeeId?.name || 'Unknown',
        record.date ? new Date(record.date).toLocaleDateString() : '',
        record.status || '',
        record.checkIn || '',
        record.checkOut || 'Not checked out',
        record.shift || ''
      ];
      tableRows.push(rowData);
    });
    
    // Create the table manually
    let startY = 30;
    const margin = 10;
    const cellWidth = 30;
    const cellHeight = 10;
    
    // Draw header row - no background color, just borders
    doc.setDrawColor(0, 0, 0); // Black borders
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFontSize(10);
    
    tableColumn.forEach((header, i) => {
      // Draw header cell with border only
      doc.rect(margin + (i * cellWidth), startY, cellWidth, cellHeight, 'S'); // Stroke only, no fill
      
      // Draw header text
      doc.text(header, margin + (i * cellWidth) + 2, startY + 7);
    });
    
    // Draw data rows - no background colors
    tableRows.forEach((row, rowIndex) => {
      const rowY = startY + ((rowIndex + 1) * cellHeight);
      
      // Draw each cell in the row
      row.forEach((cell, cellIndex) => {
        // Draw cell with border only, no background
        doc.rect(margin + (cellIndex * cellWidth), rowY, cellWidth, cellHeight, 'S'); // Stroke only, no fill
        
        // Draw cell text
        doc.setTextColor(0, 0, 0);
        doc.text(String(cell).substring(0, 15), margin + (cellIndex * cellWidth) + 2, rowY + 7);
      });
    });
    
    // Add footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black color for better visibility
    doc.text('Textlaire - Confidential', doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
    
    // Use jsPDF's built-in save method which doesn't use blob URLs
    const filename = `Textlaire_Attendance_Data_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};
