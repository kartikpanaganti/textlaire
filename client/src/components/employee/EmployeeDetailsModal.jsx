import { useState, useEffect, useRef } from 'react';
import { FiX, FiUser, FiMail, FiPhone, FiBriefcase, 
  FiCalendar, FiMapPin, FiAlertTriangle, FiClock, FiFileText, 
  FiTool, FiAward, FiShield, FiHome, FiCreditCard, FiPrinter,
  FiDownload, FiChevronDown, FiChevronUp, FiUsers, FiCheckCircle,
  FiEdit2, FiShare2, FiStar, FiActivity, FiCheck, FiTrash2, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { FaRupeeSign } from "react-icons/fa";
import AttendanceTab from './AttendanceTab';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import defaultProfileImage from '../../assets/images/default-profile.png';

const EmployeeDetailsModal = ({ employee, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    employment: true,
    bank: true,
    home: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const modalRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    details: true,
    attendance: false,
    includeImage: true,
    includeBankDetails: true,
    includeHomeDetails: true
  });

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getImageUrl = (url) => {
    if (!url) return defaultProfileImage;
    return url.startsWith('http') ? url : `http://${window.location.hostname}:5000${url}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handlePrintOptionsChange = (option) => {
    setPrintOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handlePrint = () => {
    // Create a sanitized filename
    const sanitizedName = employee.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedName}_Employee_Report.pdf`;

    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);

    // Write the content to the iframe
    const content = `
      <html>
        <head>
          <title>${employee.name} - Employee Report</title>
          <meta name="title" content="${employee.name} - Employee Report">
          <meta name="filename" content="${filename}">
          <style>
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #000000 !important;
              font-size: 10pt;
              background: #ffffff !important;
              margin: 0;
              padding: 0;
            }
            * {
              box-sizing: border-box;
              color: #000000 !important;
            }
            .header {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 3px solid #1a56db;
              position: relative;
              display: flex;
              align-items: center;
              page-break-after: avoid;
            }
            .header-logo {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: #1a56db;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              color: white !important;
              font-weight: bold;
              font-size: 24px;
            }
            .header-text {
              flex: 1;
            }
            .header h1 {
              color: #1a56db !important;
              margin: 0 0 5px 0;
              font-size: 24pt;
              font-weight: 700;
            }
            .header p {
              color: #6b7280 !important;
              margin: 0;
              font-size: 10pt;
            }
            .profile-section {
              display: flex;
              gap: 20px;
              margin-bottom: 20px;
              padding: 20px;
              background: linear-gradient(to right, #f8fafc, #f1f5f9);
              border-radius: 10px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.05);
              page-break-after: avoid;
            }
            .profile-image-container {
              width: 100px;
              height: 100px;
              border-radius: 50%;
              overflow: hidden;
              border: 3px solid #1a56db;
              background: white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .profile-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .profile-info {
              flex: 1;
            }
            .profile-info h2 {
              margin: 0 0 10px 0;
              font-size: 18pt;
              color: #111827 !important;
            }
            .profile-info p {
              margin: 5px 0;
              font-size: 11pt;
              color: #4b5563 !important;
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .profile-info p.subtitle {
              font-size: 12pt;
              color: #1f2937 !important;
              font-weight: 500;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 12px;
              border-radius: 30px;
              font-size: 10pt;
              font-weight: 600;
              margin-top: 5px;
              text-transform: uppercase;
            }
            .status-active {
              background: #dcfce7;
              color: #166534 !important;
            }
            .status-inactive {
              background: #fee2e2;
              color: #b91c1c !important;
            }
            .status-leave {
              background: #fef9c3;
              color: #854d0e !important;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              position: relative;
              color: #1e40af !important;
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 15px;
              padding-bottom: 10px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .section-title::after {
              content: "";
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100%;
              height: 1px;
              background: linear-gradient(to right, #1a56db, #dbeafe);
            }
            .section-title-icon {
              display: inline-flex;
              width: 24px;
              height: 24px;
              background: #dbeafe;
              border-radius: 50%;
              align-items: center;
              justify-content: center;
              color: #1e40af !important;
              font-size: 12pt;
              font-weight: bold;
            }
            .section-content {
              padding: 0;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
              gap: 5px;
              background: #f9fafb;
              padding: 10px 15px;
              border-radius: 8px;
              border-left: 3px solid #1a56db;
            }
            .info-label {
              font-weight: bold;
              color: #6b7280 !important;
              font-size: 9pt;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .info-value {
              color: #111827 !important;
              font-size: 11pt;
              font-weight: 500;
            }
            .attendance-summary {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .attendance-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
            }
            .attendance-title {
              font-size: 14pt;
              font-weight: bold;
              color: #1e40af !important;
            }
            .attendance-date {
              font-size: 10pt;
              color: #6b7280 !important;
            }
            .attendance-stats {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              justify-content: space-between;
            }
            .attendance-stat {
              flex: 1;
              min-width: 120px;
            }
            .attendance-stat-label {
              font-size: 9pt;
              color: #6b7280 !important;
              margin-bottom: 5px;
            }
            .attendance-stat-value {
              font-size: 16pt;
              font-weight: bold;
              color: #1e40af !important;
            }
            .attendance-stat-subtext {
              font-size: 8pt;
              color: #9ca3af !important;
            }
            .attendance-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 9pt;
              page-break-inside: auto;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            .attendance-table thead {
              display: table-header-group;
            }
            .attendance-table th,
            .attendance-table td {
              border: 1px solid #e5e7eb;
              padding: 8px 12px;
              text-align: left;
              color: #000000 !important;
            }
            .attendance-table th {
              background: #000000;
              font-weight: 600;
              color: #ffffff !important;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              font-size: 9pt;
            }
            .attendance-table tr:nth-child(even) {
              background: #f9fafb;
            }
            .attendance-table tr:hover {
              background: #f3f4f6;
            }
            .attendance-table tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            .attendance-table td:first-child {
              font-weight: 600;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280 !important;
              font-size: 9pt;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              gap: 5px;
            }
            .footer-logo {
              font-size: 12pt;
              font-weight: bold;
              color: #1e40af !important;
              margin-bottom: 5px;
            }
            .page-break {
              page-break-before: always;
            }
            .status-present {
              color: #166534 !important;
              font-weight: 600;
            }
            .status-weekend {
              color: #9ca3af !important;
              font-style: italic;
            }
            .status-absent {
              color: #b91c1c !important;
              font-weight: 600;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 80pt;
              color: rgba(0, 0, 0, 0.03) !important;
              z-index: -1;
              white-space: nowrap;
            }
            @media print {
              .no-print {
                display: none;
              }
              .page-break {
                page-break-before: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="watermark">CONFIDENTIAL</div>
          <div class="header">
            <div class="header-logo">ER</div>
            <div class="header-text">
              <h1>Employee Report</h1>
              <p>Generated on ${new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>

          <div class="profile-section">
            <div class="profile-image-container">
              <img src="${getImageUrl(employee.image)}" alt="${employee.name}" class="profile-image" crossorigin="anonymous" />
            </div>
            <div class="profile-info">
              <h2>${employee.name}</h2>
              <p class="subtitle">${employee.position}</p>
              <p>${employee.department}</p>
              <div class="status-badge ${
                employee.status === 'Active' ? 'status-active' : 
                employee.status === 'Inactive' ? 'status-inactive' : 
                employee.status === 'On Leave' ? 'status-leave' : ''
              }">
                ${employee.status}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="section-title-icon">👤</span>
              Personal Information
            </div>
            <div class="section-content">
              <div class="grid">
                <div class="info-item">
                  <span class="info-label">Employee ID</span>
                  <span class="info-value">${employee.employeeID}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">${employee.email || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Phone</span>
                  <span class="info-value">${employee.phoneNumber || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Emergency Contact</span>
                  <span class="info-value">${employee.emergencyContact || 'N/A'}</span>
                </div>
                ${employee.address ? `
                <div class="info-item" style="grid-column: span 2;">
                  <span class="info-label">Address</span>
                  <span class="info-value">${employee.address}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="section-title-icon">💼</span>
              Employment Details
            </div>
            <div class="section-content">
              <div class="grid">
                <div class="info-item">
                  <span class="info-label">Department</span>
                  <span class="info-value">${employee.department}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Position</span>
                  <span class="info-value">${employee.position}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Work Type</span>
                  <span class="info-value">${employee.workType || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Joining Date</span>
                  <span class="info-value">${formatDate(employee.joiningDate)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Salary</span>
                  <span class="info-value">₹${employee.salary.toLocaleString('en-IN')}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status</span>
                  <span class="info-value">${employee.status}</span>
                </div>
              </div>
            </div>
          </div>

          ${employee.bankName || employee.accountNumber || employee.accountHolderName || employee.ifscCode ? `
          <div class="section">
            <div class="section-title">
              <span class="section-title-icon">🏦</span>
              Bank Details
            </div>
            <div class="section-content">
              <div class="grid">
                <div class="info-item">
                  <span class="info-label">Bank Name</span>
                  <span class="info-value">${employee.bankName || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Account Number</span>
                  <span class="info-value">${employee.accountNumber || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Account Holder</span>
                  <span class="info-value">${employee.accountHolderName || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">IFSC Code</span>
                  <span class="info-value">${employee.ifscCode || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          ` : ''}

          ${employee.homeAddress || employee.homePhone || employee.homeEmail ? `
          <div class="section">
            <div class="section-title">
              <span class="section-title-icon">🏡</span>
              Home Details
            </div>
            <div class="section-content">
              <div class="grid">
                ${employee.homeAddress ? `
                <div class="info-item" style="grid-column: span 2;">
                  <span class="info-label">Home Address</span>
                  <span class="info-value">${employee.homeAddress}</span>
                </div>
                ` : ''}
                <div class="info-item">
                  <span class="info-label">Home Phone</span>
                  <span class="info-value">${employee.homePhone || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Home Email</span>
                  <span class="info-value">${employee.homeEmail || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          ` : ''}

          <div class="page-break"></div>

          <div class="section">
            <div class="section-title">
              <span class="section-title-icon">📅</span>
              Current Month Attendance
            </div>
            <div class="section-content">
              <div class="attendance-summary">
                <div class="attendance-header">
                  <div class="attendance-title">Attendance Summary</div>
                  <div class="attendance-date">${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                </div>
                <div class="attendance-stats">
                  <div class="attendance-stat">
                    <div class="attendance-stat-label">Working Days</div>
                    <div class="attendance-stat-value">${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - 8}</div>
                    <div class="attendance-stat-subtext">Total Days: ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}</div>
                  </div>
                  <div class="attendance-stat">
                    <div class="attendance-stat-label">Present Days</div>
                    <div class="attendance-stat-value">${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - 8}</div>
                    <div class="attendance-stat-subtext">100% Attendance</div>
                  </div>
                  <div class="attendance-stat">
                    <div class="attendance-stat-label">Weekends</div>
                    <div class="attendance-stat-value">8</div>
                    <div class="attendance-stat-subtext">Sat & Sun</div>
                  </div>
                </div>
              </div>
              <table class="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  ${Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }, (_, i) => {
                    const date = new Date(new Date().getFullYear(), new Date().getMonth(), i + 1);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const status = isWeekend ? 'Weekend' : 'Present';
                    const checkIn = isWeekend ? '-' : '09:00 AM';
                    const checkOut = isWeekend ? '-' : '06:00 PM';
                    const hours = isWeekend ? '-' : '9';
                    return `
                      <tr>
                        <td>${i + 1} ${date.toLocaleString('default', { month: 'short' })}</td>
                        <td class="status-${status.toLowerCase()}">${status}</td>
                        <td>${checkIn}</td>
                        <td>${checkOut}</td>
                        <td>${hours}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="footer">
            <div class="footer-logo">TEXTLAIRE</div>
            <p>This report is computer-generated and does not require a signature.</p>
            <p>Confidential - For authorized personnel only.</p>
            <p>&copy; ${new Date().getFullYear()} - All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    printFrame.contentWindow.document.write(content);
    printFrame.contentWindow.document.close();

    // Wait for images to load before printing
    printFrame.onload = () => {
      // Create a download link with the correct filename
      const link = document.createElement('a');
      link.href = '#';
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);

      // Set the document title
      printFrame.contentWindow.document.title = `${employee.name} - Employee Report`;
      
      // Focus and print
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(link);
        document.body.removeChild(printFrame);
      }, 1000);
    };
  };

  const handleExport = async () => {
    try {
      // Create a temporary div to render the content
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = `
        <div class="export-container">
          <style>
            @page {
              size: A4;
              margin: 1cm;
            }
            .export-container {
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #000000 !important;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              background: #ffffff !important;
            }
            * {
              box-sizing: border-box;
              color: #000000 !important;
            }
            .header {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 3px solid #1a56db;
              position: relative;
              display: flex;
              align-items: center;
              page-break-after: avoid;
            }
            .header-logo {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: #1a56db;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              color: white !important;
              font-weight: bold;
              font-size: 24px;
            }
            .header-text {
              flex: 1;
            }
            .header h1 {
              color: #1a56db !important;
              margin: 0 0 5px 0;
              font-size: 24pt;
              font-weight: 700;
            }
            .header p {
              color: #6b7280 !important;
              margin: 0;
              font-size: 10pt;
            }
            .profile-section {
              display: flex;
              gap: 20px;
              margin-bottom: 20px;
              padding: 20px;
              background: linear-gradient(to right, #f8fafc, #f1f5f9);
              border-radius: 10px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.05);
              page-break-after: avoid;
            }
            .profile-image-container {
              width: 100px;
              height: 100px;
              border-radius: 50%;
              overflow: hidden;
              border: 3px solid #1a56db;
              background: white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .profile-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .profile-info {
              flex: 1;
            }
            .profile-info h2 {
              margin: 0 0 10px 0;
              font-size: 18pt;
              color: #111827 !important;
            }
            .profile-info p {
              margin: 5px 0;
              font-size: 11pt;
              color: #4b5563 !important;
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .profile-info p.subtitle {
              font-size: 12pt;
              color: #1f2937 !important;
              font-weight: 500;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 12px;
              border-radius: 30px;
              font-size: 10pt;
              font-weight: 600;
              margin-top: 5px;
              text-transform: uppercase;
            }
            .status-active {
              background: #dcfce7;
              color: #166534 !important;
            }
            .status-inactive {
              background: #fee2e2;
              color: #b91c1c !important;
            }
            .status-leave {
              background: #fef9c3;
              color: #854d0e !important;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              position: relative;
              color: #1e40af !important;
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 15px;
              padding-bottom: 10px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .section-title::after {
              content: "";
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100%;
              height: 1px;
              background: linear-gradient(to right, #1a56db, #dbeafe);
            }
            .section-title-icon {
              display: inline-flex;
              width: 24px;
              height: 24px;
              background: #dbeafe;
              border-radius: 50%;
              align-items: center;
              justify-content: center;
              color: #1e40af !important;
              font-size: 12pt;
              font-weight: bold;
            }
            .section-content {
              padding: 0;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
              gap: 5px;
              background: #f9fafb;
              padding: 10px 15px;
              border-radius: 8px;
              border-left: 3px solid #1a56db;
            }
            .info-label {
              font-weight: bold;
              color: #6b7280 !important;
              font-size: 9pt;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .info-value {
              color: #111827 !important;
              font-size: 11pt;
              font-weight: 500;
            }
            .attendance-summary {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .attendance-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
            }
            .attendance-title {
              font-size: 14pt;
              font-weight: bold;
              color: #1e40af !important;
            }
            .attendance-date {
              font-size: 10pt;
              color: #6b7280 !important;
            }
            .attendance-stats {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              justify-content: space-between;
            }
            .attendance-stat {
              flex: 1;
              min-width: 120px;
            }
            .attendance-stat-label {
              font-size: 9pt;
              color: #6b7280 !important;
              margin-bottom: 5px;
            }
            .attendance-stat-value {
              font-size: 16pt;
              font-weight: bold;
              color: #1e40af !important;
            }
            .attendance-stat-subtext {
              font-size: 8pt;
              color: #9ca3af !important;
            }
            .attendance-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 9pt;
              page-break-inside: auto;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            .attendance-table thead {
              display: table-header-group;
            }
            .attendance-table th,
            .attendance-table td {
              border: 1px solid #e5e7eb;
              padding: 8px 12px;
              text-align: left;
              color: #000000 !important;
            }
            .attendance-table th {
              background: #000000;
              font-weight: 600;
              color: #ffffff !important;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              font-size: 9pt;
            }
            .attendance-table tr:nth-child(even) {
              background: #f9fafb;
            }
            .attendance-table tr:hover {
              background: #f3f4f6;
            }
            .attendance-table tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            .attendance-table td:first-child {
              font-weight: 600;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280 !important;
              font-size: 9pt;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              gap: 5px;
            }
            .footer-logo {
              font-size: 12pt;
              font-weight: bold;
              color: #1e40af !important;
              margin-bottom: 5px;
            }
            .page-break {
              page-break-before: always;
            }
            .status-present {
              color: #166534 !important;
              font-weight: 600;
            }
            .status-weekend {
              color: #9ca3af !important;
              font-style: italic;
            }
            .status-absent {
              color: #b91c1c !important;
              font-weight: 600;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 80pt;
              color: rgba(0, 0, 0, 0.03) !important;
              z-index: -1;
              white-space: nowrap;
            }
          </style>

          <div class="watermark">CONFIDENTIAL</div>
          <div class="header">
            <div class="header-logo">ER</div>
            <div class="header-text">
              <h1>Employee Report</h1>
              <p>Generated on ${new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>

          <div class="profile-section">
            <div class="profile-image-container">
              <img src="${getImageUrl(employee.image)}" alt="${employee.name}" class="profile-image" crossorigin="anonymous" />
            </div>
            <div class="profile-info">
              <h2>${employee.name}</h2>
              <p class="subtitle">${employee.position}</p>
              <p>${employee.department}</p>
              <div class="status-badge ${
                employee.status === 'Active' ? 'status-active' : 
                employee.status === 'Inactive' ? 'status-inactive' : 
                employee.status === 'On Leave' ? 'status-leave' : ''
              }">
                ${employee.status}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="section-title-icon">👤</span>
              Personal Information
            </div>
            <div class="section-content">
              <div class="grid">
                <div class="info-item">
                  <span class="info-label">Employee ID</span>
                  <span class="info-value">${employee.employeeID}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">${employee.email || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Phone</span>
                  <span class="info-value">${employee.phoneNumber || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Emergency Contact</span>
                  <span class="info-value">${employee.emergencyContact || 'N/A'}</span>
                </div>
                ${employee.address ? `
                <div class="info-item" style="grid-column: span 2;">
                  <span class="info-label">Address</span>
                  <span class="info-value">${employee.address}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="section-title-icon">💼</span>
              Employment Details
            </div>
            <div class="section-content">
              <div class="grid">
                <div class="info-item">
                  <span class="info-label">Department</span>
                  <span class="info-value">${employee.department}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Position</span>
                  <span class="info-value">${employee.position}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Work Type</span>
                  <span class="info-value">${employee.workType || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Joining Date</span>
                  <span class="info-value">${formatDate(employee.joiningDate)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Salary</span>
                  <span class="info-value">₹${employee.salary.toLocaleString()}</div>
                </div>
                <div class="info-item">
                  <span class="info-label">Status</span>
                  <span class="info-value">${employee.status}</span>
                </div>
              </div>
            </div>
          </div>

          ${employee.bankName || employee.accountNumber || employee.accountHolderName || employee.ifscCode ? `
          <div class="section">
            <div class="section-title">
              <span class="section-title-icon">🏦</span>
              Bank Details
            </div>
            <div class="section-content">
              <div class="grid">
                <div class="info-item">
                  <span class="info-label">Bank Name</span>
                  <span class="info-value">${employee.bankName || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Account Number</span>
                  <span class="info-value">${employee.accountNumber || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Account Holder</span>
                  <span class="info-value">${employee.accountHolderName || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">IFSC Code</span>
                  <span class="info-value">${employee.ifscCode || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          ` : ''}

          ${employee.homeAddress || employee.homePhone || employee.homeEmail ? `
          <div class="section">
            <div class="section-title">
              <span class="section-title-icon">🏡</span>
              Home Details
            </div>
            <div class="section-content">
              <div class="grid">
                ${employee.homeAddress ? `
                <div class="info-item" style="grid-column: span 2;">
                  <span class="info-label">Home Address</span>
                  <span class="info-value">${employee.homeAddress}</span>
                </div>
                ` : ''}
                <div class="info-item">
                  <span class="info-label">Home Phone</span>
                  <span class="info-value">${employee.homePhone || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Home Email</span>
                  <span class="info-value">${employee.homeEmail || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          ` : ''}

          <div class="page-break"></div>

          <div class="section">
            <div class="section-title">
              <span class="section-title-icon">📅</span>
              Current Month Attendance
            </div>
            <div class="section-content">
              <div class="attendance-summary">
                <div class="attendance-header">
                  <div class="attendance-title">Attendance Summary</div>
                  <div class="attendance-date">${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                </div>
                <div class="attendance-stats">
                  <div class="attendance-stat">
                    <div class="attendance-stat-label">Working Days</div>
                    <div class="attendance-stat-value">${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - 8}</div>
                    <div class="attendance-stat-subtext">Total Days: ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}</div>
                  </div>
                  <div class="attendance-stat">
                    <div class="attendance-stat-label">Present Days</div>
                    <div class="attendance-stat-value">${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - 8}</div>
                    <div class="attendance-stat-subtext">100% Attendance</div>
                  </div>
                  <div class="attendance-stat">
                    <div class="attendance-stat-label">Weekends</div>
                    <div class="attendance-stat-value">8</div>
                    <div class="attendance-stat-subtext">Sat & Sun</div>
                  </div>
                </div>
              </div>
              <table class="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  ${Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }, (_, i) => {
                    const date = new Date(new Date().getFullYear(), new Date().getMonth(), i + 1);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const status = isWeekend ? 'Weekend' : 'Present';
                    const checkIn = isWeekend ? '-' : '09:00 AM';
                    const checkOut = isWeekend ? '-' : '06:00 PM';
                    const hours = isWeekend ? '-' : '9';
                    return `
                      <tr>
                        <td>${i + 1} ${date.toLocaleString('default', { month: 'short' })}</td>
                        <td class="status-${status.toLowerCase()}">${status}</td>
                        <td>${checkIn}</td>
                        <td>${checkOut}</td>
                        <td>${hours}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="footer">
            <div class="footer-logo">TEXTLAIRE</div>
            <p>This report is computer-generated and does not require a signature.</p>
            <p>Confidential - For authorized personnel only.</p>
            <p>&copy; ${new Date().getFullYear()} - All rights reserved.</p>
          </div>
        </div>
      `;

      // Add the content to the document
      document.body.appendChild(contentDiv);

      // Convert the content to canvas with higher quality
      const canvas = await html2canvas(contentDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        windowHeight: contentDiv.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure all text is black in the cloned document
          const elements = clonedDoc.getElementsByTagName('*');
          for (let element of elements) {
            if (element.tagName !== 'IMG') {
              element.style.color = '#000000';
            }
          }
          // Ensure headers are white
          const headers = clonedDoc.querySelectorAll('.attendance-table th');
          headers.forEach(header => {
            header.style.color = '#ffffff';
          });
        }
      });

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit the content
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297; // A4 height in mm

      // Add the canvas to the PDF with proper page breaks
      let heightLeft = imgHeight;
      let position = 0;
      let pageCount = 0;

      // First page
      pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      pageCount++;

      // Add subsequent pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        pageCount++;
      }

      // Save the PDF
      const sanitizedName = employee.name.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`${sanitizedName}_Employee_Report.pdf`);

      // Clean up
      document.body.removeChild(contentDiv);
      
      toast.success('Employee details exported as PDF successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export employee details as PDF.');
    }
  };

  const handleShare = async () => {
    try {
      // Create a shareable text with employee details
      const shareText = `
Employee Details:
Name: ${employee.name}
Position: ${employee.position}
Department: ${employee.department}
Employee ID: ${employee.employeeID}
Email: ${employee.email || 'N/A'}
Phone: ${employee.phoneNumber || 'N/A'}
Status: ${employee.status}
      `.trim();

      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: `${employee.name} - Employee Details`,
          text: shareText,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareText);
        toast.success('Employee details copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share employee details.');
    }
  };

  const toggleFavorite = async () => {
    try {
      // Here you would typically make an API call to update the favorite status
      // For now, we'll just toggle the local state
      setIsFavorite(!isFavorite);
      
      // Show success message
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      
      // You can add API call here to persist the favorite status
      // await apiClient.post(`/api/employees/${employee._id}/favorite`, { isFavorite: !isFavorite });
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const calculatePayrollDetails = (baseSalary) => {
    // Basic Salary (60% of CTC)
    const basicSalary = baseSalary * 0.6;
    
    // House Rent Allowance (15% of CTC)
    const hra = baseSalary * 0.15;
    
    // Special Allowance (10% of CTC)
    const specialAllowance = baseSalary * 0.10;
    
    // Performance Bonus (15% of CTC)
    const bonus = baseSalary * 0.15;

    // Deductions
    const incomeTax = baseSalary * 0.05;  // 5% TDS
    const providentFund = baseSalary * 0.04;  // 4% PF
    const healthInsurance = baseSalary * 0.02;  // 2% Health Insurance
    const professionalTax = baseSalary * 0.01;  // 1% Professional Tax

    const totalEarnings = basicSalary + hra + specialAllowance + bonus;
    const totalDeductions = incomeTax + providentFund + healthInsurance + professionalTax;
    const netSalary = totalEarnings - totalDeductions;

    return {
      earnings: {
        basic: basicSalary,
        hra,
        specialAllowance,
        bonus,
        total: totalEarnings
      },
      deductions: {
        incomeTax,
        providentFund,
        healthInsurance,
        professionalTax,
        total: totalDeductions
      },
      netSalary
    };
  };

  const generatePaymentHistory = (employee) => {
    const currentDate = new Date();
    const history = [];

    for (let i = 0; i < 12; i++) {
      const paymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const payrollDetails = calculatePayrollDetails(employee.salary);
      
      history.push({
        period: paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        netSalary: payrollDetails.netSalary,
        paymentDate: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 28), // Payment on 28th
        mode: i % 2 === 0 ? 'Bank Transfer' : 'Direct Deposit',
        status: i === 0 ? 'Processing' : i === 1 ? 'Pending' : 'Completed',
        deductions: payrollDetails.deductions.total,
        earnings: payrollDetails.earnings.total,
        reference: `SAL${paymentDate.getFullYear()}${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}${employee.employeeID}`
      });
    }

    return history;
  };

  const downloadPaySlip = async (employee, month) => {
    try {
      const payrollDetails = calculatePayrollDetails(employee.salary);
      const doc = new jsPDF();
      
      // Add company header
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 139);
      doc.text('TEXTLAIRE', 105, 20, { align: 'center' });
      
      // Add payslip title
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Salary Slip - ${month}`, 105, 30, { align: 'center' });
      
      // Add employee details
      doc.setFontSize(12);
      doc.text([
        `Employee Name: ${employee.name}`,
        `Employee ID: ${employee.employeeID}`,
        `Department: ${employee.department}`,
        `Position: ${employee.position}`,
        `Bank Account: XXXX${employee.accountNumber?.slice(-4) || 'XXXX'}`,
        '',
        'Earnings:',
        `Basic Salary: ₹${payrollDetails.earnings.basic.toLocaleString()}`,
        `HRA: ₹${payrollDetails.earnings.hra.toLocaleString()}`,
        `Special Allowance: ₹${payrollDetails.earnings.specialAllowance.toLocaleString()}`,
        `Bonus: ₹${payrollDetails.earnings.bonus.toLocaleString()}`,
        `Total Earnings: ₹${payrollDetails.earnings.total.toLocaleString()}`,
        '',
        'Deductions:',
        `Income Tax (TDS): ₹${payrollDetails.deductions.incomeTax.toLocaleString()}`,
        `Provident Fund: ₹${payrollDetails.deductions.providentFund.toLocaleString()}`,
        `Health Insurance: ₹${payrollDetails.deductions.healthInsurance.toLocaleString()}`,
        `Professional Tax: ₹${payrollDetails.deductions.professionalTax.toLocaleString()}`,
        `Total Deductions: ₹${payrollDetails.deductions.total.toLocaleString()}`,
        '',
        `Net Salary: ₹${payrollDetails.netSalary.toLocaleString()}`
      ], 20, 50);
      
      // Add footer
      doc.setFontSize(10);
      doc.text('This is a computer-generated document and does not require a signature.', 105, 280, { align: 'center' });
      
      // Save the PDF
      doc.save(`${employee.name.replace(/\s+/g, '_')}_Payslip_${month.replace(/\s+/g, '_')}.pdf`);
      
      toast.success('Pay slip downloaded successfully!');
    } catch (error) {
      console.error('Error generating pay slip:', error);
      toast.error('Failed to download pay slip. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading employee details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          ref={modalRef} 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden animate-fade-in"
          style={{ margin: isMobile ? '0.5rem' : 'auto' }}
        >
          {/* Header Section - Fixed */}
          <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-lg sticky top-0 z-10">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }} />
            </div>

            {/* Profile Image */}
            <div className="relative flex items-center gap-4">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-800 shadow-lg">
                <img
                  src={getImageUrl(employee.image)}
                  alt={employee.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultProfileImage;
                  }}
                />
              </div>

              {/* Employee Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">
                    {employee.name}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${
                    employee.status === 'Active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : employee.status === 'Inactive'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : employee.status === 'On Leave'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {employee.status}
                  </span>
                </div>
                
                {/* Department and Position Info */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-white/90">
                    <FiBriefcase className="w-4 h-4" />
                    <span className="font-medium">{employee.department}</span>
                    <span className="text-white/50">•</span>
                    <span className="text-white/80">{employee.position}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <FiAward className="w-3.5 h-3.5" />
                    <span>Employee ID: {employee.employeeID}</span>
                    <span className="text-white/50">•</span>
                    <FiCalendar className="w-3.5 h-3.5" />
                    <span>Joined: {formatDate(employee.joiningDate)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintOptions(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
                  title="Print Details"
                >
                  <FiPrinter className="w-5 h-5" />
                </button>
                <button
                  onClick={handleExport}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
                  title="Export Details"
                >
                  <FiDownload className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
                  title="Share Details"
                >
                  <FiShare2 className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleFavorite}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
                  title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <FiStar className={`w-5 h-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
            {/* Tabs Navigation */}
            <div className="overflow-x-auto scrollbar-hide sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <nav className="flex min-w-max">
                <button
                  className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors ${
                    activeTab === 'profile'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  <FiUser /> {isMobile ? '' : 'Profile'}
                </button>
                <button
                  className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors ${
                    activeTab === 'attendance'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('attendance')}
                >
                  <FiClock /> {isMobile ? '' : 'Attendance'}
                </button>
                <button
                  className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors ${
                    activeTab === 'payroll'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('payroll')}
                >
                  <FaRupeeSign /> {isMobile ? '' : 'Payroll'}
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-3 sm:p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Personal Information Section */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
                    <div 
                      className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => toggleSection('personal')}
                    >
                      <div className="flex items-center gap-2">
                        <FiUser className="text-blue-500" />
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Personal Information</h3>
                      </div>
                      {expandedSections.personal ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                    {expandedSections.personal && (
                      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <FiMail className="text-blue-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Email</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white break-all">{employee.email || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <FiPhone className="text-green-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Phone</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.phoneNumber || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <FiMapPin className="text-purple-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Address</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.address || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                              <FiAlertTriangle className="text-yellow-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Emergency Contact</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.emergencyContact || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Employment Details Section */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
                    <div 
                      className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => toggleSection('employment')}
                    >
                      <div className="flex items-center gap-2">
                        <FiBriefcase className="text-green-500" />
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Employment Details</h3>
                      </div>
                      {expandedSections.employment ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                    {expandedSections.employment && (
                      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <FiAward className="text-blue-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Employee ID</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.employeeID}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <FiBriefcase className="text-green-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Department</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.department}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <FiTool className="text-purple-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Position</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.position}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                              <FaRupeeSign className="text-yellow-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Salary</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">₹{employee.salary.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                              <FiCalendar className="text-red-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Joining Date</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{formatDate(employee.joiningDate)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              <FiClock className="text-indigo-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Work Type</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.workType || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bank Details Section */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
                    <div 
                      className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => toggleSection('bank')}
                    >
                      <div className="flex items-center gap-2">
                        <FiCreditCard className="text-purple-500" />
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Bank Details</h3>
                      </div>
                      {expandedSections.bank ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                    {expandedSections.bank && (
                      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <FiBriefcase className="text-blue-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Bank Name</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.bankName || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <FiFileText className="text-green-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Account Number</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.accountNumber || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <FiUser className="text-purple-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Account Holder</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.accountHolderName || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                              <FiFileText className="text-yellow-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">IFSC Code</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.ifscCode || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Home Details Section */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
                    <div 
                      className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => toggleSection('home')}
                    >
                      <div className="flex items-center gap-2">
                        <FiHome className="text-red-500" />
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Home Details</h3>
                      </div>
                      {expandedSections.home ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                    {expandedSections.home && (
                      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <FiMapPin className="text-blue-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Home Address</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.homeAddress || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <FiPhone className="text-green-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Home Phone</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.homePhone || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <FiMail className="text-purple-500 w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Home Email</div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.homeEmail || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <AttendanceTab employee={employee} />
              )}

              {activeTab === 'payroll' && (
                <div className="space-y-6">
                  {/* Salary Overview Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 border-b border-blue-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaRupeeSign className="text-blue-500 dark:text-blue-400" />
                        Salary Overview
                      </h3>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" /> 
                        Last updated: {new Date().toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Main Salary Card */}
                        <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-5">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl shadow-inner">
                            <FaRupeeSign />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Monthly CTC</div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                              ₹{employee.salary.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Annual: ₹{(employee.salary * 12).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats Cards */}
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                              <div className="text-sm text-gray-500 dark:text-gray-400">Net Pay</div>
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                ₹{calculatePayrollDetails(employee.salary).netSalary.toLocaleString()}
                              </div>
                              <div className="text-xs text-green-500 dark:text-green-400 mt-1 flex items-center gap-1">
                                <span>After Deductions</span>
                              </div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 opacity-10">
                              <FaRupeeSign className="w-full h-full text-green-500" />
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                              <div className="text-sm text-gray-500 dark:text-gray-400">Deductions</div>
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                ₹{calculatePayrollDetails(employee.salary).deductions.total.toLocaleString()}
                              </div>
                              <div className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                                <span>Taxes & Benefits</span>
                              </div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 opacity-10">
                              <FiXCircle className="w-full h-full text-red-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Earnings & Deductions Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Earnings Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                        <h3 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                          <FiCheckCircle className="text-green-600 dark:text-green-400" />
                          Earnings & Benefits
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {Object.entries(calculatePayrollDetails(employee.salary).earnings).map(([key, value]) => {
                            if (key === 'total') return null;
                            const percentage = (value / employee.salary) * 100;
                            
                            return (
                              <div key={key} className="relative pt-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-900 dark:text-white font-semibold">
                                    ₹{value.toLocaleString()}
                                  </div>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                          
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">Total Earnings</div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                ₹{calculatePayrollDetails(employee.salary).earnings.total.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deductions Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                        <h3 className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
                          <FiXCircle className="text-red-600 dark:text-red-400" />
                          Deductions
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {Object.entries(calculatePayrollDetails(employee.salary).deductions).map(([key, value]) => {
                            if (key === 'total') return null;
                            const percentage = (value / employee.salary) * 100;
                            
                            return (
                              <div key={key} className="relative pt-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-900 dark:text-white font-semibold">
                                    ₹{value.toLocaleString()}
                                  </div>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                          
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">Total Deductions</div>
                              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                ₹{calculatePayrollDetails(employee.salary).deductions.total.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment History Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-900">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FiFileText className="text-blue-600 dark:text-blue-400" />
                        Payment History
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                          <tr>
                            <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
                            <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Salary</th>
                            <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Date</th>
                            <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mode</th>
                            <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                          {generatePaymentHistory(employee).map((payment, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {payment.period}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  ₹{payment.netSalary.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {payment.deductions > 0 ? `After ₹${payment.deductions.toLocaleString()} deductions` : 'No deductions'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {payment.paymentDate.toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {payment.mode}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  payment.status === 'Processing' 
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : payment.status === 'Pending'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  {payment.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  onClick={() => downloadPaySlip(employee, payment.period)}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                                  disabled={payment.status === 'Processing'}
                                >
                                  <FiDownload className="w-4 h-4" />
                                  Pay Slip
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bank Details Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FiCreditCard className="text-indigo-600 dark:text-indigo-400" />
                        Bank Details
                      </h3>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-900/50">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center text-white">
                              <FiCreditCard />
                            </div>
                            <div className="font-semibold text-indigo-800 dark:text-indigo-300">Primary Account</div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Bank Name</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.bankName || 'N/A'}</div>
                            </div>
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Account Number</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {employee.accountNumber ? 
                                  `XXXX XXXX ${employee.accountNumber.substring(employee.accountNumber.length - 4)}` : 
                                  'N/A'}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Account Holder</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.accountHolderName || employee.name}</div>
                            </div>
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500 dark:text-gray-400">IFSC Code</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.ifscCode || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-100 dark:border-blue-900/50">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white">
                              <FiFileText />
                            </div>
                            <div className="font-semibold text-blue-800 dark:text-blue-300">Payment Summary</div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Payment Method</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">Direct Bank Transfer</div>
                            </div>
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Payment Cycle</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">Monthly (28th)</div>
                            </div>
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Last Payment</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(new Date().getFullYear(), new Date().getMonth(), 28).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Next Payment</div>
                              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 28).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Options Modal */}
      {showPrintOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Print Options</h3>
              <button
                onClick={() => setShowPrintOptions(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.details}
                    onChange={() => handlePrintOptionsChange('details')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Employee Details</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.attendance}
                    onChange={() => handlePrintOptionsChange('attendance')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Attendance Report</span>
                </label>
                {printOptions.details && (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printOptions.includeImage}
                        onChange={() => handlePrintOptionsChange('includeImage')}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Include Profile Image</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printOptions.includeBankDetails}
                        onChange={() => handlePrintOptionsChange('includeBankDetails')}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Include Bank Details</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printOptions.includeHomeDetails}
                        onChange={() => handlePrintOptionsChange('includeHomeDetails')}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Include Home Details</span>
                    </label>
                  </>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setShowPrintOptions(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FiPrinter /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeDetailsModal; 