import { useState, useEffect, useRef } from 'react';
import { FiX, FiUser, FiMail, FiPhone, FiBriefcase, 
  FiCalendar, FiMapPin, FiAlertTriangle, FiClock, FiFileText, 
  FiTool, FiAward, FiShield, FiHome, FiCreditCard, FiDownload,
  FiChevronDown, FiChevronUp, FiUsers, FiCheckCircle,
  FiEdit2, FiActivity, FiCheck, FiTrash2, FiXCircle, FiAlertCircle, FiShare2, FiCopy } from 'react-icons/fi';
import { FaRupeeSign, FaWhatsapp } from "react-icons/fa";
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
  const modalRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
  
  // Function to create a structured text message with employee details for WhatsApp
  const createEmployeeDetailsMessage = (employee) => {
    // Format date for display
    const formatDateStr = (dateStr) => {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    // Build a structured message with employee details
    return `*TEXTLAIRE EMPLOYEE DETAILS*
---------------------------

*${employee.name.toUpperCase()}*
${employee.position} | ${employee.department}
Status: ${employee.status}

*📱 Contact Information*
Employee ID: ${employee.employeeID}
Email: ${employee.email || 'N/A'}
Phone: ${employee.phoneNumber || 'N/A'}
${employee.emergencyContact ? `Emergency Contact: ${employee.emergencyContact}` : ''}

*💼 Employment Details*
Department: ${employee.department}
Position: ${employee.position}
Work Type: ${employee.workType || 'N/A'}
Joining Date: ${formatDateStr(employee.joiningDate)}

*📍 Address*
${employee.address || 'N/A'}

---------------------------
Generated from Textlaire HRMS
${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };
  
  // Helper function to open WhatsApp with structured employee details
  const openWhatsAppWithMessage = (employee) => {
    // Show information toast
    toast.dismiss();
    toast.success('Opening WhatsApp to share employee details...', { duration: 3000 });
    
    // Create structured message with all employee details
    const whatsappMessage = createEmployeeDetailsMessage(employee);
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Open WhatsApp with the structured message
    window.location.href = whatsappUrl;
  };
  
  // Function to copy employee details to clipboard with fallback
  const copyEmployeeDetails = (employee) => {
    try {
      const detailsText = createEmployeeDetailsMessage(employee);
      
      // Modern clipboard API with fallback for older browsers
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(detailsText)
          .then(() => {
            toast.success('Employee details copied to clipboard!', { duration: 3000 });
          })
          .catch(err => {
            console.error('Clipboard API error:', err);
            fallbackCopyToClipboard(detailsText);
          });
      } else {
        // Fallback for browsers without Clipboard API
        fallbackCopyToClipboard(detailsText);
      }
    } catch (error) {
      console.error('Failed to copy details:', error);
      toast.error('Failed to copy details to clipboard');
    }
  };
  
  // Fallback method using temporary textarea
  const fallbackCopyToClipboard = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success('Employee details copied to clipboard!', { duration: 3000 });
      } else {
        toast.error('Failed to copy details to clipboard. Please try again.');
      }
    } catch (err) {
      console.error('Fallback clipboard copy failed:', err);
      toast.error('Unable to copy to clipboard. Please try again.');
    }
  };

  const handleExport = async (mode = 'download') => {
    try {
      toast.loading(mode === 'download' ? 'Generating PDF...' : 'Preparing to share via WhatsApp...');
      
      // Create a PDF document with A4 format
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // Add document metadata
      pdf.setProperties({
        title: `Textlaire - ${employee.name} - Employee Details`,
        subject: 'Employee Information',
        author: 'Textlaire HR System',
        keywords: `employee, ${employee.position}, ${employee.department}, Textlaire`,
        creator: 'Textlaire HRMS'
      });
      
      // Create a temporary div to render the content
      const contentDiv = document.createElement('div');
      contentDiv.style.position = 'absolute';
      contentDiv.style.left = '-9999px';
      contentDiv.style.top = '-9999px';
      contentDiv.style.width = '794px'; // A4 width in pixels at 96 DPI
      contentDiv.style.backgroundColor = '#ffffff';
      
      // Set inner HTML with styled content
      contentDiv.innerHTML = `
        <div class="export-container" style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000; padding: 20px; background: #ffffff; width: 100%;">
          <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #1a56db; display: flex; align-items: center;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: #1a56db; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: white; font-weight: bold; font-size: 24px;">TL</div>
            <div>
              <h1 style="color: #1a56db; margin: 0 0 5px 0; font-size: 24px; font-weight: 700;">Textlaire</h1>
              <h2 style="margin: 4px 0; color: #374151; font-size: 18px;">${employee.name} - Employee Details</h2>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Generated on ${new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
          </div>
          </div>

          <div style="display: flex; gap: 20px; margin-bottom: 20px; padding: 20px; background: #f8fafc; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div style="width: 100px; height: 100px; border-radius: 50%; overflow: hidden; border: 3px solid #1a56db; background: white;">
              <img 
                src="${getImageUrl(employee.image)}" 
                alt="${employee.name}" 
                style="width: 100%; height: 100%; object-fit: cover;"
                crossorigin="anonymous" 
                onerror="this.onerror=null; this.src='${defaultProfileImage}';"
              />
            </div>
            <div>
              <h2 style="margin: 0 0 10px 0; font-size: 22px; color: #111827;">${employee.name}</h2>
              <p style="margin: 5px 0; font-size: 18px; color: #1f2937; font-weight: 500;">${employee.position}</p>
              <p style="margin: 5px 0; font-size: 16px; color: #4b5563;">${employee.department}</p>
              <div style="display: inline-block; padding: 5px 12px; border-radius: 30px; font-size: 14px; font-weight: 600; margin-top: 5px; text-transform: uppercase; background: ${
                employee.status === 'Active' ? '#dcfce7; color: #166534' : 
                employee.status === 'Inactive' ? '#fee2e2; color: #b91c1c' : 
                employee.status === 'On Leave' ? '#fef9c3; color: #854d0e' : '#f3f4f6; color: #111827'
              }">
                ${employee.status}
              </div>
            </div>
          </div>

          <!-- Personal Information Section -->
          <div style="margin-bottom: 25px;">
            <div style="position: relative; color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #dbeafe;">
              Personal Information
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Employee ID</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.employeeID || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Phone Number</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.phoneNumber || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Email</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.email || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Address</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.address || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Emergency Contact</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.emergencyContact || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Date of Birth</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.dateOfBirth ? formatDate(employee.dateOfBirth) : 'N/A'}</div>
              </div>
            </div>
          </div>

          <!-- Employment Details Section -->
          <div style="margin-bottom: 25px;">
            <div style="position: relative; color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #dbeafe;">
              Employment Details
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Department</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.department || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Position</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.position || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Work Type</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.workType || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Status</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.status || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Joining Date</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.joiningDate ? formatDate(employee.joiningDate) : 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Salary (CTC)</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">₹${employee.salary ? employee.salary.toLocaleString() : 'N/A'}</div>
              </div>
            </div>
          </div>

          <!-- Bank Details Section -->
          <div style="margin-bottom: 25px;">
            <div style="position: relative; color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #dbeafe;">
              Bank Details
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Bank Name</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.bankName || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Account Number</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.accountNumber || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Account Holder</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.accountHolderName || employee.name}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">IFSC Code</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.ifscCode || 'N/A'}</div>
                </div>
              </div>
            </div>

          <!-- Home Details Section -->
          <div style="margin-bottom: 25px;">
            <div style="position: relative; color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #dbeafe;">
              Home Details
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Home Address</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.homeAddress || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Home Phone</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.homePhone || 'N/A'}</div>
                </div>
              <div style="background: #f9fafb; padding: 10px 15px; border-radius: 8px; border-left: 3px solid #1a56db;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Home Email</div>
                <div style="color: #111827; font-size: 14px; font-weight: 500;">${employee.homeEmail || 'N/A'}</div>
                </div>
              </div>
            </div>

          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <div style="font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 5px;">Textlaire HR Management System</div>
            <div>This document is confidential and intended only for authorized personnel.</div>
            <div>Generated on ${new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</div>
          </div>
        </div>
      `;

      // Append to the body temporarily
      document.body.appendChild(contentDiv);

      // Function to handle image loading and PDF generation
      const generatePDF = async () => {
        try {
          // Allow some time for images to load
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Capture using html2canvas
          const canvas = await html2canvas(contentDiv.querySelector('.export-container'), {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
            backgroundColor: '#ffffff',
            allowTaint: true
          });
          
          // Get canvas data
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          
          // Calculate dimensions for the PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          
          // Center the image horizontally
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
          let imgY = 0;
          
          // Add the image to the PDF
          pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Create a sanitized filename with Textlaire branding
      const sanitizedName = employee.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Textlaire_${sanitizedName}_Employee_Details.pdf`;

          // Clean up - remove the temporary div
          if (document.body.contains(contentDiv)) {
      document.body.removeChild(contentDiv);
          }
      
      if (mode === 'download') {
        // Save the PDF
        pdf.save(filename);
        
        // Show success message
        toast.dismiss();
            toast.success('Employee details exported as PDF!');
      } else if (mode === 'whatsapp') {
            // For WhatsApp, we'll just share text directly
            openWhatsAppWithMessage(employee);
          }
        } catch (err) {
          console.error('HTML2Canvas or PDF generation error:', err);
          // Clean up the temporary element
        if (document.body.contains(contentDiv)) {
          document.body.removeChild(contentDiv);
        }
          throw err;
      }
      };
      
      // Generate the PDF
      await generatePDF();
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.dismiss();
      toast.error('Failed to export employee details as PDF. Please try again.');
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
      
      // Create a sanitized filename with Textlaire branding
      const sanitizedName = employee.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Textlaire_${sanitizedName}_Employee_Details.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
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
                  onClick={() => handleExport('download')}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
                  title="Export as PDF"
                >
                  <FiDownload className="w-5 h-5" />
                </button>
                <button
                  onClick={() => copyEmployeeDetails(employee)}
                  className="p-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg transition-colors duration-200"
                  title="Copy Details to Clipboard"
                >
                  <FiCopy className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleExport('whatsapp')}
                  className="p-2 bg-green-500/80 hover:bg-green-500 text-white rounded-lg transition-colors duration-200"
                  title="Share via WhatsApp"
                >
                  <FaWhatsapp className="w-5 h-5" />
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
                  className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors text-blue-600 border-b-2 border-blue-600`}
                >
                  <FiUser /> {isMobile ? '' : 'Profile'}
                </button>
                {/* Attendance and Payroll tabs hidden as requested */}
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
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white">{employee.accountHolderName || employee.name}</div>
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
    </>
  );
};

export default EmployeeDetailsModal; 