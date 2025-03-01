import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeForm from "../components/EmployeeForm";
import Modal from "../components/Modal";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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

  const handleView = (employee) => {
    setViewingEmployee(employee);
    setIsViewModalOpen(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`);
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  const handleDeleteClick = (employee) => {
    setSelectedItem(employee);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsViewModalOpen(false);
    setEditingEmployee(null);
    setSelectedItem(null);
    setViewingEmployee(null);
  };

  const EmployeeCard = ({ employee }) => (
    <div className="p-4 border shadow-md rounded flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 transition-transform hover:scale-[1.02]">
      <img
        src={employee.image ? `http://localhost:5000${employee.image}` : "/default-profile.png"}
        className="w-20 h-20 object-cover rounded-full border dark:border-gray-500"
        alt={employee.name}
      />
      <div className="text-center sm:text-left flex-1">
        <h3 className="text-lg font-bold">{employee.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{employee.position}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Department: {employee.department}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Salary: ${employee.salary}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-2 sm:mt-0">
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 dark:bg-blue-700"
          onClick={() => handleView(employee)}
        >
          View
        </button>
        <button
          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 dark:bg-yellow-700"
          onClick={() => handleEdit(employee)}
        >
          Edit
        </button>
        <button
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 dark:bg-red-700"
          onClick={() => handleDeleteClick(employee)}
        >
          Delete
        </button>
      </div>
    </div>
  );

  const DetailItem = ({ label, value }) => (
    <div className="flex gap-2">
      <span className="font-semibold text-gray-600 dark:text-gray-400">{label}:</span>
      <span className="text-gray-800 dark:text-gray-200">{value || 'N/A'}</span>
    </div>
  );

  return (
    <div className="p-6 h-screen overflow-hidden relative">
      {/* Search Bar and Add Button */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search employees..."
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border w-full rounded bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        <button
          onClick={() => setIsFormModalOpen(true)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 dark:bg-green-700"
        >
          Add Employee
        </button>
      </div>

      {/* Employee List */}
      <div className="overflow-y-auto h-[calc(100vh-160px)] p-2 rounded shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {employees
            .filter((emp) => emp.name?.toLowerCase().includes(search.toLowerCase()))
            .map((emp) => (
              <EmployeeCard key={emp._id} employee={emp} />
            ))}
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        maxWidth="max-w-4xl"
        fullHeight
      >
        <div className="p-4 h-[90vh] overflow-y-auto">
          <EmployeeForm
            fetchEmployees={() => {
              fetchEmployees();
              handleCloseModals();
            }}
            editingEmployee={editingEmployee}
            setEditingEmployee={(employee) => {
              setEditingEmployee(employee);
              if (!employee) handleCloseModals();
            }}
          />
        </div>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={handleCloseModals}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold dark:text-white">
              {viewingEmployee?.name}
              <span className="ml-2 text-lg text-gray-500">#{viewingEmployee?.employeeID}</span>
            </h2>
            <button
              onClick={handleCloseModals}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-shrink-0">
              <img
                src={viewingEmployee?.image
                  ? `http://localhost:5000${viewingEmployee.image}`
                  : "/default-profile.png"}
                className="w-48 h-48 object-cover rounded-full border-4 border-white shadow-lg"
                alt={viewingEmployee?.name}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm dark:text-gray-200 flex-1">
              <DetailItem label="Position" value={viewingEmployee?.position} />
              <DetailItem label="Department" value={viewingEmployee?.department} />
              <DetailItem label="Email" value={viewingEmployee?.email} />
              <DetailItem label="Phone" value={viewingEmployee?.phoneNumber} />
              <DetailItem label="Salary" value={`$${viewingEmployee?.salary}`} />
              <DetailItem label="Shift Timing" value={viewingEmployee?.shiftTiming} />
              <DetailItem label="Work Type" value={viewingEmployee?.workType} />
              <DetailItem label="Joining Date" value={viewingEmployee?.joiningDate} />
              <DetailItem label="Experience" value={viewingEmployee?.experienceLevel} />
              <DetailItem label="Supervisor" value={viewingEmployee?.supervisor} />
              <DetailItem label="Address" value={viewingEmployee?.address} />
              <DetailItem label="Emergency Contact" value={viewingEmployee?.emergencyContact} />
              <DetailItem label="Working Hours" value={viewingEmployee?.workingHours} />
              <div className="col-span-full">
                <DetailItem label="Skills" value={viewingEmployee?.skills} />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Confirm Deletion</h2>
          <p className="text-gray-300 mb-4">
            Are you sure you want to delete <strong>{selectedItem?.name}'s</strong> employee details ?
          </p>
          <div className="flex justify-end space-x-2">
            <button
              className="bg-gray-500 px-4 py-2 rounded text-white"
              onClick={handleCloseModals}
            >
              Cancel
            </button>
            <button
              className="bg-red-500 px-4 py-2 rounded text-white"
              onClick={() => {
                handleDelete(selectedItem?._id);
                handleCloseModals();
              }}
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;