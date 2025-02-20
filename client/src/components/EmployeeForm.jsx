import { useState, useEffect } from "react";
import axios from "axios";

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
  });

  const [image, setImage] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        name: editingEmployee.name || "",
        email: editingEmployee.email || "",
        phoneNumber: editingEmployee.phoneNumber || "",
        department: editingEmployee.department || "",
        position: editingEmployee.position || "",
        employeeID: editingEmployee.employeeID || "",
        salary: editingEmployee.salary || "",
        shiftTiming: editingEmployee.shiftTiming || "",
        joiningDate: editingEmployee.joiningDate
          ? editingEmployee.joiningDate.split("T")[0]
          : "",
        experienceLevel: editingEmployee.experienceLevel || "",
        workType: editingEmployee.workType || "",
        supervisor: editingEmployee.supervisor || "",
        address: editingEmployee.address || "",
        emergencyContact: editingEmployee.emergencyContact || "",
        previousExperience: editingEmployee.previousExperience || "",
        skills: editingEmployee.skills || "",
        workingHours: editingEmployee.workingHours || "",
        attendanceRecord: editingEmployee.attendanceRecord || "",
      });
      setExistingImage(editingEmployee.profileImage || null);
      setImage(null);
    }
  }, [editingEmployee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newFormData = new FormData();
    Object.keys(formData).forEach((key) => {
      newFormData.append(key, formData[key]);
    });

    if (image) {
      newFormData.append("image", image);
    } else if (existingImage) {
      newFormData.append("existingImage", existingImage);
    }

    try {
      if (editingEmployee) {
        await axios.put(
          `http://localhost:5000/api/employees/${editingEmployee._id}`,
          newFormData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        await axios.post("http://localhost:5000/api/employees", newFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fetchEmployees();
      setEditingEmployee(null);
      setFormData({
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
      });
      setImage(null);
      setExistingImage(null);
    } catch (error) {
      console.error("Error saving employee:", error);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 rounded shadow-md bg-white dark:bg-gray-800 dark:text-white">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="text-lg font-semibold mb-4">
          {editingEmployee ? "Edit Employee" : "Add Employee"}
        </h2>

        {/* Input Fields */}
        {[
          { name: "name", type: "text", placeholder: "Full Name", required: true },
          { name: "email", type: "email", placeholder: "Email", required: true },
          { name: "phoneNumber", type: "text", placeholder: "Phone Number", required: true },
          { name: "department", type: "text", placeholder: "Department" },
          { name: "position", type: "text", placeholder: "Position", required: true },
          { name: "employeeID", type: "text", placeholder: "Employee ID" },
          { name: "salary", type: "number", placeholder: "Salary" },
          { name: "shiftTiming", type: "text", placeholder: "Shift Timing" },
          { name: "joiningDate", type: "date" },
          { name: "experienceLevel", type: "text", placeholder: "Experience Level" },
          { name: "supervisor", type: "text", placeholder: "Supervisor/Manager" },
          { name: "emergencyContact", type: "text", placeholder: "Emergency Contact" },
          { name: "workingHours", type: "number", placeholder: "Working Hours" },
        ].map(({ name, type, placeholder, required }) => (
          <input
            key={name}
            type={type}
            name={name}
            placeholder={placeholder}
            value={formData[name]}
            onChange={handleChange}
            className="p-2 border w-full rounded bg-gray-100 dark:bg-gray-700 dark:text-white"
            required={required}
          />
        ))}

        {/* Work Type */}
        <select 
          name="workType" 
          value={formData.workType} 
          onChange={handleChange} 
          className="p-2 border w-full rounded bg-gray-100 dark:bg-gray-700 dark:text-white">
          <option value="">Select Work Type</option>
          <option value="Permanent">Permanent</option>
          <option value="Contract">Contract</option>
        </select>

        {/* Textareas */}
        {[
          { name: "address", placeholder: "Address" },
          { name: "previousExperience", placeholder: "Previous Experience" },
          { name: "skills", placeholder: "Skills & Certifications" },
          { name: "attendanceRecord", placeholder: "Attendance Record" },
        ].map(({ name, placeholder }) => (
          <textarea
            key={name}
            name={name}
            placeholder={placeholder}
            value={formData[name]}
            onChange={handleChange}
            className="p-2 border w-full rounded bg-gray-100 dark:bg-gray-700 dark:text-white"
          />
        ))}

        {/* Profile Image */}
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange} 
          className="p-2 border w-full rounded bg-gray-100 dark:bg-gray-700 dark:text-white" 
        />
        {existingImage && !image && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">Current Image:</p>
            <img src={`http://localhost:5000/uploads/${existingImage}`} alt="Employee" className="w-20 h-20 rounded-md"/>
          </div>
        )}

        {/* Submit Button */}
        <button type="submit" 
          className="bg-green-500 dark:bg-green-700 text-white px-4 py-2 rounded w-full">
          {editingEmployee ? "Update Employee" : "Add Employee"}
        </button>

        {/* Cancel Edit Button */}
        {editingEmployee && (
          <button
            type="button"
            className="bg-gray-400 dark:bg-gray-600 text-white px-4 py-2 rounded w-full mt-2"
            onClick={() => setEditingEmployee(null)}
          >
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
};

export default EmployeeForm;
