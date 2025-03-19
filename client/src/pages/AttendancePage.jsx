import { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  FaSpinner, FaEdit, FaTrash, FaPlus, FaSearch,
  FaFileExport, FaTimes, FaUserCheck, FaMoon, FaSun, FaCalendarAlt, FaChartBar
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeContext } from '../context/ThemeProvider';

import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import AttendanceFilters from '../components/attendance/AttendanceFilters';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import AttendanceForm from '../components/attendance/AttendanceForm';
import QuickAttendanceForm from '../components/attendance/QuickAttendanceForm';
import { submitBulkAttendance } from '../lib/api';
import { useNavigate } from "react-router-dom";

import Select from 'react-select';
import apiClient from '../lib/api';

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
  
  // Use global theme context instead of local state
  const { theme } = useContext(ThemeContext);
  const isDarkMode = theme === 'dark';

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
        apiClient.get('/attendance'),
        apiClient.get('/employees')
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
        response = await apiClient.put(`/attendance/${editRecord._id}`, attendanceData);
        toast.success("Attendance updated successfully");
      } else {
        response = await apiClient.post("/attendance", attendanceData);
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
        await apiClient.delete(`/attendance/${id}`);
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

  // Function to get the date range for the current week
  const getCurrentWeekDates = () => {
    const now = new Date();
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 }); // Start on Monday
    const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 }); // End on Sunday
    
    return {
      start: format(startOfCurrentWeek, 'yyyy-MM-dd'),
      end: format(endOfCurrentWeek, 'yyyy-MM-dd')
    };
  };

  // Function to fetch attendance for a date range
  const fetchAttendanceByDateRange = async (startDate, endDate) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/attendance');
      const filteredData = response.data.filter(record => {
        const recordDate = record.date.substring(0, 10);
        return recordDate >= startDate && recordDate <= endDate;
      });
      setDateViewRecords(filteredData);
    } catch (error) {
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceByDate = async (date) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/attendance');
      const filteredData = response.data.filter(record => 
        record.date.substring(0, 10) === date
      );
      setDateViewRecords(filteredData);
    } catch (error) {
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  // Function to determine shift based on check-in time
  const determineShiftFromTime = (checkInTime) => {
    if (!checkInTime) return null;
    
    // Parse the hours from the check-in time
    const hours = parseInt(checkInTime.split(':')[0], 10);
    
    // Determine shift based on hours
    if (hours >= 5 && hours < 10) return 'Morning';
    if (hours >= 10 && hours < 14) return 'Day';
    if (hours >= 14 && hours < 18) return 'Evening';
    if (hours >= 18 || hours < 5) return 'Night';
    
    return 'Day'; // Default
  };

  // Function to apply quick time
  const handleQuickTime = (index, timeType) => {
    const record = attendanceData[index];
    if (record.status === 'Absent' || record.status === 'On Leave') return;

    // Get the check-in time for this time type
    const checkInTime = quickTimes[timeType].in;
    const checkOutTime = quickTimes[timeType].out;
    
    // Determine shift based on check-in time
    let shift = determineShiftFromTime(checkInTime) || record.shift;
    
    // Update the record with new times and shift
    setAttendanceData(prev => {
      const newData = [...prev];
      newData[index] = {
        ...newData[index],
        checkIn: checkInTime,
        checkOut: checkOutTime,
        shift: shift
      };
      return newData;
    });
  };

  // Function to update shifts based on current check-in times
  const updateShiftsFromTimes = () => {
    setAttendanceData(prev => 
      prev.map(record => {
        if (selectedEmployees[record.employeeId] && record.checkIn) {
          const detectedShift = determineShiftFromTime(record.checkIn);
          if (detectedShift) {
            return {
              ...record,
              shift: detectedShift
            };
          }
        }
        return record;
      })
    );
    
    // Show success message
    alert('Shifts updated based on check-in times!');
  };

  const handleIndividualChange = (index, field, value) => {
    setAttendanceData(prev => {
      const newData = [...prev];
      newData[index] = {
        ...newData[index],
        [field]: value
      };
      
      // If check-in time is changed, update the shift accordingly
      if (field === 'checkIn' && value) {
        const detectedShift = determineShiftFromTime(value);
        if (detectedShift) {
          newData[index].shift = detectedShift;
        }
      }
      
      return newData;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 transition-colors duration-200">
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Attendance Management</h1>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 p-4 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Attendance by Date</h2>
              <button
                onClick={() => setShowDateView(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Date Range Picker */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Date Selection</h3>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Single Date</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            fetchAttendanceByDate(e.target.value);
                          }}
                          className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date Range</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white w-full"
                          placeholder="Start Date"
                        />
                        <span className="text-gray-500 dark:text-gray-400">to</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white w-full"
                          placeholder="End Date"
                        />
                        <button
                          onClick={() => {
                            if (startDate && endDate) {
                              fetchAttendanceByDateRange(startDate, endDate);
                            } else {
                              toast.warning('Please select both start and end dates');
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button 
                      onClick={() => {
                        const today = format(new Date(), 'yyyy-MM-dd');
                        setSelectedDate(today);
                        setStartDate('');
                        setEndDate('');
                        fetchAttendanceByDate(today);
                      }}
                      className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Today
                    </button>
                    <button 
                      onClick={() => {
                        const weekDates = getCurrentWeekDates();
                        setStartDate(weekDates.start);
                        setEndDate(weekDates.end);
                        setSelectedDate('');
                        fetchAttendanceByDateRange(weekDates.start, weekDates.end);
                      }}
                      className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      This Week
                    </button>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        const firstDayFormatted = format(firstDay, 'yyyy-MM-dd');
                        const lastDayFormatted = format(lastDay, 'yyyy-MM-dd');
                        
                        setStartDate(firstDayFormatted);
                        setEndDate(lastDayFormatted);
                        setSelectedDate('');
                        fetchAttendanceByDateRange(firstDayFormatted, lastDayFormatted);
                      }}
                      className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      This Month
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="col-span-1 space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Filter</h3>
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
                    classNamePrefix="react-select"
                    theme={(theme) => ({
                      ...theme,
                      colors: {
                        ...theme.colors,
                        neutral0: isDarkMode ? '#374151' : '#ffffff',
                        neutral80: isDarkMode ? '#ffffff' : '#000000',
                        primary25: isDarkMode ? '#4B5563' : '#E5E7EB',
                        primary: '#3B82F6',
                      },
                    })}
                    onChange={(selected) => setStatusFilter(selected?.map(s => s.value) || [])}
                  />
                </div>

                <div className="col-span-1 space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Shift Filter</h3>
                  <select
                    className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    onChange={(e) => setShiftFilter(e.target.value)}
                    value={shiftFilter}
                  >
                    <option value="">All Shifts</option>
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>

                <div className="col-span-1 space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</h3>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="col-span-1 space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Update Shifts From Times</h3>
                  <button
                    type="button"
                    onClick={updateShiftsFromTimes}
                    className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${buttonClasses.primary}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Update Shifts From Times
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {dateViewRecords.length} records found
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setStatusFilter([]);
                      setShiftFilter("");
                      setNotesFilter("");
                      setSearch("");
                    }}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => exportToExcel(dateViewRecords, `attendance_${selectedDate || `${startDate}_to_${endDate}`}`)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                    disabled={dateViewRecords.length === 0}
                  >
                    <FaFileExport size={14} /> Export
                  </button>
                </div>
              </div>
            
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <FaSpinner className="animate-spin text-4xl text-blue-500" />
                </div>
              ) : dateViewRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Shift</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {dateViewRecords
                        .filter(record => {
                          const matchesSearch = record.employeeId && record.employeeId.name.toLowerCase().includes(search.toLowerCase());
                          const matchesStatus = statusFilter.length ? statusFilter.includes(record.status) : true;
                          const matchesShift = shiftFilter ? record.shift === shiftFilter : true;
                          return matchesSearch && matchesStatus && matchesShift;
                        })
                        .map((record) => (
                          <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.employeeId?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${record.status === "Present" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                  record.status === "Absent" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                                    record.status === "Late" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.checkIn}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.checkOut || "Not checked out"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.shift}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  setEditRecord(record);
                                  setShowModal(true);
                                  setShowDateView(false);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                              >
                                <FaEdit className="inline" />
                              </button>
                              <button
                                onClick={() => {
                                  handleDelete(record._id);
                                  if (selectedDate) {
                                    fetchAttendanceByDate(selectedDate);
                                  } else if (startDate && endDate) {
                                    fetchAttendanceByDateRange(startDate, endDate);
                                  }
                                }}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              >
                                <FaTrash className="inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg text-center">
                  No attendance records found for the selected date range.
                </div>
              )}
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