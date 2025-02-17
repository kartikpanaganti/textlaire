import { useState } from "react";
import axios from "axios";

function EmployeeForm({ setEmployees }) {
  const [employee, setEmployee] = useState({ name: "", position: "", department: "", email: "", phone: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post("http://localhost:5000/api/employees", employee);
    setEmployees(prev => [...prev, res.data]); // Update the list with the new employee
    setEmployee({ name: "", position: "", department: "", email: "", phone: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Add Employee</h2>
      <input className="w-full p-2 border rounded mb-2" type="text" placeholder="Name" value={employee.name} onChange={(e) => setEmployee({ ...employee, name: e.target.value })} required />
      <input className="w-full p-2 border rounded mb-2" type="text" placeholder="Position" value={employee.position} onChange={(e) => setEmployee({ ...employee, position: e.target.value })} required />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Employee</button>
    </form>
  );
}

export default EmployeeForm;
