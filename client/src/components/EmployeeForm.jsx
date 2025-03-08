import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { 
  FiUser, FiMail, FiPhone, FiBriefcase, FiDollarSign, 
  FiCalendar, FiMapPin, FiAlertTriangle, FiClock, 
  FiFileText, FiX, FiUpload, FiTool, FiAward, FiShield
} from "react-icons/fi";
import { ThemeContext } from "../context/ThemeProvider";

const EmployeeForm = ({ fetchEmployees, editingEmployee, setEditingEmployee }) => {
  const { theme } = useContext(ThemeContext);
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
  const statusOptions = ["Active", "Inactive", "On Leave", "Terminated"];

  useEffect(() => {
    if (editingEmployee) {
      const mergedData = { ...initialFormState, ...editingEmployee };
      const getImageUrl = (url) => {
        return url?.startsWith('http') ? url : `http://localhost:5000/${url || 'default-profile.png'}`;
      };

      setFormData({
        ...mergedData,
        joiningDate: mergedData.joiningDate?.split('T')[0] || "",
        status: mergedData.status || "Active"
      });

      setImagePreview(getImageUrl(mergedData.imageUrl));
    }
  }, [editingEmployee]);

  useEffect(() => {
    if (image) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(image);
    }
  }, [image]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowAlert(false);
    
    try {
      const formPayload = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formPayload.append(key, value);
      });
      
      if (image) {
        formPayload.append("image", image);
      } else if (editingEmployee?.imageUrl) {
        formPayload.append("imageUrl", editingEmployee.imageUrl);
      }

      const baseURL = "http://localhost:5000/api/employees";
      const url = editingEmployee ? `${baseURL}/${editingEmployee._id}` : baseURL;
      
      await axios[editingEmployee ? "put" : "post"](url, formPayload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      fetchEmployees();
      setEditingEmployee(null);
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      const resError = error.response?.data;
      if (resError) {
        if (resError.message.includes('Employee ID must be unique')) {
          setAlertMessage('⚠️ Employee ID already exists! Please use a unique ID.');
        } else {
          setAlertMessage(`🚨 Error: ${resError.message}`);
        }
        setShowAlert(true);
      }
    }
  };

  const handleCancel = () => {
    setEditingEmployee(null);
    setImage(null);
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 relative transition-colors duration-200">
      {/* Duplicate ID Alert */}
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded-lg shadow-lg flex items-center transition-colors duration-200">
            <span className="mr-2">❗</span>
            <span>{alertMessage}</span>
            <button
              onClick={() => setShowAlert(false)}
              className="ml-4 text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100 transition-colors duration-200"
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
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.type.startsWith('image/')) {
                    setImage(file);
                  } else {
                    alert('Please upload an image file (JPEG, PNG, etc.)');
                    e.target.value = ''; // Reset input
                  }
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
              id="image-upload"
            />
            {imagePreview ? (
              <div className="relative w-full h-full">
                <img 
                  src={imagePreview} 
                  alt="Profile preview" 
                  className="w-full h-full rounded-full object-cover"
                  onError={() => setImagePreview(null)} // Handle broken images
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                    if (editingEmployee?.imageUrl) {
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                    }
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
               editingEmployee?.imageUrl ? "Current image" : 
               "No file chosen"}
            </span>
          </div>

          {editingEmployee?.imageUrl && !image && (
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Existing image will be retained
              </p>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
              >
                Remove current image
              </button>
            </div>
          )}
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
                    {...field}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
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
                { name: "employeeID", icon: <FiAward />, placeholder: "Employee ID"},
                { 
                  name: "department", 
                  icon: <FiBriefcase />, 
                  type: "select", 
                  placeholder: "Department",
                  options: ["Weaving", "Dyeing", "Printing", "Quality Control", "Packaging", "Maintenance"],
                  required: true
                },
                { 
                  name: "position", 
                  icon: <FiUser />, 
                  type: "select", 
                  placeholder: "Position",
                  options: ["Machine Operator", "Quality Inspector", "Supervisor", "Technician", "Helper"],
                  required: true
                },
                { name: "salary", icon: <FiDollarSign />, type: "number", placeholder: "Salary", required: true },
                { 
                  name: "workType", 
                  type: "select", 
                  placeholder: "Employment Type",
                  options: ["Full-Time", "Part-Time", "Contract", "Seasonal", "Trainee"],
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
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
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
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
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

          {/* Work Schedule */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
              Work Schedule
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { 
                  name: "shiftTiming", 
                  icon: <FiClock />, 
                  type: "select", 
                  placeholder : "Shift Timing",
                  options: ["Morning (6AM-2PM)", "Afternoon (2PM-10PM)", "Night (10PM-6AM)"]
                },
                { 
                  name: "experienceLevel", 
                  icon: <FiTool />, 
                  type: "select", 
                  placeholder: "Experience Level",
                  options: ["Entry-Level", "Intermediate", "Experienced", "Expert"]
                },
                { 
                  name: "safetyCertification", 
                  icon: <FiShield />, 
                  placeholder: "Safety Certification ID" 
                },
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
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
              Skills
            </h2>
            <input
              type="text"
              name="skills"
              placeholder="e.g., Loom Operation, Fabric Cutting, Quality Checking"
              value={formData.skills || ""}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <button 
            type="button" 
            onClick={handleCancel} 
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
          >
            {editingEmployee ? "Update Employee" : "Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;