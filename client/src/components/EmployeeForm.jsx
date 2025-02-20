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

  // Load existing employee data when editing
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
        joiningDate: editingEmployee.joiningDate ? editingEmployee.joiningDate.split("T")[0] : "",
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
      setImage(null); // Reset image when editing
    }
  }, [editingEmployee]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newFormData = new FormData();
    Object.keys(formData).forEach((key) => {
      newFormData.append(key, formData[key]);
    });

    if (image) {
      newFormData.append("image", image);
    }

    try {
      if (editingEmployee) {
        await axios.put(`http://localhost:5000/api/employees/${editingEmployee._id}`, newFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
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
    } catch (error) {
      console.error("Error saving employee:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 overflow-y-auto h-[600px] p-4 border rounded shadow-md">
      {/* Name */}
      <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="p-2 border w-full rounded" required />
      
      {/* Email */}
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="p-2 border w-full rounded" required />
      
      {/* Phone Number */}
      <input type="text" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} className="p-2 border w-full rounded" required />
      
      {/* Department */}
      <input type="text" name="department" placeholder="Department" value={formData.department} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Position */}
      <input type="text" name="position" placeholder="Position" value={formData.position} onChange={handleChange} className="p-2 border w-full rounded" required />
      
      {/* Employee ID */}
      <input type="text" name="employeeID" placeholder="Employee ID" value={formData.employeeID} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Salary */}
      <input type="number" name="salary" placeholder="Salary" value={formData.salary} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Shift Timing */}
      <input type="text" name="shiftTiming" placeholder="Shift Timing" value={formData.shiftTiming} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Joining Date */}
      <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Experience Level */}
      <input type="text" name="experienceLevel" placeholder="Experience Level" value={formData.experienceLevel} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Work Type */}
      <select name="workType" value={formData.workType} onChange={handleChange} className="p-2 border w-full rounded">
        <option value="">Select Work Type</option>
        <option value="Permanent">Permanent</option>
        <option value="Contract">Contract</option>
      </select>
      
      {/* Supervisor */}
      <input type="text" name="supervisor" placeholder="Supervisor/Manager" value={formData.supervisor} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Address */}
      <textarea name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Emergency Contact */}
      <input type="text" name="emergencyContact" placeholder="Emergency Contact" value={formData.emergencyContact} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Previous Experience */}
      <textarea name="previousExperience" placeholder="Previous Experience" value={formData.previousExperience} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Skills & Certifications */}
      <textarea name="skills" placeholder="Skills & Certifications" value={formData.skills} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Working Hours */}
      <input type="number" name="workingHours" placeholder="Working Hours" value={formData.workingHours} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Attendance Record */}
      <textarea name="attendanceRecord" placeholder="Attendance Record" value={formData.attendanceRecord} onChange={handleChange} className="p-2 border w-full rounded" />
      
      {/* Profile Image */}
      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="p-2 border w-full rounded" />
      
      {/* Submit Button */}
      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded w-full">
        {editingEmployee ? "Update Employee" : "Add Employee"}
      </button>
      {editingEmployee && (
  <button
    type="button"
    className="bg-gray-400 text-white px-4 py-2 rounded w-full mt-2"
    onClick={() => setEditingEmployee(null)}
  >
    Cancel Edit
  </button>
)}
    </form>
  );
};

export default EmployeeForm;
