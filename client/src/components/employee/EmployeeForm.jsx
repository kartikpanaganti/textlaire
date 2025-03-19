import { useState, useEffect, useContext } from "react";
import apiClient from '../../lib/api';
import { 
  FiUser, FiMail, FiPhone, FiBriefcase, FiDollarSign, 
  FiCalendar, FiMapPin, FiAlertTriangle, FiClock, 
  FiFileText, FiX, FiUpload, FiTool, FiAward, FiShield
} from "react-icons/fi";
import { ThemeContext } from "../../context/ThemeProvider";

const EmployeeForm = ({ fetchEmployees, editingEmployee, setEditingEmployee, onClose }) => {
  const { theme } = useContext(ThemeContext);
  
  // Define form options
  const departments = [
    "Weaving",
    "Dyeing",
    "Printing",
    "Quality Control",
    "Packaging",
    "Maintenance",
    "Administration",
    "Human Resources",
    "Finance",
    "IT"
  ];

  const positions = [
    "Manager",
    "Supervisor",
    "Operator",
    "Technician",
    "Quality Inspector",
    "Team Lead",
    "Assistant",
    "Specialist",
    "Coordinator",
    "Analyst"
  ];

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
    experienceLevel: "",
    workType: "",
    status: "Active",
    supervisor: "",
    address: "",
    emergencyContact: "",
    previousExperience: "",
    skills: "",
    workingHours: "",
    attendanceRecord: "",
    safetyCertification: "",
    imageUrl: ""
  };

  const [formData, setFormData] = useState(initialFormState);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("error"); // "error" or "success"
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingEmployee) {
      const mergedData = { ...initialFormState, ...editingEmployee };
      const getImageUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `http://${window.location.hostname}:5000${url}`;
      };

      setFormData({
        ...mergedData,
        joiningDate: mergedData.joiningDate?.split('T')[0] || "",
        status: mergedData.status || "Active"
      });

      setImagePreview(getImageUrl(mergedData.image));
    } else {
      setFormData(initialFormState);
      setImage(null);
      setImagePreview(null);
    }
  }, [editingEmployee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowAlert(false);
    setIsSubmitting(true);
    
    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach(key => {
        formPayload.append(key, formData[key]);
      });
      if (image) {
        formPayload.append("image", image);
      }

      const response = await apiClient[editingEmployee ? "put" : "post"](
        editingEmployee ? `/employees/${editingEmployee._id}` : '/employees', 
        formPayload, 
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );
      
      // Show success message
      setAlertType("success");
      setAlertMessage(`Employee ${editingEmployee ? "updated" : "created"} successfully!`);
      setShowAlert(true);
      
      // Reset form and refresh employee list
      fetchEmployees();
      setEditingEmployee(null);
      setFormData(initialFormState);
      setImage(null);
      setImagePreview(null);
      
      // Close form after successful submission
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 2000); // Close after 2 seconds to show success message
      }
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
      
      const resError = error.response?.data;
      setAlertType("error");
      
      if (resError) {
        if (resError.message.includes('Employee ID already exists')) {
          setAlertMessage('⚠️ Employee ID already exists! Please use a unique ID.');
        } else if (resError.message.includes('numeric value')) {
          setAlertMessage('⚠️ Employee ID must be a numeric value.');
        } else if (resError.message.includes('Invalid')) {
          setAlertMessage(`⚠️ ${resError.message}`);
        } else if (resError.message.includes('email')) {
          setAlertMessage('⚠️ Email is required and must be unique.');
        } else {
          setAlertMessage(`🚨 Error: ${resError.message}`);
        }
      } else {
        setAlertMessage('🚨 Network error. Please try again.');
      }
      
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingEmployee(null);
    setFormData(initialFormState);
    setImage(null);
    setImagePreview(null);
    setShowAlert(false);
    if (onClose) onClose();
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 md:p-6 relative transition-colors duration-200 rounded-lg">
      {/* Alert Message */}
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`${
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
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
            {editingEmployee ? "Update Profile" : "New Employee"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-200">
            {editingEmployee ? "Edit employee details" : "Add new team member"}
          </p>
        </div>

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
            {imagePreview ? (
              <div className="relative w-full h-full">
                <img 
                  src={imagePreview} 
                  alt="Profile preview" 
                  className="w-full h-full rounded-full object-cover"
                  onError={() => setImagePreview(null)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-0 right-0 p-1 bg-red-500 rounded-full text-white shadow-md hover:bg-red-600 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <FiUser className="w-12 h-12 mb-2" />
                <span className="text-xs">Click to upload</span>
              </div>
            )}
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
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors duration-200">
                    {field.icon}
                  </div>
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
                  options: positions,
                  required: true
                },
                { name: "salary", icon: <FiDollarSign />, type: "number", placeholder: "Salary", required: true },
                { 
                  name: "workType", 
                  type: "select", 
                  placeholder: "Employment Type",
                  options: workTypes,
                  required: true
                },
                { 
                  name: "status", 
                  type: "select", 
                  placeholder: "Status",
                  options: statusOptions
                },
                { name: "joiningDate", icon: <FiCalendar />, type: "date", placeholder: "Joining Date", required: true },
              ].map((field) => (
                <div key={field.name} className="relative">
                  {field.icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      {field.icon}
                    </div>
                  )}
                  {field.type === 'select' ? (
                    <select
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none text-gray-900 dark:text-white"
                      required={field.required}
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      required={field.required}
                    />
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
                { name: "address", icon: <FiMapPin />, placeholder: "Address" },
                { name: "supervisor", icon: <FiUser />, placeholder: "Supervisor" },
                { name: "experienceLevel", icon: <FiAward />, placeholder: "Experience Level" },
                { name: "workingHours", icon: <FiClock />, type: "number", placeholder: "Working Hours" },
                { name: "skills", icon: <FiTool />, placeholder: "Skills" },
                { name: "previousExperience", icon: <FiFileText />, placeholder: "Previous Experience" },
              ].map((field) => (
                <div key={field.name} className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    {field.icon}
                  </div>
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
    </div>
  );
};

export default EmployeeForm; 