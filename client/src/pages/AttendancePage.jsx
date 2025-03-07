import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaSpinner, FaEdit, FaTrash, FaPlus, FaSearch,
  FaCheckCircle, FaTimesCircle, FaCalendarAlt,
  FaFileExport, FaMapMarkerAlt
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import AttendanceAnalytics from '../components/AttendanceAnalytics';
import AttendanceFilters from '../components/AttendanceFilters';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import AttendanceForm from '../components/AttendanceForm';


const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);


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

      // Filter attendance records for selected date
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
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateEmployee, setDuplicateEmployee] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      // Check for existing attendance on same date for same employee
      const existingAttendance = attendance.find(record =>
        record.employeeId._id === formData.employeeId &&
        record.date.substring(0, 10) === formData.date
      );

      if (existingAttendance && !editRecord) {
        const employee = employees.find(emp => emp._id === formData.employeeId);
        setDuplicateEmployee(employee);
        setShowDuplicateModal(true);
        return;
      }

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
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  {
    showDuplicateModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Duplicate Attendance</h2>
          <p className="mb-4">
            {duplicateEmployee?.name} already has an attendance record for today.
            Please edit the existing record instead.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setShowDuplicateModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Okay, Got it
            </button>
          </div>
        </div>
      </div>
    )
  }
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
    // Implement filter logic here
    console.log("Filters applied:", filters);
  };

  const filteredAttendance = attendance.filter(record =>
    record.employeeId && record.employeeId.name &&
    record.employeeId.name.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
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
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaPlus /> Add Attendance
            </button>
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

        {/* Analytics and Filters */}
        <div className="mb-6">
          <AttendanceAnalytics attendanceData={attendance} />
          <AttendanceFilters onFilterChange={handleFilterChange} />
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full">
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
                    <td className="px-6 py-4 whitespace-nowrap">{record.employeeId.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${record.status === "Present" ? "bg-green-100 text-green-800" :
                          record.status === "Absent" ? "bg-red-100 text-red-800" :
                            record.status === "Late" ? "bg-yellow-100 text-yellow-800" :
                              record.status === "Half Day" ? "bg-orange-100 text-orange-800" :
                                "bg-blue-100 text-blue-800"}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.checkIn}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.checkOut || "Not checked out"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.shift}</td>
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
        )}

        {/* Duplicate Attendance Modal */}
        {showDuplicateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"> {/* Increased z-index */}
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-red-600 mb-4">Duplicate Attendance</h2>
              <p className="mb-4">
                {duplicateEmployee?.name} already has an attendance record for {format(new Date(selectedDate), 'MMM dd, yyyy')}.
                Please edit the existing record instead.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setEditRecord(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setEditRecord(existingAttendance);
                    setShowModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Existing Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Attendance Modal */}
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
    </div>
  );
};

export default AttendancePage;
