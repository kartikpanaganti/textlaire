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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    department: "all",
    position: "all",
    status: "all"
  });

  // Consistent with EmployeeForm options
  const departments = ["Weaving", "Dyeing", "Printing", "Quality Control", "Packaging", "Maintenance"];
  const positions = ["Machine Operator", "Quality Inspector", "Supervisor", "Technician", "Helper"];
  const statuses = ["Active", "On Leave", "Offboarded"];

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

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const applyFilters = () => setShowFilters(false);
  const resetFilters = () => setFilters({ department: "all", position: "all", status: "all" });

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name?.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = filters.department === "all" || employee.department === filters.department;
    const matchesPosition = filters.position === "all" || employee.position === filters.position;
    const matchesStatus = filters.status === "all" || employee.status === filters.status;
    
    return matchesSearch && matchesDepartment && matchesPosition && matchesStatus;
  });

  // View/Edit/Delete handlers remain the same
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
        <p className="text-xs text-gray-500 dark:text-gray-400">Status: {employee.status || "Active"}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-2 sm:mt-0">
        <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 dark:bg-blue-700" onClick={() => handleView(employee)}>
          View
        </button>
        <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 dark:bg-yellow-700" onClick={() => handleEdit(employee)}>
          Edit
        </button>
        <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 dark:bg-red-700" onClick={() => handleDeleteClick(employee)}>
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
      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative group">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Find team members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-6 pr-12 py-4 text-lg rounded-3xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl shadow-black/5 hover:shadow-black/10 focus:shadow-none transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 outline-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                <button 
                  className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="absolute z-20 mt-3 w-full p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position
                  </label>
                  <select
                    value={filters.position}
                    onChange={(e) => handleFilterChange('position', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  >
                    <option value="all">All Positions</option>
                    {positions.map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  >
                    <option value="all">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={applyFilters}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 rounded-full shadow-lg" />
        </div>

        {/* Add Button */}
        <button
          onClick={() => setIsFormModalOpen(true)}
          className="px-8 py-4 bg-gradient-to-b from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-500/30 dark:shadow-indigo-900/40 hover:shadow-indigo-500/40 dark:hover:shadow-indigo-900/50 hover:translate-y-[-2px] active:translate-y-0 transition-all duration ```jsx
-300 group/button"
        >
          <div className="flex items-center gap-3">
            <span className="relative">
              <span className="inline-block transition-transform group-hover/button:translate-y-[-1px]">Add Member</span>
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-white/10 rounded-full scale-x-0 group-hover/button:scale-x-100 transition-transform duration-300 origin-left" />
            </span>
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-sm" />
              <svg 
                className="w-6 h-6 transform transition-transform group-hover/button:rotate-90"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* Employee List */}
      <div className="overflow-y-auto h-[calc(100vh-160px)] p-2 rounded shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredEmployees.map((emp) => (
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
                <DetailItem label=" Skills" value={viewingEmployee?.skills} />
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
            Are you sure you want to delete <strong>{selectedItem?.name}'s</strong> employee details?
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