import { useState, useEffect } from "react";
import axios from "axios";

const EmployeeForm = ({ selectedEmployee, setEmployees, setSelectedEmployee }) => {
  const [employeeData, setEmployeeData] = useState({
    name: "",
    position: "",
    department: "",
    email: "",
    phone: "",
  });

  // If editing, populate the form with selected employee's data
  useEffect(() => {
    if (selectedEmployee) {
      setEmployeeData({
        name: selectedEmployee.name,
        position: selectedEmployee.position,
        department: selectedEmployee.department,
        email: selectedEmployee.email,
        phone: selectedEmployee.phone,
      });
    } else {
      // Reset form if no employee is selected (for adding new employee)
      setEmployeeData({
        name: "",
        position: "",
        department: "",
        email: "",
        phone: "",
      });
    }
  }, [selectedEmployee]);

  const handleChange = (e) => {
    setEmployeeData({
      ...employeeData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedEmployee) {
        // Update employee
        const response = await axios.put(`http://localhost:5000/api/employees/${selectedEmployee._id}`, employeeData);
        setEmployees((prev) =>
          prev.map((emp) => (emp._id === selectedEmployee._id ? response.data : emp))
        );
        // Reset selectedEmployee to clear the form
        setSelectedEmployee(null);
      } else {
        // Create new employee
        const response = await axios.post("http://localhost:5000/api/employees", employeeData);
        setEmployees((prev) => [...prev, response.data]);
      }
      // Clear form data
      setEmployeeData({
        name: "",
        position: "",
        department: "",
        email: "",
        phone: "",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">{selectedEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
      <input type="text" name="name" value={employeeData.name} onChange={handleChange} className="w-full p-2 border mb-4" placeholder="Name" required />
      <input type="text" name="position" value={employeeData.position} onChange={handleChange} className="w-full p-2 border mb-4" placeholder="Position" required />
      <input type="text" name="department" value={employeeData.department} onChange={handleChange} className="w-full p-2 border mb-4" placeholder="Department" />
      <input type="email" name="email" value={employeeData.email} onChange={handleChange} className="w-full p-2 border mb-4" placeholder="Email" />
      <input type="text" name="phone" value={employeeData.phone} onChange={handleChange} className="w-full p-2 border mb-4" placeholder="Phone" />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        {selectedEmployee ? 'Update Employee' : 'Add Employee'}
      </button>
    </form>
  );
};

export default EmployeeForm;
