import { useState, useEffect, useContext } from 'react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { FaSearch, FaFilter, FaCalendarAlt, FaUserCheck, FaUserTimes, FaSave, FaList, FaMoon, FaSun, FaTimes } from 'react-icons/fa';
import { ThemeContext } from '../../context/ThemeProvider';
import { toast } from 'react-toastify';

const QuickAttendanceForm = ({ employees, onSubmit, onClose }) => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [shiftFilter, setShiftFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [presetTimes, setPresetTimes] = useState({
      checkIn: '',
      checkOut: ''
    });
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templates, setTemplates] = useState([]);
    const [showTemplateList, setShowTemplateList] = useState(false);
    const [applyDefaultShifts, setApplyDefaultShifts] = useState(true);
    const [overtimeSettings, setOvertimeSettings] = useState({
      standardHours: 8,
      regularRate: 1.5,
      doubleTimeRate: 2.0,
      requireApproval: false
    });
    const [overtimeHistory, setOvertimeHistory] = useState([]);
    const [showOvertimeSettings, setShowOvertimeSettings] = useState(false);
    const [showOvertimeHistory, setShowOvertimeHistory] = useState(false);

    // Use global theme context instead of local state
    const { theme } = useContext(ThemeContext);
    const isDarkMode = theme === 'dark';

    // Get unique departments from employees
    const departments = [...new Set(employees?.map(emp => emp.department).filter(Boolean))];

    // Load saved templates on component mount
    useEffect(() => {
      const savedTemplates = localStorage.getItem('attendanceTemplates');
      if (savedTemplates) {
        try {
          setTemplates(JSON.parse(savedTemplates));
        } catch (e) {
          console.error('Error loading templates:', e);
        }
      }
    }, []);

    useEffect(() => {
      if (employees?.length) {
        const initialData = employees.map(emp => {
          // Get employee's default shift if available
          const defaultShift = emp.defaultShift || 'Day';
          
          return {
            employeeId: emp._id,
            employeeName: emp.name,
            department: emp.department || 'N/A',
            status: 'Present',
            date: selectedDate,
            // Apply default shift if applyDefaultShifts is true, otherwise use 'Day'
            shift: applyDefaultShifts ? defaultShift : 'Day',
            checkIn: '',
            checkOut: '',
            workFromHome: false,
            notes: '',
            overtime: 0,
            overtimeRate: 1.5
          };
        });
        setAttendanceData(initialData);
      
        const initialSelected = {};
        employees.forEach(emp => {
          initialSelected[emp._id] = true;
        });
        setSelectedEmployees(initialSelected);
      }
    }, [employees, selectedDate, applyDefaultShifts]);

    // Add loadTemplate function
    const loadTemplate = (template) => {
      try {
        const templateData = JSON.parse(template.data);
        setAttendanceData(prev => 
          prev.map(record => {
            if (selectedEmployees[record.employeeId]) {
              return {
                ...record,
                ...templateData
              };
            }
            return record;
          })
        );
        setShowTemplateList(false);
        toast.success('Template loaded successfully');
      } catch (error) {
        console.error('Error loading template:', error);
        toast.error('Failed to load template');
      }
    };

    // Add deleteTemplate function
    const deleteTemplate = (templateId) => {
      if (window.confirm('Are you sure you want to delete this template?')) {
        try {
          const updatedTemplates = templates.filter(t => t.id !== templateId);
          setTemplates(updatedTemplates);
          localStorage.setItem('attendanceTemplates', JSON.stringify(updatedTemplates));
          toast.success('Template deleted successfully');
        } catch (error) {
          console.error('Error deleting template:', error);
          toast.error('Failed to delete template');
        }
      }
    };

    // Add saveTemplate function
    const saveTemplate = () => {
      if (!templateName.trim()) {
        toast.error('Please enter a template name');
        return;
      }

      try {
        const newTemplate = {
          id: Date.now().toString(),
          name: templateName,
          date: new Date().toISOString(),
          data: JSON.stringify({
            status: 'Present',
            shift: 'Day',
            checkIn: '09:00',
            checkOut: '17:00',
            workFromHome: false,
            notes: ''
          })
        };

        const updatedTemplates = [...templates, newTemplate];
        setTemplates(updatedTemplates);
        localStorage.setItem('attendanceTemplates', JSON.stringify(updatedTemplates));
        setTemplateName('');
        setShowTemplateModal(false);
        toast.success('Template saved successfully');
      } catch (error) {
        console.error('Error saving template:', error);
        toast.error('Failed to save template');
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      const selectedAttendance = attendanceData.filter(record => 
        selectedEmployees[record.employeeId]
      );

      try {
        await onSubmit(selectedAttendance);
        // Success is handled by the parent component
      } catch (error) {
        console.error('Submission error:', error);
        alert('Failed to submit attendance. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleSelectAll = (checked) => {
      const newSelected = {};
    
      // Only select visible employees (after filtering)
      filteredAttendanceData.forEach(record => {
        newSelected[record.employeeId] = checked;
      });
    
      setSelectedEmployees(prev => ({
        ...prev,
        ...newSelected
      }));
    };

    const handleSelectEmployee = (employeeId, checked) => {
      setSelectedEmployees(prev => ({
        ...prev,
        [employeeId]: checked
      }));
    };

    const handleBulkChange = (field, value) => {
      setAttendanceData(prev => 
        prev.map(record => {
          // Only apply to selected employees
          if (selectedEmployees[record.employeeId]) {
            return {
              ...record,
              [field]: value
            };
          }
          return record;
        })
      );
    };

    // Function to determine shift based on check-in time
    const determineShiftFromTime = (checkInTime) => {
      if (!checkInTime) return null;
      
      // Parse the hours from the check-in time
      const hours = parseInt(checkInTime.split(':')[0], 10);
      const minutes = parseInt(checkInTime.split(':')[1], 10);
      
      // Check if this is one of our predefined times
      if (checkInTime === '09:00') return 'Day';
      if (checkInTime === '21:00') return 'Night';
      if (checkInTime === '06:00') return 'Morning';
      if (checkInTime === '14:00') return 'Evening';
      
      // For standard time ranges
      if (hours >= 5 && hours < 8) return 'Morning';
      if (hours >= 8 && hours < 12) return 'Day';
      if (hours >= 12 && hours < 17) return 'Evening';
      if (hours >= 17 || hours < 5) return 'Night';
      
      // If it's a custom time that doesn't fit the patterns, mark as Flexible
      return 'Flexible';
    };

    // Enhanced overtime calculation function
    const calculateOvertime = (checkIn, checkOut, shift) => {
      if (!checkIn || !checkOut) return { hours: 0, rate: 1.5, totalHours: 0 };

      // Convert times to Date objects for the current day
      const today = new Date();
      const [startHour, startMinute] = checkIn.split(':').map(Number);
      const [endHour, endMinute] = checkOut.split(':').map(Number);
      
      const startTime = new Date(today.setHours(startHour, startMinute, 0));
      const endTime = new Date(today.setHours(endHour, endMinute, 0));

      // Handle overnight shifts
      if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      // Calculate total hours worked
      const totalMinutes = differenceInMinutes(endTime, startTime);
      const totalHours = totalMinutes / 60;

      // Calculate overtime based on shift type
      let overtime = 0;
      let rate = 1.5; // Default overtime rate

      // Standard working hours
      const standardHours = 8;

      if (shift === 'Night') {
        // Night shift overtime rules
        if (totalHours > standardHours) {
          overtime = totalHours - standardHours;
          if (totalHours > 12) {
            rate = 2.0; // Double time
          }
        }
      } else {
        // Regular shift overtime rules
        if (totalHours > standardHours) {
          overtime = totalHours - standardHours;
          if (totalHours > 12) {
            rate = 2.0; // Double time
          }
        }
      }

      return {
        hours: parseFloat(overtime.toFixed(2)),
        rate: rate,
        totalHours: parseFloat(totalHours.toFixed(2))
      };
    };

    // Modify handleIndividualChange to include overtime calculation
    const handleIndividualChange = (employeeId, field, value) => {
      setAttendanceData(prev => prev.map(record => {
        if (record.employeeId === employeeId) {
          const updatedRecord = { ...record, [field]: value };
          
          // Calculate overtime if check-in and check-out times are present
          if (field === 'checkIn' || field === 'checkOut') {
            const overtime = calculateOvertime(
              field === 'checkIn' ? value : record.checkIn,
              field === 'checkOut' ? value : record.checkOut,
              record.shift
            );
            updatedRecord.overtime = overtime;
          }
          
          return updatedRecord;
        }
        return record;
      }));
    };

    // Add new state for quick time buttons with overtime consideration
    const [quickTimes, setQuickTimes] = useState({
      morning: { in: '09:00', out: '17:00', shift: 'Day' },
      afternoon: { in: '13:00', out: '21:00', shift: 'Evening' },
      night: { in: '21:00', out: '05:00', shift: 'Night' }
    });

    // Add applyPresetTimes function
    const applyPresetTimes = () => {
      if (!presetTimes.checkIn || !presetTimes.checkOut) {
        alert('Please set both check-in and check-out times');
        return;
      }

      setAttendanceData(prev => 
        prev.map(record => {
          if (selectedEmployees[record.employeeId] && record.status !== 'Absent' && record.status !== 'On Leave') {
            return {
              ...record,
              checkIn: presetTimes.checkIn,
              checkOut: presetTimes.checkOut,
              shift: determineShiftFromTime(presetTimes.checkIn)
            };
          }
          return record;
        })
      );
    };

    // Add applyShiftPatterns function
    const applyShiftPatterns = () => {
      setAttendanceData(prev => 
        prev.map(record => {
          if (selectedEmployees[record.employeeId] && record.status !== 'Absent' && record.status !== 'On Leave') {
            // Get the appropriate shift pattern based on current shift
            const shiftPattern = quickTimes[record.shift.toLowerCase()] || quickTimes.morning;
            return {
              ...record,
              checkIn: shiftPattern.in,
              checkOut: shiftPattern.out
            };
          }
          return record;
        })
      );
    };

    // Modified handleQuickTime to include overtime calculation
    const handleQuickTime = (index, timeType) => {
      const record = attendanceData[index];
      if (record.status === 'Absent' || record.status === 'On Leave') return;

      const checkInTime = quickTimes[timeType].in;
      const checkOutTime = quickTimes[timeType].out;
      const shift = quickTimes[timeType].shift;
      
      handleIndividualChange(record.employeeId, 'checkIn', checkInTime);
      handleIndividualChange(record.employeeId, 'checkOut', checkOutTime);
      handleIndividualChange(record.employeeId, 'shift', shift);
    };

    // Filter attendance data based on search, department and shift filter
    const filteredAttendanceData = attendanceData.filter(record => {
      const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !departmentFilter || record.department === departmentFilter;
      const matchesShift = !shiftFilter || record.shift === shiftFilter;
      return matchesSearch && matchesDepartment && matchesShift;
    });

    // Count selected employees
    const selectedCount = Object.values(selectedEmployees).filter(Boolean).length;

    // Theme-aware class names
    const themeClasses = {
      container: isDarkMode 
        ? 'bg-gray-800 text-white shadow-lg' 
        : 'bg-white text-gray-800 shadow-md',
      header: isDarkMode 
        ? 'border-gray-700' 
        : 'border-gray-200',
      input: isDarkMode 
        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
        : 'bg-white border-gray-300 text-gray-700 placeholder-gray-500',
      button: {
        primary: isDarkMode 
          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
          : 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: isDarkMode 
          ? 'bg-gray-600 hover:bg-gray-700 text-white' 
          : 'bg-gray-300 hover:bg-gray-400 text-gray-800',
        danger: isDarkMode 
          ? 'bg-red-600 hover:bg-red-700 text-white' 
          : 'bg-red-500 hover:bg-red-600 text-white',
        success: isDarkMode 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-green-500 hover:bg-green-600 text-white',
      },
      table: {
        header: isDarkMode 
          ? 'bg-gray-700 text-gray-200' 
          : 'bg-gray-100 text-gray-700',
        row: isDarkMode 
          ? 'border-gray-700 hover:bg-gray-700' 
          : 'border-gray-200 hover:bg-gray-50',
        cell: isDarkMode 
          ? 'text-gray-300' 
          : 'text-gray-800',
      },
      filters: isDarkMode 
        ? 'bg-gray-700 border border-gray-600' 
        : 'bg-gray-50 border border-gray-200',
      modal: isDarkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200',
      templateButton: isDarkMode
        ? 'bg-purple-800 text-purple-200 hover:bg-purple-700'
        : 'bg-purple-500 text-white hover:bg-purple-600',
      saveButton: isDarkMode
        ? 'bg-indigo-800 text-indigo-200 hover:bg-indigo-700'
        : 'bg-indigo-500 text-white hover:bg-indigo-600',
      filterButton: isDarkMode
        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
        : 'bg-blue-500 text-white hover:bg-blue-600',
      actionButton: isDarkMode
        ? 'bg-blue-700 text-white hover:bg-blue-600'
        : 'bg-blue-500 text-white hover:bg-blue-600',
    };

    // Add a function to set shift as Flexible
    const setFlexibleShift = (index) => {
      setAttendanceData(prev => {
        const newData = [...prev];
        newData[index] = {
          ...newData[index],
          shift: 'Flexible'
        };
        return newData;
      });
    };

    // Add markAllPresent function
    const markAllPresent = () => {
      setAttendanceData(prev => 
        prev.map(record => {
          if (selectedEmployees[record.employeeId]) {
            return {
              ...record,
              status: 'Present'
            };
          }
          return record;
        })
      );
    };

    // Add markAllAbsent function
    const markAllAbsent = () => {
      setAttendanceData(prev => 
        prev.map(record => {
          if (selectedEmployees[record.employeeId]) {
            return {
              ...record,
              status: 'Absent',
              checkIn: '',
              checkOut: ''
            };
          }
          return record;
        })
      );
    };

    // Add handleQuickStatusChange function
    const handleQuickStatusChange = (index, status) => {
      setAttendanceData(prev => {
        const newData = [...prev];
        newData[index] = {
          ...newData[index],
          status,
          // Clear check-in/out times if status is Absent or On Leave
          checkIn: status === 'Absent' || status === 'On Leave' ? '' : newData[index].checkIn,
          checkOut: status === 'Absent' || status === 'On Leave' ? '' : newData[index].checkOut
        };
        return newData;
      });
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-800 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaUserCheck className="text-green-500" /> Quick Attendance
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* Date Selection and Templates */}
        <div className="mb-6 p-4 bg-opacity-50 rounded-lg border border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-gray-800">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <FaCalendarAlt className="text-blue-500 dark:text-blue-400 mr-2" />
                <span className="font-semibold">Date:</span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`rounded ${themeClasses.input} border-2 focus:border-blue-500`}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowTemplateList(!showTemplateList)}
                className={`px-3 py-2 rounded-md flex items-center gap-2 shadow-sm ${themeClasses.templateButton}`}
              >
                <FaList /> {templates.length} Templates
              </button>
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className={`px-3 py-2 rounded-md flex items-center gap-2 shadow-sm ${themeClasses.saveButton}`}
              >
                <FaSave /> Save Template
              </button>
            </div>
          </div>
        </div>

        {/* Template List Dropdown */}
        {showTemplateList && templates.length > 0 && (
          <div className={`mb-6 p-4 rounded-lg shadow-md ${themeClasses.modal} transform transition-all duration-300 scale-100`}>
            <h3 className="font-semibold mb-2 flex items-center">
              <FaList className="mr-2 text-purple-500" /> Saved Templates
            </h3>
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={themeClasses.table.header}>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase">Date Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {templates.map(template => (
                    <tr key={template.id} className={themeClasses.table.row}>
                      <td className={`px-4 py-2 ${themeClasses.table.cell}`}>{template.name}</td>
                      <td className={`px-4 py-2 ${themeClasses.table.cell}`}>{new Date(template.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          onClick={() => loadTemplate(template)}
                          className={`px-2 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600`}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className={`px-2 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 w-full rounded-md ${themeClasses.input} border-2 focus:border-blue-500`}
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className={`w-full rounded-md ${themeClasses.input} border-2 focus:border-blue-500`}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className={`w-full rounded-md ${themeClasses.input} border-2 focus:border-blue-500`}
            >
              <option value="">All Shifts</option>
              <option value="Day">Day</option>
              <option value="Night">Night</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('');
                setShiftFilter('');
              }}
              className={`px-3 py-2 rounded-md text-sm ${themeClasses.button.secondary}`}
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${themeClasses.button.primary}`}
            >
              <FaFilter /> {showFilters ? 'Hide Filters' : 'More Filters'}
            </button>
          </div>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <div className={`mb-6 p-4 rounded-lg ${themeClasses.filters} transform transition-all duration-300`}>
            <h3 className="font-semibold mb-3 flex items-center">
              <FaFilter className="mr-2 text-blue-500" /> Advanced Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Preset Check-In</label>
                <input
                  type="time"
                  value={presetTimes.checkIn}
                  onChange={(e) => setPresetTimes(prev => ({ ...prev, checkIn: e.target.value }))}
                  className={`w-full rounded-md ${themeClasses.input} border-2 focus:border-blue-500`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Preset Check-Out</label>
                <input
                  type="time"
                  value={presetTimes.checkOut}
                  onChange={(e) => setPresetTimes(prev => ({ ...prev, checkOut: e.target.value }))}
                  className={`w-full rounded-md ${themeClasses.input} border-2 focus:border-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Default Shifts</label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="applyDefaultShifts"
                    checked={applyDefaultShifts}
                    onChange={(e) => setApplyDefaultShifts(e.target.checked)}
                    className={`rounded mr-2 h-5 w-5 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                  />
                  <label htmlFor="applyDefaultShifts" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Apply employee default shifts
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyPresetTimes}
                className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${themeClasses.actionButton}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Apply Preset Times
              </button>
              <button
                type="button"
                onClick={applyShiftPatterns}
                className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${themeClasses.actionButton}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Apply Shift Times
              </button>
              <button
                type="button"
                onClick={updateShiftsFromTimes}
                className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${themeClasses.actionButton}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Update Shifts From Times
              </button>
              <button
                type="button"
                onClick={markAllPresent}
                className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${themeClasses.button.success}`}
              >
                <FaUserCheck size={14} /> Mark Selected Present
              </button>
              <button
                type="button"
                onClick={markAllAbsent}
                className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${themeClasses.button.danger}`}
              >
                <FaUserTimes size={14} /> Mark Selected Absent
              </button>
            </div>
          </div>
        )}
        
        {/* Select All */}
        <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded-md flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filteredAttendanceData.length > 0 && filteredAttendanceData.every(record => selectedEmployees[record.employeeId])}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className={`rounded mr-2 h-5 w-5 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
            />
            <span className="font-semibold">Select All Filtered Employees</span>
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className={`w-full divide-y attendance-table ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'} table-fixed`}>
              <thead className={themeClasses.table.header}>
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase w-[60px]">Select</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase">Employee</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase">Dept</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase">Status</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase">Shift</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase">Check In</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase">Check Out</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tooltip-container w-[60px]">
                    WFH
                    <span className="tooltip">Work From Home</span>
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase">Notes</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase">Overtime</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredAttendanceData.length > 0 ? (
                  filteredAttendanceData.map((record, index) => {
                    const originalIndex = attendanceData.findIndex(r => r.employeeId === record.employeeId);
                    
                    return (
                      <tr key={record.employeeId} 
                          className={`${!selectedEmployees[record.employeeId] ? 'opacity-50' : ''} ${themeClasses.table.row} transition-colors duration-150`}>
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={selectedEmployees[record.employeeId] || false}
                            onChange={(e) => handleSelectEmployee(record.employeeId, e.target.checked)}
                            className={`rounded h-5 w-5 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                          />
                        </td>
                        <td className={`px-2 py-2 font-medium ${themeClasses.table.cell}`}>{record.employeeName}</td>
                        <td className={`px-2 py-2 ${themeClasses.table.cell}`}>{record.department}</td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(originalIndex, 'Present')}
                              className={`px-1 py-1 rounded text-xs ${
                                record.status === 'Present' 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              } hover:opacity-80`}
                              disabled={!selectedEmployees[record.employeeId]}
                              title="Present"
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(originalIndex, 'Absent')}
                              className={`px-1 py-1 rounded text-xs ${
                                record.status === 'Absent' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              } hover:opacity-80`}
                              disabled={!selectedEmployees[record.employeeId]}
                              title="Absent"
                            >
                              A
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(originalIndex, 'Late')}
                              className={`px-1 py-1 rounded text-xs ${
                                record.status === 'Late' 
                                  ? 'bg-yellow-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              } hover:opacity-80`}
                              disabled={!selectedEmployees[record.employeeId]}
                              title="Late"
                            >
                              L
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(originalIndex, 'On Leave')}
                              className={`px-1 py-1 rounded text-xs ${
                                record.status === 'On Leave' 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              } hover:opacity-80`}
                              disabled={!selectedEmployees[record.employeeId]}
                              title="On Leave"
                            >
                              O
                            </button>
                          </div>
                          <div className="text-xs mt-1 font-medium">
                            {record.status}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={record.shift}
                            onChange={(e) => handleIndividualChange(record.employeeId, 'shift', e.target.value)}
                            className={`rounded-md text-sm ${themeClasses.input} border focus:border-blue-500 w-full ${
                              record.shift === 'Flexible' ? 'bg-purple-100 dark:bg-purple-900' : ''
                            }`}
                            disabled={!selectedEmployees[record.employeeId]}
                          >
                            <option value="Day">Day</option>
                            <option value="Night">Night</option>
                            <option value="Morning">Morning</option>
                            <option value="Evening">Evening</option>
                            <option value="Flexible">Flexible</option>
                          </select>
                          {selectedEmployees[record.employeeId] && (
                            <button
                              type="button"
                              onClick={() => setFlexibleShift(originalIndex)}
                              className="mt-1 px-1 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800 w-full"
                              title="Set as Flexible Shift"
                            >
                              Flexible
                            </button>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1">
                            <input
                              type="time"
                              value={record.checkIn}
                              onChange={(e) => handleIndividualChange(record.employeeId, 'checkIn', e.target.value)}
                              className={`rounded-md w-full text-sm ${themeClasses.input} border focus:border-blue-500 ${
                                !Object.values(quickTimes).some(times => times.in === record.checkIn) && record.checkIn 
                                  ? 'bg-purple-100 dark:bg-purple-900' : ''
                              }`}
                              disabled={!selectedEmployees[record.employeeId] || record.status === 'Absent' || record.status === 'On Leave'}
                            />
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuickTime(originalIndex, 'morning')}
                                className={`px-1 py-1 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:opacity-80 flex-1`}
                                disabled={!selectedEmployees[record.employeeId] || record.status === 'Absent' || record.status === 'On Leave'}
                                title="Morning (9:00)"
                              >
                                M
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickTime(originalIndex, 'afternoon')}
                                className={`px-1 py-1 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:opacity-80 flex-1`}
                                disabled={!selectedEmployees[record.employeeId] || record.status === 'Absent' || record.status === 'On Leave'}
                                title="Afternoon (13:00)"
                              >
                                A
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickTime(originalIndex, 'night')}
                                className={`px-1 py-1 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:opacity-80 flex-1`}
                                disabled={!selectedEmployees[record.employeeId] || record.status === 'Absent' || record.status === 'On Leave'}
                                title="Night (21:00)"
                              >
                                N
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1">
                            <input
                              type="time"
                              value={record.checkOut}
                              onChange={(e) => handleIndividualChange(record.employeeId, 'checkOut', e.target.value)}
                              className={`rounded-md w-full text-sm ${themeClasses.input} border focus:border-blue-500 ${
                                !Object.values(quickTimes).some(times => times.out === record.checkOut) && record.checkOut 
                                  ? 'bg-purple-100 dark:bg-purple-900' : ''
                              }`}
                              disabled={!selectedEmployees[record.employeeId] || record.status === 'Absent' || record.status === 'On Leave'}
                            />
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuickTime(originalIndex, 'morning')}
                                className={`px-1 py-1 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:opacity-80 flex-1`}
                                disabled={!selectedEmployees[record.employeeId] || record.status === 'Absent' || record.status === 'On Leave'}
                                title="Morning (17:00)"
                              >
                                M
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickTime(originalIndex, 'afternoon')}
                                className={`px-1 py-1 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:opacity-80 flex-1`}
                                disabled={!selectedEmployees[record.employeeId] || record.status === 'Absent' || record.status === 'On Leave'}
                                title="Afternoon (21:00)"
                              >
                                A
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickTime(originalIndex, 'night')}
                                className={`px-1 py-1 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:opacity-80 flex-1`}
                                disabled={!selectedEmployees[record.employeeId] || record.status === 'Absent' || record.status === 'On Leave'}
                                title="Night (5:00)"
                              >
                                N
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 relative group">
                          <input
                            type="checkbox"
                            checked={record.workFromHome}
                            onChange={(e) => handleIndividualChange(record.employeeId, 'workFromHome', e.target.checked)}
                            className={`rounded h-5 w-5 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                            disabled={!selectedEmployees[record.employeeId]}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={record.notes}
                            onChange={(e) => handleIndividualChange(record.employeeId, 'notes', e.target.value)}
                            className={`rounded-md w-full text-sm ${themeClasses.input} border focus:border-blue-500`}
                            disabled={!selectedEmployees[record.employeeId]}
                            placeholder="Notes"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1">
                            <div className={`text-sm ${themeClasses.table.cell}`}>
                              {record.overtime?.hours > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span>{record.overtime.hours} hours</span>
                                  <span className="text-xs">({record.overtime.rate}x)</span>
                                </div>
                              ) : (
                                <span className="text-gray-500">No overtime</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="11" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No employees found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center">
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedCount > 0 ? (
                <div className="flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full font-medium mr-2">
                    {selectedCount}
                  </span>
                  <span>employees selected for attendance</span>
                </div>
              ) : (
                <span className={`px-3 py-1 rounded-full font-medium ${isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                  No employees selected
                </span>
              )}
            </div>
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-md ${themeClasses.button.secondary}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedCount === 0}
                className={`px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${themeClasses.button.primary}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaUserCheck className="mr-1" /> Submit Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Template Save Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg shadow-xl p-6 w-full max-w-md ${themeClasses.container} transform transition-all duration-300 scale-100`}>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <FaSave className="mr-2 text-indigo-500" /> Save Template
              </h3>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className={`w-full rounded-md ${themeClasses.input} border-2 focus:border-blue-500`}
                  placeholder="e.g., Regular Shift Template"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className={`px-4 py-2 rounded-md ${themeClasses.button.secondary}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveTemplate}
                  className={`px-4 py-2 rounded-md ${themeClasses.button.primary}`}
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
};

export default QuickAttendanceForm;
