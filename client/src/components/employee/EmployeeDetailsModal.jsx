import { useState, useEffect, useRef } from 'react';
import { FiX, FiUser, FiMail, FiPhone, FiBriefcase, 
  FiCalendar, FiMapPin, FiAlertTriangle, FiClock, FiFileText, 
  FiTool, FiAward, FiShield, FiHome, FiCreditCard, FiPrinter,
  FiDownload, FiChevronDown, FiChevronUp, FiUsers, FiCheckCircle,
  FiEdit2, FiShare2, FiStar, FiActivity, FiCheck } from 'react-icons/fi';
import { FaRupeeSign } from "react-icons/fa";
import AttendanceTab from './AttendanceTab';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
    if (!url) return null;
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
              margin: 0.5cm;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.2;
              color: #333;
              font-size: 8pt;
            }
            .header {
              text-align: center;
              margin-bottom: 0.5rem;
              padding-bottom: 0.25rem;
              border-bottom: 1px solid #eee;
            }
            .header h1 {
              color: #1a56db;
              margin-bottom: 0.25rem;
              font-size: 14pt;
            }
            .header p {
              color: #666;
              margin: 0;
              font-size: 7pt;
            }
            .profile-section {
              display: flex;
              gap: 0.5rem;
              margin-bottom: 0.5rem;
            }
            .profile-image {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              object-fit: cover;
              border: 1px solid #1a56db;
            }
            .profile-info {
              flex: 1;
            }
            .profile-info h2 {
              margin: 0 0 0.25rem 0;
              font-size: 10pt;
            }
            .profile-info p {
              margin: 0;
              font-size: 7pt;
            }
            .section {
              margin-bottom: 0.5rem;
            }
            .section-title {
              color: #1a56db;
              font-size: 9pt;
              font-weight: bold;
              margin-bottom: 0.25rem;
              padding-bottom: 0.25rem;
              border-bottom: 1px solid #eee;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 0.25rem;
            }
            .info-item {
              display: flex;
              gap: 0.25rem;
              margin-bottom: 0.15rem;
              font-size: 7pt;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              min-width: 80px;
            }
            .info-value {
              color: #333;
            }
            .status-badge {
              display: inline-block;
              padding: 0.1rem 0.3rem;
              border-radius: 9999px;
              font-size: 6pt;
              font-weight: 500;
            }
            .attendance-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 0.25rem;
              font-size: 6pt;
            }
            .attendance-table th,
            .attendance-table td {
              border: 1px solid #ddd;
              padding: 0.15rem;
              text-align: left;
            }
            .attendance-table th {
              background-color: #f8fafc;
              font-weight: 600;
            }
            .attendance-table tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .attendance-summary {
              margin-bottom: 0.25rem;
            }
            .footer {
              margin-top: 0.5rem;
              padding-top: 0.25rem;
              border-top: 1px solid #eee;
              text-align: center;
              color: #666;
              font-size: 6pt;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Employee Report</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>

          <div class="profile-section">
            <img src="${getImageUrl(employee.image)}" alt="${employee.name}" class="profile-image" />
            <div class="profile-info">
              <h2>${employee.name}</h2>
              <p>${employee.position}</p>
              <p>${employee.department}</p>
              <div class="status-badge ${getStatusColor(employee.status).split(' ').join('-')}">
                ${employee.status}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="grid">
              <div class="info-item">
                <span class="info-label">Employee ID:</span>
                <span class="info-value">${employee.employeeID}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${employee.email || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">${employee.phoneNumber || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Emergency Contact:</span>
                <span class="info-value">${employee.emergencyContact || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Address:</span>
                <span class="info-value">${employee.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Employment Details</div>
            <div class="grid">
              <div class="info-item">
                <span class="info-label">Department:</span>
                <span class="info-value">${employee.department}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Position:</span>
                <span class="info-value">${employee.position}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Work Type:</span>
                <span class="info-value">${employee.workType || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Joining Date:</span>
                <span class="info-value">${formatDate(employee.joiningDate)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Salary:</span>
                <span class="info-value">₹${employee.salary.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Current Month Attendance</div>
            <div class="attendance-summary">
              <div class="grid">
                <div class="info-item">
                  <span class="info-label">Month:</span>
                  <span class="info-value">${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total Days:</span>
                  <span class="info-value">${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Working Days:</span>
                  <span class="info-value">${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - 8}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Weekends:</span>
                  <span class="info-value">8</span>
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
                      <td>${i + 1}</td>
                      <td>${status}</td>
                      <td>${checkIn}</td>
                      <td>${checkOut}</td>
                      <td>${hours}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>This is a computer-generated report. No signature is required.</p>
            <p>Confidential - For Internal Use Only</p>
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
            .export-container {
              font-family: Arial, sans-serif;
              line-height: 1.4;
              color: #000000 !important;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              background: #ffffff !important;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #1a56db;
            }
            .header h1 {
              color: #1a56db !important;
              font-size: 24px;
              margin-bottom: 10px;
            }
            .header p {
              color: #000000 !important;
              font-size: 14px;
            }
            .profile-section {
              display: flex;
              gap: 20px;
              margin-bottom: 30px;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .profile-image {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid #1a56db;
            }
            .profile-info {
              flex: 1;
            }
            .profile-info h2 {
              font-size: 20px;
              margin: 0 0 10px 0;
              color: #000000 !important;
            }
            .profile-info p {
              margin: 5px 0;
              color: #000000 !important;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
              margin-top: 10px;
              color: #000000 !important;
            }
            .section {
              margin-bottom: 30px;
              background: #ffffff !important;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .section-title {
              background: #1a56db;
              color: #ffffff !important;
              padding: 12px 20px;
              font-size: 16px;
              font-weight: 600;
            }
            .section-content {
              padding: 20px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .info-label {
              font-size: 12px;
              color: #000000 !important;
              font-weight: 500;
            }
            .info-value {
              font-size: 14px;
              color: #000000 !important;
            }
            .attendance-summary {
              margin-bottom: 20px;
            }
            .attendance-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .attendance-table th,
            .attendance-table td {
              border: 1px solid #e2e8f0;
              padding: 8px;
              text-align: left;
              font-size: 12px;
              color: #000000 !important;
            }
            .attendance-table th {
              background: #f8fafc;
              font-weight: 600;
              color: #000000 !important;
            }
            .attendance-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              text-align: center;
              color: #000000 !important;
              font-size: 12px;
            }
            * {
              color: #000000 !important;
            }
          </style>

          <div class="header">
            <h1>Employee Report</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>

          <div class="profile-section">
            <img src="${getImageUrl(employee.image)}" alt="${employee.name}" class="profile-image" crossorigin="anonymous" />
            <div class="profile-info">
              <h2>${employee.name}</h2>
              <p>${employee.position}</p>
              <p>${employee.department}</p>
              <div class="status-badge ${getStatusColor(employee.status).split(' ').join('-')}">
                ${employee.status}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Personal Information</div>
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
                <div class="info-item">
                  <span class="info-label">Address</span>
                  <span class="info-value">${employee.address || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Employment Details</div>
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
                  <span class="info-value">₹${employee.salary.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Current Month Attendance</div>
            <div class="section-content">
              <div class="attendance-summary">
                <div class="grid">
                  <div class="info-item">
                    <span class="info-label">Month</span>
                    <span class="info-value">${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Total Days</span>
                    <span class="info-value">${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Working Days</span>
                    <span class="info-value">${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - 8}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Weekends</span>
                    <span class="info-value">8</span>
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
                        <td>${i + 1}</td>
                        <td>${status}</td>
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
            <p>This is a computer-generated report. No signature is required.</p>
            <p>Confidential - For Internal Use Only</p>
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

      // Add the canvas to the PDF
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

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
      if (navigator.share) {
        await navigator.share({
          title: `${employee.name} - Employee Details`,
          text: `View details for ${employee.name}, ${employee.position} at ${employee.department}`,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard copy
        const text = `${employee.name} - Employee Details\nPosition: ${employee.position}\nDepartment: ${employee.department}\nEmail: ${employee.email}\nPhone: ${employee.phoneNumber}`;
        await navigator.clipboard.writeText(text);
        toast.success('Employee details copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share employee details.');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
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
                    e.target.src = '/default-profile.png';
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
                  onClick={handlePrint}
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
                  <FiCreditCard /> {isMobile ? '' : 'Payroll'}
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-3 sm:p-6">
              {activeTab === 'profile' && (
                <div className="space-y-4 sm:space-y-6">
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
                <div className="min-h-[300px] flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-gray-400 dark:text-gray-500 text-4xl sm:text-5xl mb-4">
                      <FaRupeeSign />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Payroll Feature</h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                      Employee payroll information will be displayed here in a future update.
                    </p>
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