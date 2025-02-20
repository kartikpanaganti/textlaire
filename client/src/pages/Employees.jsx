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
    alert(
      `Employee Details:\n\n` +
      `Name: ${employee.name}\n` +
      `Email: ${employee.email}\n` +
      `Phone: ${employee.phoneNumber}\n` +
      `Department: ${employee.department}\n` +
      `Position: ${employee.position}\n` +
      `Employee ID: ${employee.employeeID}\n` +
      `Salary: ${employee.salary}\n` +
      `Shift Timing: ${employee.shiftTiming}\n` +
      `Joining Date: ${employee.joiningDate}\n` +
      `Experience Level: ${employee.experienceLevel}\n` +
      `Work Type: ${employee.workType}\n` +
      `Supervisor: ${employee.supervisor}\n` +
      `Address: ${employee.address}\n` +
      `Emergency Contact: ${employee.emergencyContact}\n` +
      `Previous Experience: ${employee.previousExperience}\n` +
      `Skills: ${employee.skills}\n` +
      `Working Hours: ${employee.workingHours}\n` +
      `Attendance Record: ${employee.attendanceRecord}`
    );
  };

  return (
    <div className="p-6 flex flex-col md:flex-row gap-6 h-screen">
      {/* Left: Employee Form */}
      <div className="md:w-1/3 w-full bg-white p-4 rounded shadow-md h-[600px] overflow-y-auto">
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
                <div key={emp._id} className="p-4 border shadow-md rounded flex flex-col sm:flex-row items-center gap-4 bg-white">
                  <img
                    src={`http://localhost:5000${emp.image}`}
                    className="w-20 h-20 object-cover rounded-full border"
                    alt={emp.name}
                  />
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="text-lg font-bold">{emp.name}</h3>
                    <p className="text-sm text-gray-600">{emp.position}</p>
                    <p className="text-xs text-gray-500">Department: {emp.department}</p>
                    <p className="text-xs text-gray-500">Salary: ${emp.salary}</p>
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
