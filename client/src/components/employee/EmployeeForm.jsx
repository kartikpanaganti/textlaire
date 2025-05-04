import { useState, useEffect, useContext, forwardRef } from "react";
import apiClient from '../../lib/api';
import { 
  FiUser, FiMail, FiPhone, FiBriefcase, 
  FiCalendar, FiMapPin, FiAlertTriangle, FiClock, 
  FiFileText, FiX, FiUpload, FiTool, FiAward, FiShield,
  FiUserPlus, FiUserCheck, FiAlertCircle, FiArrowRight
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { ThemeContext } from "../../context/ThemeProvider";
import defaultProfileImage from '../../assets/images/default-profile.png';
import { toast } from 'react-toastify';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EmployeeForm = ({ fetchEmployees, editingEmployee, setEditingEmployee, onClose }) => {
  const { theme } = useContext(ThemeContext);
  
  // Define form options
  const departments = [
    "Production",
    "Quality Control",
    "Inventory & Raw Materials",
    "Workforce & HR",
    "Sales & Marketing",
    "Finance & Accounts",
    "Maintenance"
  ];

  // Department-specific positions
  const departmentPositions = {
    "Production": [
      "Machine Operator",
      "Textile Worker",
      "Weaver/Knitter",
      "Dyeing & Printing Operator"
    ],
    "Quality Control": [
      "Quality Inspector",
      "Fabric Checker",
      "Testing Technician"
    ],
    "Inventory & Raw Materials": [
      "Store Keeper",
      "Inventory Assistant"
    ],
    "Workforce & HR": [
      "HR Executive",
      "Payroll Assistant"
    ],
    "Sales & Marketing": [
      "Sales Executive",
      "Customer Support Representative"
    ],
    "Finance & Accounts": [
      "Accountant",
      "Billing Assistant"
    ],
    "Maintenance": [
      "Maintenance Technician",
      "Electrical Engineer"
    ]
  };

  // Get available positions based on selected department
  const getAvailablePositions = (department) => {
    if (!department) return [];
    return departmentPositions[department] || [];
  };

  const workTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Temporary",
    "Intern"
  ];

  const statusOptions = ["Active", "Inactive", "On Leave", "Terminated"];

  const initialFormState = {
    name: "",
    email: "",
    phoneNumber: "",
    department: "",
    position: "",
    employeeID: "",
    salary: "",
    shiftTiming: "",
    joiningDate: "",
    workType: "",
    status: "Active",
    address: "",
    emergencyContact: "",
    // Bank Details
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    ifscCode: "",
    // Home Details
    homeAddress: "",
    homePhone: "",
    homeEmail: "",
    imageUrl: ""
  };

  const [formData, setFormData] = useState(initialFormState);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("error"); // "error" or "success"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [changes, setChanges] = useState([]);

  // Function to format date from YYYY-MM-DD to DD/MM/YYYY for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '';
    }
  };

  // Function to parse DD/MM/YYYY to YYYY-MM-DD for input
  const parseDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Handle both / and - separators
      const parts = dateString.split(/[-/]/);
      if (parts.length !== 3) return '';
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch (error) {
      return '';
    }
  };

  // Handle all form changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === "joiningDate") {
      handleDateInput(e);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Custom date input handler
  const handleDateInput = (e) => {
    const { name, value } = e.target;
    let formattedValue = value.replace(/\D/g, ''); // Remove non-digits
    
    if (formattedValue.length >= 2) {
      formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
    }
    if (formattedValue.length >= 5) {
      formattedValue = formattedValue.slice(0, 5) + '/' + formattedValue.slice(5, 9);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  // Function to validate date format
  const isValidDateFormat = (dateString) => {
    if (!dateString) return true; // Empty is valid
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
    return regex.test(dateString);
  };

  // Function to validate date value
  const isValidDate = (dateString) => {
    if (!dateString) return true; // Empty is valid
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year &&
           date <= new Date(); // Ensure date is not in future
  };

  useEffect(() => {
    if (editingEmployee) {
      const mergedData = { ...initialFormState, ...editingEmployee };
      const getImageUrl = (url) => {
        if (!url) return defaultProfileImage;
        return url.startsWith('http') ? url : `http://${window.location.hostname}:5000${url}`;
      };

      // Convert date format for editing
      const joiningDate = mergedData.joiningDate ? 
        formatDateForDisplay(mergedData.joiningDate) : 
        "";

      setFormData({
        ...mergedData,
        joiningDate,
        status: mergedData.status || "Active"
      });

      setImagePreview(getImageUrl(mergedData.image));
    } else {
      setFormData(initialFormState);
      setImage(null);
      setImagePreview(defaultProfileImage);
    }
  }, [editingEmployee]);

  const formatImageFileName = (file, employeeName, employeeID) => {
    // Get file extension from original file
    const extension = file.name.split('.').pop().toLowerCase();
    
    // Format employee name: convert to lowercase, replace spaces with underscores
    const formattedName = employeeName.toLowerCase().replace(/\s+/g, '_');
    
    // Create filename format: name_employeeID.extension
    // If no employeeID (new employee), use timestamp
    const timestamp = new Date().getTime();
    const id = employeeID || `temp_${timestamp}`;
    
    return `${formattedName}_${id}.${extension}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // Format the filename
        const formattedFileName = formatImageFileName(
          file,
          formData.name || 'unnamed',
          formData.employeeID
        );

        // Create new file with formatted name
        const newFile = new File([file], formattedFileName, {
          type: file.type,
        });

        setImage(newFile);
        setImagePreview(URL.createObjectURL(file));
      } else {
        setAlertType("error");
        setAlertMessage('Please upload an image file (JPEG, PNG, etc.)');
        setShowAlert(true);
        e.target.value = ''; // Reset input
      }
    }
  };

  // Update image filename when name or employeeID changes
  useEffect(() => {
    if (image && (formData.name || formData.employeeID)) {
      const newFileName = formatImageFileName(
        image,
        formData.name || 'unnamed',
        formData.employeeID
      );

      const newFile = new File([image], newFileName, {
        type: image.type,
      });

      setImage(newFile);
    }
  }, [formData.name, formData.employeeID]);

  // Function to get changes between original and current data
  const getChanges = () => {
    if (!editingEmployee) return [];
    
    const changedFields = [];
    Object.keys(formData).forEach(key => {
      // Skip image comparison
      if (key === 'image') return;
      
      const oldValue = editingEmployee[key];
      const newValue = formData[key];
      
      // Special handling for date fields to ensure consistent format
      if (key === 'joiningDate') {
        const oldFormatted = oldValue ? formatValue(oldValue, 'joiningDate') : 'Not set';
        const newFormatted = newValue ? formatValue(newValue, 'joiningDate') : 'Not set';
        if (oldFormatted !== newFormatted) {
          changedFields.push({
            field: key,
            from: oldFormatted,
            to: newFormatted
          });
        }
        return;
      }
      
      if (oldValue !== newValue && (oldValue || newValue)) {
        changedFields.push({
          field: key,
          from: oldValue || 'Not set',
          to: newValue || 'Not set'
        });
      }
    });
    return changedFields;
  };

  // Function to format field name for display
  const formatFieldName = (field) => {
    return field
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/ID/, 'ID'); // Keep ID uppercase
  };

  // Update formatValue function
  const formatValue = (value, field) => {
    if (value === null || value === undefined || value === '') return 'Not set';
    
    switch (field) {
      case 'salary':
        return `₹${Number(value).toLocaleString()}`;
      
      case 'phoneNumber':
      case 'homePhone':
        const phone = value.replace(/\D/g, '');
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      
      case 'joiningDate':
        try {
          // Handle ISO date string
          if (value.includes('T')) {
            const date = new Date(value);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          }
          
          // Handle DD/MM/YYYY or DD-MM-YYYY format
          if (value.includes('/') || value.includes('-')) {
            const parts = value.split(/[-/]/);
            if (parts.length === 3) {
              // If already in DD/MM/YYYY format, just standardize the separator
              if (parts[0].length === 2) {
                return parts.join('/');
              }
              // If in YYYY-MM-DD format, convert to DD/MM/YYYY
              return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
          }
          
          return value;
        } catch (error) {
          return value;
        }
      
      case 'accountNumber':
        // Show last 4 digits only for security
        const accNum = value.toString();
        return `XXXX-XXXX-${accNum.slice(-4)}`;
      
      case 'ifscCode':
        return value.toUpperCase();
      
      case 'email':
      case 'homeEmail':
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return `${value} (Warning: Invalid email format)`;
        }
        return value;
      
      default:
        return value;
    }
  };

  // Validate changes before showing confirmation
  const validateChanges = (changes) => {
    const warnings = [];
    
    changes.forEach(change => {
      const { field, to } = change;
      
      switch (field) {
        case 'joiningDate':
          const date = new Date(to);
          const today = new Date();
          if (date > today) {
            warnings.push('Joining date cannot be in the future');
          }
          break;
          
        case 'phoneNumber':
        case 'homePhone':
          if (to !== 'Not set' && !/^\d{10}$/.test(to.replace(/\D/g, ''))) {
            warnings.push(`${formatFieldName(field)} should be 10 digits`);
          }
          break;
          
        case 'email':
        case 'homeEmail':
          if (to !== 'Not set' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
            warnings.push(`${formatFieldName(field)} format is invalid`);
          }
          break;
          
        case 'salary':
          if (isNaN(to) || Number(to) <= 0) {
            warnings.push('Salary must be a positive number');
          }
          break;
          
        case 'accountNumber':
          if (to !== 'Not set' && !/^\d{8,16}$/.test(to.replace(/\D/g, ''))) {
            warnings.push('Account number should be 8-16 digits');
          }
          break;
          
        case 'ifscCode':
          if (to !== 'Not set' && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(to.toUpperCase())) {
            warnings.push('IFSC code format is invalid');
          }
          break;
      }
    });
    
    return warnings;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingEmployee) {
      const changedFields = getChanges();
      if (changedFields.length > 0) {
        const warnings = validateChanges(changedFields);
        setChanges(changedFields);
        
        if (warnings.length > 0) {
          // Show warnings in a toast
          toast.warn(
            <div className="flex items-center">
              <FiAlertTriangle className="w-6 h-6 mr-2 text-white" />
              <div className="text-white">
                <h4 className="font-medium">Please Review</h4>
                <ul className="text-sm opacity-90 list-disc ml-4">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>,
            {
              style: { background: '#EAB308' },
              className: "!bg-yellow-500 border-l-4 !border-yellow-600",
              progressClassName: "!bg-yellow-400",
              autoClose: 5000
            }
          );
        }
        setShowConfirmation(true);
      } else {
        // If no changes, show message and close
        toast.info(
          <div className="flex items-center">
            <FiAlertCircle className="w-6 h-6 mr-2 text-white" />
            <div className="text-white">
              <h4 className="font-medium">No Changes</h4>
              <p className="text-sm opacity-90">No changes were made to the employee profile.</p>
            </div>
          </div>,
          {
            style: { background: '#60A5FA' },
            className: "!bg-blue-400 border-l-4 !border-blue-500",
            progressClassName: "!bg-blue-300",
            autoClose: 3000
          }
        );
        onClose();
      }
      return;
    }
    
    // If creating new employee, proceed with submission
    submitForm();
  };

  const submitForm = async () => {
    setShowAlert(false);
    setIsSubmitting(true);
    
    try {
      const formPayload = new FormData();
      // Convert date back to YYYY-MM-DD format for API
      const submissionData = {
        ...formData,
        joiningDate: formData.joiningDate ? parseDate(formData.joiningDate) : ''
      };
      
      Object.keys(submissionData).forEach(key => {
        formPayload.append(key, submissionData[key]);
      });
      if (image) {
        formPayload.append("image", image);
      }

      await apiClient[editingEmployee ? "put" : "post"](
        editingEmployee ? `/api/employees/${editingEmployee._id}` : '/api/employees', 
        formPayload, 
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );
      
      // Different toast styles for create and update
      if (editingEmployee) {
        // Update toast - Orange theme
        toast.success(
          <div className="flex items-center">
            <FiUserCheck className="w-6 h-6 mr-2 text-white" />
            <div className="text-white">
              <h4 className="font-medium">Employee Updated</h4>
              <p className="text-sm opacity-90">Successfully updated {formData.name}'s details</p>
            </div>
          </div>,
          {
            style: { background: '#F97316' },
            className: "!bg-orange-500 border-l-4 !border-orange-600",
            progressClassName: "!bg-orange-400",
            autoClose: 3000
          }
        );
      } else {
        // Create toast - Green theme
        toast.success(
          <div className="flex items-center">
            <FiUserPlus className="w-6 h-6 mr-2 text-white" />
            <div className="text-white">
              <h4 className="font-medium">Employee Added</h4>
              <p className="text-sm opacity-90">Successfully added {formData.name} to the team</p>
            </div>
          </div>,
          {
            style: { background: '#22C55E' },
            className: "!bg-green-500 border-l-4 !border-green-600",
            progressClassName: "!bg-green-400",
            autoClose: 3000
          }
        );
      }
      
      // Reset form and refresh employee list
      fetchEmployees();
      setEditingEmployee(null);
      setFormData(initialFormState);
      setImage(null);
      setImagePreview(defaultProfileImage);
      setShowConfirmation(false);
      
      // Close form after successful submission
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error("Error submitting form:", error);
      
      const resError = error.response?.data;
      let errorMessage = 'An error occurred. Please try again.';
      let errorTitle = 'Error';
      
      if (resError) {
        if (resError.message.includes('Employee ID already exists')) {
          errorMessage = 'Employee ID already exists! Please use a unique ID.';
          errorTitle = 'Duplicate ID';
        } else if (resError.message.includes('numeric value')) {
          errorMessage = 'Employee ID must be a numeric value.';
          errorTitle = 'Invalid ID';
        } else if (resError.message.includes('Invalid')) {
          errorMessage = resError.message;
          errorTitle = 'Validation Error';
        } else if (resError.message.includes('email')) {
          errorMessage = 'Email is required and must be unique.';
          errorTitle = 'Invalid Email';
        } else {
          errorMessage = resError.message;
        }
      }
      
      // Error toast with title and message - Red theme
      toast.error(
        <div className="flex items-center">
          <FiAlertCircle className="w-6 h-6 mr-2 text-white" />
          <div className="text-white">
            <h4 className="font-medium">{errorTitle}</h4>
            <p className="text-sm opacity-90">{errorMessage}</p>
          </div>
        </div>,
        {
          style: { background: '#EF4444' }, // Red-500
          className: "!bg-red-500 border-l-4 !border-red-600",
          progressClassName: "!bg-red-400",
          autoClose: 5000
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingEmployee(null);
    setFormData(initialFormState);
    setImage(null);
    setImagePreview(defaultProfileImage);
    setShowAlert(false);
    if (onClose) onClose();
  };

  // Custom Input Component for DatePicker
  const CustomInput = forwardRef(({ value, onClick, onChange }, ref) => (
    <div className="relative">
      <input
        type="text"
        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white cursor-pointer"
        value={value}
        onClick={onClick}
        onChange={onChange}
        ref={ref}
        placeholder="DD/MM/YYYY"
        readOnly
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        <FiCalendar />
      </div>
    </div>
  ));

  // Handle date selection from calendar
  const handleDateSelect = (date) => {
    if (!date) {
      setFormData(prev => ({ ...prev, joiningDate: '' }));
      return;
    }

    // Check if date is in future
    if (date > new Date()) {
      toast.warn(
        <div className="flex items-center">
          <FiAlertTriangle className="w-6 h-6 mr-2 text-white" />
          <div className="text-white">
            <h4 className="font-medium">Invalid Date</h4>
            <p className="text-sm opacity-90">Please select a date not in the future</p>
          </div>
        </div>,
        {
          style: { background: '#EAB308' },
          className: "!bg-yellow-500 border-l-4 !border-yellow-600",
          progressClassName: "!bg-yellow-400",
          autoClose: 3000
        }
      );
      return;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    setFormData(prev => ({
      ...prev,
      joiningDate: `${day}/${month}/${year}`
    }));
  };

  // Parse date string to Date object
  const parseFormDate = (dateString) => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <div className="transition-colors duration-200">
      {/* Alert Message */}
      {showAlert && (
        <div className={`mb-6 ${
          alertType === "error" 
            ? "bg-red-100 dark:bg-red-900 border-red-400 dark:border-red-700 text-red-700 dark:text-red-100" 
            : "bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-700 text-green-700 dark:text-green-100"
          } border px-4 py-3 rounded-lg shadow-lg flex items-center transition-colors duration-200`}
        >
          <span className="mr-2">{alertType === "error" ? "❗" : "✅"}</span>
          <span>{alertMessage}</span>
          <button
            onClick={() => setShowAlert(false)}
            className={`ml-4 ${
              alertType === "error"
                ? "text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100" 
                : "text-green-500 dark:text-green-300 hover:text-green-700 dark:hover:text-green-100"
              } transition-colors duration-200`}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative group w-32 h-32 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              id="image-upload"
            />
            <div className="relative w-full h-full">
              <img 
                src={imagePreview || defaultProfileImage} 
                alt={formData.name ? `${formData.name}'s profile photo` : 'Default profile photo'} 
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultProfileImage;
                  e.target.alt = 'Default profile photo';
                }}
              />
              {image && (
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(defaultProfileImage);
                  }}
                  className="absolute top-0 right-0 p-1 bg-red-500 rounded-full text-white shadow-md hover:bg-red-600 transition-colors"
                  aria-label="Remove profile photo"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="image-upload"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors"
            >
              {imagePreview ? 'Change Image' : 'Choose File'}
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {image ? image.name : 
               imagePreview ? "Current image" : 
               "No file chosen"}
            </span>
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 transition-colors duration-200">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              Personal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "name", icon: <FiUser />, placeholder: "Full Name", required: true },
                { name: "email", icon: <FiMail />, type: "email", placeholder: "Email Address" },
                { name: "phoneNumber", icon: <FiPhone />, placeholder: "Phone Number", required: true },
                { name: "emergencyContact", icon: <FiAlertTriangle />, placeholder: "Emergency Contact" },
              ].map((field) => (
                <div key={field.name} className="relative">
                  {field.icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      {field.icon}
                    </div>
                  )}
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                    required={field.required}
                  />
                  {field.required && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">*</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Employment Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-green-500 rounded-full"></span>
              Employment Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "employeeID", icon: <FiAward />, placeholder: "Employee ID (leave blank for auto-generation)"},
                { 
                  name: "department", 
                  icon: <FiBriefcase />, 
                  type: "select", 
                  placeholder: "Department",
                  options: departments,
                  required: true
                },
                { 
                  name: "position", 
                  icon: <FiUser />, 
                  type: "select", 
                  placeholder: "Position",
                  options: getAvailablePositions(formData.department),
                  required: true,
                  disabled: !formData.department
                },
                { 
                  name: "salary", 
                  icon: <FaRupeeSign />, 
                  type: "number", 
                  placeholder: "Salary (₹)", 
                  required: true 
                },
                { 
                  name: "workType", 
                  icon: <FiClock />,
                  type: "select", 
                  placeholder: "Employment Type",
                  options: workTypes,
                  required: false
                },
                { 
                  name: "status", 
                  icon: <FiShield />,
                  type: "select", 
                  placeholder: "Status",
                  options: statusOptions
                },
                { 
                  name: "joiningDate", 
                  icon: <FiCalendar />, 
                  type: "custom",
                  placeholder: "DD/MM/YYYY",
                  required: true,
                  customProps: {
                    component: (
                      <DatePicker
                        selected={parseFormDate(formData.joiningDate)}
                        onChange={handleDateSelect}
                        dateFormat="dd/MM/yyyy"
                        maxDate={new Date()}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        customInput={<CustomInput />}
                        placeholderText="DD/MM/YYYY"
                      />
                    )
                  }
                },
              ].map((field) => (
                <div key={field.name} className="relative">
                  {field.type === 'custom' ? (
                    field.customProps.component
                  ) : field.type === 'select' ? (
                    <>
                      {field.icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                          {field.icon}
                        </div>
                      )}
                      <select
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none ${
                          !formData[field.name] 
                            ? "text-gray-400 dark:text-gray-500" 
                            : "text-gray-900 dark:text-white"
                        }`}
                        required={field.required}
                        disabled={field.disabled}
                      >
                        <option value="" disabled>
                          {field.name === "position" && !formData.department 
                            ? "Please select a department first" 
                            : field.placeholder}
                        </option>
                        {field.options?.map(option => (
                          <option key={option} value={option} className="text-gray-900 dark:text-white">
                            {option}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      {field.icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                          {field.icon}
                        </div>
                      )}
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        required={field.required}
                        {...(field.customProps || {})}
                      />
                    </>
                  )}
                  {field.required && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">*</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
              Additional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "address", icon: <FiMapPin />, placeholder: "Office Address" },
                { name: "emergencyContact", icon: <FiAlertTriangle />, placeholder: "Emergency Contact" },
              ].map((field) => (
                <div key={field.name} className="relative">
                  {field.icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      {field.icon}
                    </div>
                  )}
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
              Bank Details (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "bankName", icon: <FiBriefcase />, placeholder: "Bank Name", required: false },
                { name: "accountNumber", icon: <FiFileText />, placeholder: "Account Number", required: false },
                { name: "accountHolderName", icon: <FiUser />, placeholder: "Account Holder Name", required: false },
                { name: "ifscCode", icon: <FiFileText />, placeholder: "IFSC Code", required: false },
              ].map((field) => (
                <div key={field.name} className="relative">
                  {field.icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      {field.icon}
                    </div>
                  )}
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required={field.required}
                  />
                  {field.required && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">*</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Home Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-red-500 rounded-full"></span>
              Home Details (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "homeAddress", icon: <FiMapPin />, placeholder: "Home Address", required: false },
                { name: "homePhone", icon: <FiPhone />, placeholder: "Home Phone", required: false },
                { name: "homeEmail", icon: <FiMail />, type: "email", placeholder: "Home Email", required: false },
              ].map((field) => (
                <div key={field.name} className="relative">
                  {field.icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      {field.icon}
                    </div>
                  )}
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required={field.required}
                  />
                  {field.required && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">*</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>{editingEmployee ? "Update" : "Save"}</>
            )}
          </button>
        </div>
      </form>

      {/* Update Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full m-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <FiUserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm Changes
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review the changes before updating
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  The following changes will be made to {formData.name}'s profile:
                </h4>
                <div className="space-y-3">
                  {changes.map((change, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[150px]">
                        {formatFieldName(change.field)}:
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-red-500 dark:text-red-400 line-through">
                          {formatValue(change.from, change.field)}
                        </span>
                        <FiArrowRight className="text-gray-400" />
                        <span className={`${
                          change.field === 'joiningDate' && new Date(change.to) > new Date() ? 
                          'text-yellow-500 dark:text-yellow-400' : 
                          'text-green-500 dark:text-green-400'
                        }`}>
                          {formatValue(change.to, change.field)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {image && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[150px]">
                        Profile Photo:
                      </span>
                      <span className="text-blue-500 dark:text-blue-400">
                        Will be updated
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiUserCheck className="w-4 h-4" />
                    Confirm Update
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeForm; 