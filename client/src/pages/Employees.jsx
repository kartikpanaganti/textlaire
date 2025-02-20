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
    <div className="p-6 flex flex-col md:flex-row gap-6 h-screen">
      {/* Left: Employee Form */}
      <div className="md:w-1/3 w-full bg-white p-4 rounded shadow-md">
        <h2 className="text-lg font-semibold mb-4">{editingEmployee ? "Edit Employee" : "Add Employee"}</h2>
        <EmployeeForm fetchEmployees={fetchEmployees} editingEmployee={editingEmployee} setEditingEmployee={setEditingEmployee} />
      </div>

      {/* Right: Employee List (Fixed height + Scrollable) */}
      <div className="md:w-2/3 w-full flex flex-col">
        <input
          type="text"
          placeholder="Search employees..."
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border w-full mb-4 rounded"
        />

        {/* Fixed height container with scrolling */}
        <div className="overflow-y-auto h-[500px] p-2 border rounded shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {employees
              .filter((emp) => emp.name.toLowerCase().includes(search.toLowerCase()))
              .map((emp) => (
                <div key={emp._id} className="p-4 border shadow-md rounded flex flex-col sm:flex-row items-center gap-4">
                  <img src={`http://localhost:5000${emp.image}`} className="w-20 h-20 object-cover rounded-full" alt={emp.name} />
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold">{emp.name}</h3>
                    <p>{emp.position}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-2 sm:mt-0">
                    <button onClick={() => handleView(emp)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                      View
                    </button>
                    <button onClick={() => handleEdit(emp)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(emp._id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;
