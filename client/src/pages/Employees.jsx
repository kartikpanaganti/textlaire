import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeForm from "../components/EmployeeForm";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/employees");
      setEmployees(res.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`);
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  const handleView = (employee) => {
    alert(`Employee Details:\n\nName: ${employee.name}\nPosition: ${employee.position}\nEmail: ${employee.email}`);
  };

  return (
    <div className="p-6 flex gap-6">
      {/* Left: Employee Form */}
      <div className="w-1/3 bg-white p-4 rounded shadow-md">
        <h2 className="text-lg font-semibold mb-4">{editingEmployee ? "Edit Employee" : "Add Employee"}</h2>
        <EmployeeForm fetchEmployees={fetchEmployees} editingEmployee={editingEmployee} setEditingEmployee={setEditingEmployee} />
      </div>

      {/* Right: Employee List */}
      <div className="w-2/3">
        <input
          type="text"
          placeholder="Search employees..."
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border w-full mb-4"
        />
        <div className="grid grid-cols-2 gap-4">
          {employees
            .filter((emp) => emp.name.toLowerCase().includes(search.toLowerCase()))
            .map((emp) => (
              <div key={emp._id} className="p-4 border shadow-md rounded flex items-center gap-4">
                <img src={`http://localhost:5000${emp.image}`} className="w-16 h-16 object-cover rounded-full" alt={emp.name} />
                <div>
                  <h3 className="text-lg font-bold">{emp.name}</h3>
                  <p>{emp.position}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleView(emp)} className="bg-blue-500 text-white px-2 py-1 rounded">View</button>
                  <button onClick={() => handleEdit(emp)} className="bg-yellow-500 text-white px-2 py-1 rounded">Edit</button>
                  <button onClick={() => handleDelete(emp._id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Employees;
