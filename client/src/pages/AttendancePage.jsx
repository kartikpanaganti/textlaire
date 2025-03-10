import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaSpinner, FaEdit, FaTrash, FaPlus, FaSearch,
  FaFileExport, FaTimes, FaUserCheck, FaMoon, FaSun, FaCalendarAlt, FaChartBar
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { format, startOfWeek } from 'date-fns';
import AttendanceFilters from '../components/attendance/AttendanceFilters';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import AttendanceForm from '../components/attendance/AttendanceForm';
import QuickAttendanceForm from '../components/attendance/QuickAttendanceForm';
import { submitBulkAttendance } from '../api/attendance';
import { useNavigate } from "react-router-dom";

import Select from 'react-select';
const AttendancePage = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateEmployee, setDuplicateEmployee] = useState(null);
  const [duplicateDate, setDuplicateDate] = useState(null);
  const [tempFormData, setTempFormData] = useState(null);
  const [showQuickAttendance, setShowQuickAttendance] = useState(false);
  const [showDateView, setShowDateView] = useState(false);
  const [dateViewRecords, setDateViewRecords] = useState([]);
  const [startDate, setStartDate] = useState(""); // State for start date filter
  const [endDate, setEndDate] = useState(""); // State for end date filter
  const [statusFilter, setStatusFilter] = useState([]); // Multi-select status filter
  const [shiftFilter, setShiftFilter] = useState(""); // Shift filter
  const [notesFilter, setNotesFilter] = useState(""); // Notes filter
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  
  // Add dark mode state
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    
    // Apply dark mode class to document
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize dark mode on component mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attendanceRes, employeesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/attendance`),
        axios.get("http://localhost:5000/api/employees")
      ]);

      const filteredAttendance = attendanceRes.data.filter(record =>
        record.date.substring(0, 10) === selectedDate
      );

      setAttendance(filteredAttendance);
      setEmployees(employeesRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    }
    setLoading(false);
  };

  const handleSubmit = async (formData) => {
    setTempFormData(formData);

    try {
      const attendanceData = {
        employeeId: formData.employeeId,
        status: formData.status,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut || "",
        date: formData.date,
        shift: formData.shift,
        breakTime: formData.breakTime,
        overtime: formData.overtime,
        workFromHome: formData.workFromHome,
        notes: formData.notes,
        location: formData.location
      };

      let response;
      if (editRecord) {
        response = await axios.put(`http://localhost:5000/api/attendance/${editRecord._id}`, attendanceData);
        toast.success("Attendance updated successfully");
      } else {
        response = await axios.post("http://localhost:5000/api/attendance", attendanceData);
        toast.success("Attendance added successfully");
      }

      fetchData();
      setShowModal(false);
      setEditRecord(null);
      setTempFormData(null);
    } catch (error) {
      if (error.response?.status === 400) {
        const employee = employees.find(emp => emp._id === tempFormData.employeeId);
        setDuplicateEmployee(employee);
        setDuplicateDate(tempFormData.date);
        setShowDuplicateModal(true);
        setShowModal(false);
        return;
      }
      toast.error("Failed to save attendance");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await axios.delete(`http://localhost:5000/api/attendance/${id}`);
        toast.success("Record deleted successfully");
        fetchData();
      } catch (error) {
        toast.error("Delete operation failed");
      }
    }
  };

  const handleFilterChange = (filters) => {
    console.log("Filters applied:", filters);
    // Implement filter logic here
  };

  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = record.employeeId && record.employeeId.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter.length ? statusFilter.includes(record.status) : true; // Apply multi-select status filter

    const recordDate = new Date(record.date).getTime();
    const startDateTime = startDate ? new Date(startDate).getTime() : null;
    const endDateTime = endDate ? new Date(endDate).getTime() : null;

    const matchesDateRange = (!startDateTime || recordDate >= startDateTime) &&
      (!endDateTime || recordDate <= endDateTime);

    const matchesShift = shiftFilter ? record.shift === shiftFilter : true; // Apply shift filter
    const matchesNotes = notesFilter ? record.notes.toLowerCase().includes(notesFilter.toLowerCase()) : true; // Apply notes filter

    return matchesSearch && matchesStatus && matchesDateRange && matchesShift && matchesNotes; // Combine all filters
  });

  const handleBulkSubmit = async (attendanceData) => {
    try {
      // Show loading toast
      const toastId = toast.loading('Submitting attendance data...');
      
      const response = await submitBulkAttendance(attendanceData);
      
      // Update toast to success
      toast.update(toastId, { 
        render: `Successfully recorded attendance for ${attendanceData.length} employees`, 
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
      
      fetchData();
      setShowQuickAttendance(false);
    } catch (error) {
      console.error('Bulk attendance submission error:', error);
      toast.error(error.message || 'Failed to record bulk attendance');
    }
  };

  const fetchAttendanceByDate = async (date) => {
    try {
      const response = await fetch(`/api/attendance/date/${date}`);
      const data = await response.json();
      setDateViewRecords(data);
    } catch (error) {
      toast.error('Failed to fetch attendance records');
    }
  };

  // Theme-aware button classes
  const buttonClasses = {
    primary: isDarkMode 
      ? "bg-blue-600 hover:bg-blue-700 text-white" 
      : "bg-blue-600 hover:bg-blue-700 text-white",
    success: isDarkMode 
      ? "bg-green-600 hover:bg-green-700 text-white" 
      : "bg-green-500 hover:bg-green-600 text-white",
    danger: isDarkMode 
      ? "bg-red-600 hover:bg-red-700 text-white" 
      : "bg-red-500 hover:bg-red-600 text-white",
    info: isDarkMode 
      ? "bg-purple-600 hover:bg-purple-700 text-white" 
      : "bg-purple-500 hover:bg-purple-600 text-white",
  };

  return (
    <div className="container mx-auto px-4 py-8 transition-colors duration-200">
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Attendance Management</h1>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500 focus:outline-none"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <FaSun className="text-yellow-300" /> : <FaMoon className="text-gray-600" />}
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <FaChartBar /> Dashboard
            </button>
          <button
            onClick={() => setShowQuickAttendance(true)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all duration-200 hover:shadow-lg ${buttonClasses.success}`}
          >
              <FaUserCheck /> Quick Attendance
          </button>
          <button
            onClick={() => setShowDateView(true)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${buttonClasses.info}`}
            >
              <FaCalendarAlt /> View By Date
            </button>
            <button
              onClick={() => setShowModal(true)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${buttonClasses.primary}`}
            >
              <FaPlus /> Add Attendance
            </button>
          </div>
        </div>

        {/* Search and Date Selection */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full rounded-md border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Attendance Filters */}
        <div className="mb-6">
          <AttendanceFilters onFilterChange={handleFilterChange} />
        </div>

        {/* Attendance Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : filteredAttendance.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y attendance-table">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">WFH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                {filteredAttendance.map(record => {
                  // Determine status class
                  let statusClass = '';
                  switch(record.status) {
                    case 'Present':
                      statusClass = 'attendance-status-present';
                      break;
                    case 'Absent':
                      statusClass = 'attendance-status-absent';
                      break;
                    case 'Late':
                      statusClass = 'attendance-status-late';
                      break;
                    case 'On Leave':
                      statusClass = 'attendance-status-leave';
                      break;
                    case 'Half Day':
                      statusClass = 'attendance-status-half-day';
                      break;
                    default:
                      statusClass = '';
                  }
                  
                  return (
                    <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150">
                      <td className="px-6 py-4 font-medium">{record.employeeId?.name}</td>
                      <td className={`px-6 py-4 ${statusClass}`}>{record.status}</td>
                      <td className="px-6 py-4">{record.shift}</td>
                      <td className="px-6 py-4">{record.checkIn}</td>
                      <td className="px-6 py-4">{record.checkOut}</td>
                      <td className="px-6 py-4">
                        {record.workFromHome ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            WFH
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            Office
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditRecord(record);
                              setShowModal(true);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(record._id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg text-center">
            No attendance records found for the selected date.
          </div>
        )}

        {/* Export Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => exportToExcel(filteredAttendance, `attendance_${selectedDate}`)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            disabled={filteredAttendance.length === 0}
          >
            <FaFileExport /> Export Excel
          </button>
          <button
            onClick={() => exportToPDF(filteredAttendance, `attendance_${selectedDate}`)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            disabled={filteredAttendance.length === 0}
          >
            <FaFileExport /> Export PDF
          </button>
        </div>
      </div>

      {/* Modals */}
      {showQuickAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <QuickAttendanceForm
              employees={employees}
              onSubmit={handleBulkSubmit}
              onClose={() => setShowQuickAttendance(false)}
            />
          </div>
        </div>
      )}

      {showDateView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Attendance by Date</h2>
              <button
                onClick={() => setShowDateView(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
              <div className="flex gap-4 mb-6 flex-wrap">
                {/* Single Date Picker with Quick Presets */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="rounded border-gray-300 w-full"
                    />
                    <button 
                      onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                      className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Today
                    </button>
                    <button 
                      onClick={() => setSelectedDate(format(startOfWeek(new Date()), 'yyyy-MM-dd'))}
                      className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                    >
                      This Week
                    </button>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex-1 min-w-[200px]">
                  <Select
                    isMulti
                    options={[
                      { value: 'Present', label: 'Present' },
                      { value: 'Absent', label: 'Absent' },
                      { value: 'Late', label: 'Late' },
                      { value: 'On Leave', label: 'On Leave' }
                    ]}
                    placeholder="Select Status"
                    className="w-full"
                    onChange={(selected) => setStatusFilter(selected?.map(s => s.value) || [])}
                  />
                </div>

                {/* Shift Filter */}
                <div className="flex-1 min-w-[200px]">
                  <select
                    className="w-full rounded border-gray-300"
                    onChange={(e) => setShiftFilter(e.target.value)}
                    value={shiftFilter}
                  >
                    <option value="">All Shifts</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>

                

                {/* Reset & Export Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setEmployeeFilter([]);
                      setStatusFilter([]);
                      setShiftFilter("");
                      setNotesFilter("");
                      setSearch("");
                    }}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => exportToExcel(filteredAttendance)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Export
                  </button>
                </div>
              </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendance.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{record.employeeId.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${record.status === "Present" ? "bg-green-100 text-green-800" :
                            record.status === "Absent" ? "bg-red-100 text-red-800" :
                              record.status === "Late" ? "bg-yellow-100 text-yellow-800" :
                                "bg-blue-100 text-blue-800"}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{record.checkIn}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{record.checkOut || "Not checked out"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{record.shift}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditRecord(record);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <FaEdit className="inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Duplicate Entry Found</h2>
              <button onClick={() => setShowDuplicateModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            <p className="mb-6">
              {duplicateEmployee?.name} already has an attendance record for {new Date(duplicateDate).toLocaleDateString()}.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <AttendanceForm
            onSubmit={handleSubmit}
            onClose={() => {
              setShowModal(false);
              setEditRecord(null);
            }}
            editRecord={editRecord}
            employees={employees}
          />
        </div>
      )}
    </div>
  );
};

export default AttendancePage;