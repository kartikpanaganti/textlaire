import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const exportToExcel = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(record => ({
      Employee: record.employeeId.name,
      Date: record.date,
      Status: record.status,
      'Check In': record.checkIn,
      'Check Out': record.checkOut,
      Shift: record.shift
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
  XLSX.writeFile(workbook, "attendance_report.xlsx");
};

export const exportToPDF = (data) => {
  const doc = new jsPDF();
  
  doc.autoTable({
    head: [['Employee', 'Date', 'Status', 'Check In', 'Check Out', 'Shift']],
    body: data.map(record => [
      record.employeeId.name,
      record.date,
      record.status,
      record.checkIn,
      record.checkOut || 'Not checked out',
      record.shift
    ])
  });

  doc.save('attendance_report.pdf');
};
