import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiRefreshCw, FiX, FiGrid, FiList, FiCheck, FiAlertCircle, FiAlertTriangle, FiUserMinus } from 'react-icons/fi';
import EmployeeForm from '../components/employee/EmployeeForm';
import EmployeeDetailsModal from '../components/employee/EmployeeDetailsModal';
import EmployeeCard from '../components/employee/EmployeeCard';
import apiClient from '../lib/api';
import { toast } from 'react-toastify';
import defaultProfileImage from '../assets/images/default-profile.png';

const EmployeePage = () => {
  // State management
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [viewMode, setViewMode] = useState('grid'); // Changed default to 'grid'
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Department options for filtering
  const departments = [
    "Production",
    "Quality Control",
    "Inventory & Raw Materials",
    "Workforce & HR",
    "Sales & Marketing",
    "Finance & Accounts",
    "Maintenance"
  ];

  // Status options for filtering
  const statuses = ["Active", "Inactive", "On Leave", "Terminated"];

  // Fetch employees from API
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/employees');
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Get image URL with default handling
  const getImageUrl = (url) => {
    if (!url) return defaultProfileImage;
    return url.startsWith('http') ? url : `http://${window.location.hostname}:5000${url}`;
  };

  // Handle employee deletion
  const handleDelete = async (id) => {
    try {
      const employee = employees.find(emp => emp._id === id);
      await apiClient.delete(`/api/employees/${id}`);
      
      // Delete success toast - Purple theme
      toast.success(
        <div className="flex items-center">
          <FiUserMinus className="w-6 h-6 mr-2 text-white" />
          <div className="text-white">
            <h4 className="font-medium">Employee Removed</h4>
            <p className="text-sm opacity-90">{employee?.name || 'Employee'} has been removed from the system</p>
          </div>
        </div>,
        {
          style: { background: '#8B5CF6' }, // Purple-500
          className: "!bg-purple-500 border-l-4 !border-purple-600",
          progressClassName: "!bg-purple-400",
          autoClose: 3000
        }
      );
      
      fetchEmployees();
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting employee:', err);
      
      // Delete error toast - Red theme
      toast.error(
        <div className="flex items-center">
          <FiAlertCircle className="w-6 h-6 mr-2 text-white" />
          <div className="text-white">
            <h4 className="font-medium">Delete Failed</h4>
            <p className="text-sm opacity-90">Unable to remove employee. Please try again.</p>
          </div>
        </div>,
        {
          style: { background: '#EF4444' }, // Red-500
          className: "!bg-red-500 border-l-4 !border-red-600",
          progressClassName: "!bg-red-400",
          autoClose: 5000
        }
      );
    }
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting, filtering, and searching
  const getSortedAndFilteredEmployees = () => {
    let filteredEmployees = [...employees];
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredEmployees = filteredEmployees.filter(
        employee => 
          employee.name?.toLowerCase().includes(search) ||
          employee.employeeID?.toLowerCase().includes(search) ||
          employee.email?.toLowerCase().includes(search) ||
          employee.phoneNumber?.toLowerCase().includes(search)
      );
    }
    
    // Apply department filter
    if (filterDepartment) {
      filteredEmployees = filteredEmployees.filter(
        employee => employee.department === filterDepartment
      );
    }
    
    // Apply status filter
    if (filterStatus) {
      filteredEmployees = filteredEmployees.filter(
        employee => employee.status === filterStatus
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filteredEmployees.sort((a, b) => {
        if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;
        
        const aValue = typeof a[sortConfig.key] === 'string' 
          ? a[sortConfig.key].toLowerCase() 
          : a[sortConfig.key];
        const bValue = typeof b[sortConfig.key] === 'string' 
          ? b[sortConfig.key].toLowerCase() 
          : b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredEmployees;
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterDepartment('');
    setFilterStatus('');
    setSortConfig({ key: 'name', direction: 'ascending' });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1400px]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
          Employee Management
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {viewMode === 'table' ? 'Grid View' : 'Table View'}
          </button>
          <button
            onClick={() => {
              setEditingEmployee(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <FiPlus /> Add New Employee
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center">
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <FiRefreshCw /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
          </div>
        ) : getSortedAndFilteredEmployees().length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <p className="text-gray-600 dark:text-gray-400">No employees found.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('employeeID')}
                  >
                    ID {getSortIndicator('employeeID')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Photo
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('name')}
                  >
                    Name {getSortIndicator('name')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('department')}
                  >
                    Department {getSortIndicator('department')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('position')}
                  >
                    Position {getSortIndicator('position')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('status')}
                  >
                    Status {getSortIndicator('status')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('joiningDate')}
                  >
                    Joined {getSortIndicator('joiningDate')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {getSortedAndFilteredEmployees().map((employee) => (
                  <tr 
                    key={employee._id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {employee.employeeID}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                          src={getImageUrl(employee.image)}
                          alt={`${employee.name}'s profile`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultProfileImage;
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {employee.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {employee.department}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {employee.position}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.status === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : employee.status === 'Inactive'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : employee.status === 'On Leave'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(employee.joiningDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEmployee(employee);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(employee._id);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {getSortedAndFilteredEmployees().map((employee) => (
              <EmployeeCard
                key={employee._id}
                employee={employee}
                onEdit={(e) => {
                  e.stopPropagation();
                  setEditingEmployee(employee);
                  setShowForm(true);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(employee._id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {/* Employee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingEmployee(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <EmployeeForm
                fetchEmployees={fetchEmployees}
                editingEmployee={editingEmployee}
                setEditingEmployee={setEditingEmployee}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full">
                <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm Delete
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this employee? All their data will be permanently removed from the system.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;