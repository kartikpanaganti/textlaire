import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeForm from "../components/EmployeeForm";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);

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
    setViewingEmployee(employee);
  };

  const closeModal = () => {
    setViewingEmployee(null);
  };

  return (
    <div className="p-6 flex flex-col md:flex-row gap-6 h-screen overflow-hidden">
      {/* Left: Employee Form */}
      <div className="md:w-1/3 w-full bg-white dark:bg-gray-800 p-4 rounded shadow-md h-full flex flex-col">
        <EmployeeForm 
          fetchEmployees={fetchEmployees} 
          editingEmployee={editingEmployee} 
          setEditingEmployee={setEditingEmployee} 
        />
      </div>

      {/* Right: Employee List */}
      <div className="md:w-2/3 w-full flex flex-col h-full">
        <input
          type="text"
          placeholder="Search employees..."
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border w-full mb-4 rounded bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />

        {/* Scrollable Employee List */}
        <div className="overflow-y-auto flex-1 p-2 rounded shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {employees
              .filter((emp) => emp.name.toLowerCase().includes(search.toLowerCase()))
              .map((emp) => (
                <div 
                  key={emp._id} 
                  className="p-4 border shadow-md rounded flex flex-col sm:flex-row items-center gap-4 
                            bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <img
                    src={emp.image ? `http://localhost:5000${emp.image}` : "/default-profile.png"}
                    className="w-20 h-20 object-cover rounded-full border dark:border-gray-500"
                    alt={emp.name}
                  />
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="text-lg font-bold">{emp.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{emp.position}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Department: {emp.department}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Salary: ${emp.salary}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-2 sm:mt-0">
                    <button 
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600"
                      onClick={() => handleView(emp)}
                    >
                      View
                    </button>
                    <button 
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 dark:bg-yellow-700 dark:hover:bg-yellow-600"
                      onClick={() => handleEdit(emp)}
                    >
                      Edit
                    </button>
                    <button 
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600"
                      onClick={() => handleDelete(emp._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Employee Details Modal */}
      {viewingEmployee && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-2xl w-[450px] max-h-[80vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeModal} className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-full">
              ✕
            </button>
            <div className="text-center mb-4">
              <img
                src={viewingEmployee.image ? `http://localhost:5000${viewingEmployee.image}` : "/default-profile.png"}
                alt={viewingEmployee.name}
                className="w-28 h-28 object-cover rounded-full mx-auto border-4 border-blue-500 shadow-md"
              />
              <h2 className="text-2xl font-semibold mt-2">{viewingEmployee.name}</h2>
              <p className="text-gray-500">{viewingEmployee.position} - {viewingEmployee.department}</p>
            </div>

            <div className="space-y-3 text-gray-700">
              <p><strong>Email:</strong> {viewingEmployee.email}</p>
              <p><strong>Phone:</strong> {viewingEmployee.phoneNumber}</p>
              <p><strong>Employee ID:</strong> {viewingEmployee.employeeID}</p>
              <p><strong>Salary:</strong> ${viewingEmployee.salary}</p>
              <p><strong>Shift Timing:</strong> {viewingEmployee.shiftTiming}</p>
              <p><strong>Joining Date:</strong> {viewingEmployee.joiningDate}</p>
              <p><strong>Experience Level:</strong> {viewingEmployee.experienceLevel}</p>
              <p><strong>Work Type:</strong> {viewingEmployee.workType}</p>
              <p><strong>Supervisor:</strong> {viewingEmployee.supervisor}</p>
              <p><strong>Address:</strong> {viewingEmployee.address}</p>
              <p><strong>Emergency Contact:</strong> {viewingEmployee.emergencyContact}</p>
              <p><strong>Skills:</strong> {viewingEmployee.skills}</p>
              <p><strong>Working Hours:</strong> {viewingEmployee.workingHours}</p>
              <p><strong>Attendance Record:</strong> {viewingEmployee.attendanceRecord}</p>
            </div>

            <div className="mt-6">
              <button onClick={closeModal} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md text-lg font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
