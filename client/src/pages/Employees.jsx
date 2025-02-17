import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeForm from "../components/EmployeeForm";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    // Fetch employees
    axios.get("http://localhost:5000/api/employees")
      .then(res => setEmployees(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleDelete = (id) => {
    axios.delete(`http://localhost:5000/api/employees/${id}`)
      .then(() => {
        setEmployees((prev) => prev.filter(emp => emp._id !== id));
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Manage Employees</h1>
      <EmployeeForm selectedEmployee={selectedEmployee} setEmployees={setEmployees} />
      <div className="mt-6 p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-bold mb-4">Employee List</h2>
        <ul>
          {employees.map(emp => (
            <li key={emp._id} className="border p-2 my-2 rounded">
              {emp.name} - {emp.position}
              <button onClick={() => handleEdit(emp)} className="ml-4 bg-yellow-500 text-white p-1 rounded">Edit</button>
              <button onClick={() => handleDelete(emp._id)} className="ml-2 bg-red-500 text-white p-1 rounded">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Employees;
