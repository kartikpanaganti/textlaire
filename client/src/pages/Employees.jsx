import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeForm from "../components/EmployeeForm";

const EmployeesFinal = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for modal visibility
  const [selectedItem, setSelectedItem] = useState(null); // State for selected employee

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

  const handleDeleteClick = (employee) => {
    setSelectedItem(employee); // Set the selected employee
    setIsDeleteModalOpen(true); // Open the confirmation modal
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false); // Close the modal
  };

  const handleConfirmDelete = async () => {
    if (selectedItem) {
      await handleDelete(selectedItem._id); // Call the delete function
      setIsDeleteModalOpen(false); // Close the modal
    }
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
                      onClick={() => handleDeleteClick(emp)} // Open modal on delete
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ❌ Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleCloseDeleteModal} // Close modal on overlay click
        >
          <div 
            className="bg-gray-800 p-6 rounded-lg w-96"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            <h2 className="text-lg font-semibold text-white mb-4">Confirm Deletion</h2>
            <p className="text-gray-300 mb-4">Are you sure you want to delete <strong>{selectedItem?.name}</strong>?</p>
            <div className="flex justify-end space-x-2">
              <button className="bg-gray-500 px-4 py-2 rounded text-white" onClick={handleCloseDeleteModal}>Cancel</button>
              <button className="bg-red-500 px-4 py-2 rounded text-white" onClick={handleConfirmDelete}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesFinal;
