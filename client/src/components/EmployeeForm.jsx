import { useState, useEffect } from "react";
import axios from "axios";
import { 
  FiUser, FiMail, FiPhone, FiBriefcase, FiDollarSign, 
  FiCalendar, FiMapPin, FiAlertTriangle, FiClock, 
  FiFileText, FiX, FiUpload, FiTool, FiAward
} from "react-icons/fi";

const EmployeeForm = ({ fetchEmployees, editingEmployee, setEditingEmployee }) => {
  const [formData, setFormData] = useState({
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
    supervisor: "",
    address: "",
    emergencyContact: "",
    previousExperience: "",
    skills: "",
    workingHours: "",
    attendanceRecord: "",
    imageUrl: ""
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Initialize form data and image preview
  useEffect(() => {
    if (editingEmployee) {
      // Convert relative URL to absolute if needed
      const getImageUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `http://localhost:5000/${url}`;
      };

      setFormData({
        name: editingEmployee.name || "",
        email: editingEmployee.email || "",
        phoneNumber: editingEmployee.phoneNumber || "",
        department: editingEmployee.department || "",
        position: editingEmployee.position || "",
        employeeID: editingEmployee.employeeID || "",
        salary: editingEmployee.salary || "",
        shiftTiming: editingEmployee.shiftTiming || "",
        joiningDate: editingEmployee.joiningDate?.split('T')[0] || "",
        experienceLevel: editingEmployee.experienceLevel || "",
        workType: editingEmployee.workType || "",
        supervisor: editingEmployee.supervisor || "",
        address: editingEmployee.address || "",
        emergencyContact: editingEmployee.emergencyContact || "",
        previousExperience: editingEmployee.previousExperience || "",
        skills: editingEmployee.skills || "",
        workingHours: editingEmployee.workingHours || "",
        attendanceRecord: editingEmployee.attendanceRecord || "",
        imageUrl: editingEmployee.imageUrl || ""
      });

      // Set image preview with proper URL
      const imageUrl = getImageUrl(editingEmployee.imageUrl);
      setImagePreview(imageUrl);
      setImage(null);
    }
  }, [editingEmployee]);

  // Handle new image uploads
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
    const formPayload = new FormData();
    
    // Append all form data
    Object.entries(formData).forEach(([key, value]) => {
      if (value) formPayload.append(key, value);
    });
    
    // Handle image upload
    if (image) {
      formPayload.append("image", image);
    } else if (editingEmployee?.imageUrl) {
      formPayload.append("imageUrl", editingEmployee.imageUrl);
    }

    try {
      const baseURL = "http://localhost:5000/api/employees";
      const url = editingEmployee 
        ? `${baseURL}/${editingEmployee._id}`
        : baseURL;
      
      const method = editingEmployee ? "put" : "post";
      await axios[method](url, formPayload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      // Reset form
      fetchEmployees();
      setEditingEmployee(null);
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
    }
  };

  const handleCancel = () => {
    setEditingEmployee(null);
    setImage(null);
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {editingEmployee ? "Update Profile" : "New Employee"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {editingEmployee ? "Edit employee details" : "Add new team member"}
          </p>
        </div>

        {/* Profile Image Upload */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative group w-32 h-32 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 transition-colors">
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImage(e.target.files[0])} 
              className="absolute inset-0 opacity-0 cursor-pointer"
              id="image-upload"
            />
            
            {/* Image Preview */}
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                <FiUser className="w-12 h-12" />
              </div>
            )}
          </div>
          
          {/* File Info */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="image-upload"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
            >
              Choose File
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {image ? image.name : 
               editingEmployee?.imageUrl ? "Current image" : 
               "No file chosen"}
            </span>
          </div>
          
          {/* Existing Image Notice */}
          {editingEmployee?.imageUrl && !image && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Existing image will be retained
            </p>
          )}
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              Personal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "name", icon: <FiUser />, placeholder: "Full Name", required: true },
                { name: "email", icon: <FiMail />, type: "email", placeholder: "Email Address", required: true },
                { name: "phoneNumber", icon: <FiPhone />, placeholder: "Phone Number", required: true },
                { name: "emergencyContact", icon: <FiAlertTriangle />, placeholder: "Emergency Contact" },
              ].map((field) => (
                <div key={field.name} className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    {field.icon}
                  </div>
                  <input
                    {...field}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                { name: "employeeID", icon: <FiAward />, placeholder: "Employee ID" },
                { name: "department", icon: <FiBriefcase />, placeholder: "Department" },
                { name: "position", icon: <FiUser />, placeholder: "Position", required: true },
                { name: "salary", icon: <FiDollarSign />, type: "number", placeholder: "Salary" },
                { name: "workType", type: "select", placeholder: "Employment Type" },
                { name: "joiningDate", icon: <FiCalendar />, type: "date", placeholder: "Joining Date" },
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
                      value={formData[field.name]}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">{field.placeholder}</option>
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract</option>
                    </select>
                  ) : (
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name]}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Work Schedule */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
              Work Schedule
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "shiftTiming", icon: <FiClock />, placeholder: "Shift Timing" },
                { name: "workingHours", type: "number", placeholder: "Working Hours" },
                { name: "supervisor", icon: <FiUser />, placeholder: "Supervisor" },
                { name: "experienceLevel", icon: <FiTool />, placeholder: "Experience Level" },
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
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {editingEmployee ? "Update Employee" : "Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;