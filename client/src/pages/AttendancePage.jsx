import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaSpinner, FaEdit, FaTrash, FaPlus, FaSearch,
  FaFileExport, FaTimes
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { format, startOfWeek } from 'date-fns';
import AttendanceAnalytics from '../components/AttendanceAnalytics';
import AttendanceFilters from '../components/AttendanceFilters';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import AttendanceForm from '../components/AttendanceForm';
import QuickAttendanceForm from '../components/QuickAttendanceForm';

import Select from 'react-select';
const AttendancePage = () => {
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
      const response = await submitBulkAttendance(attendanceData);
      toast.success('Bulk attendance recorded successfully');
      fetchData();
      setShowQuickAttendance(false);
    } catch (error) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Attendance Management</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowQuickAttendance(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Quick Attendance
          </button>
          <button
            onClick={() => setShowDateView(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View By Date
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaPlus /> Add Attendance
          </button>
        </div>
      </div>

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

      {showQuickAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <QuickAttendanceForm
              employees={employees}
              onSubmit={handleBulkSubmit}
              onClose={() => setShowQuickAttendance(false)}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Attendance Dashboard</h1>
        <div className="flex gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-lg px-4 py-2"
          />
          <div className="relative">
 <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button
            onClick={() => exportToExcel(attendance)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaFileExport /> Export Excel
          </button>
          <button
            onClick={() => exportToPDF(attendance)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaFileExport /> Export PDF
          </button>
        </div>
      </div>

      <div className="mb-6">
        <AttendanceAnalytics attendanceData={attendance} />
        <AttendanceFilters onFilterChange={handleFilterChange} />
      </div>

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