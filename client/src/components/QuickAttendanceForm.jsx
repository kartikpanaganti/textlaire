import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FaSearch, FaFilter, FaCalendarAlt, FaUserCheck, FaUserTimes, FaSave, FaList, FaMoon, FaSun } from 'react-icons/fa';

const QuickAttendanceForm = ({ employees, onSubmit, onClose }) => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [presetTimes, setPresetTimes] = useState({
    checkIn: '',
    checkOut: ''
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState([]);
  const [showTemplateList, setShowTemplateList] = useState(false);

  // Add theme state
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Toggle theme manually
  const toggleTheme = () => {
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
        const initialData = employees.map(emp => ({
          employeeId: emp._id,
          employeeName: emp.name,
        department: emp.department || 'N/A',
          status: 'Present',
        date: selectedDate,
          shift: 'Day',
          checkIn: '',
          checkOut: '',
        workFromHome: false,
        notes: ''
        }));
        setAttendanceData(initialData);
      
        const initialSelected = {};
        employees.forEach(emp => {
          initialSelected[emp._id] = true;
        });
        setSelectedEmployees(initialSelected);
      }
  }, [employees, selectedDate]);

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

    const handleIndividualChange = (index, field, value) => {
      setAttendanceData(prev => {
        const newData = [...prev];
        newData[index] = {
          ...newData[index],
          [field]: value
        };
        return newData;
      });
    };

  // Apply preset times to selected employees
  const applyPresetTimes = () => {
    if (presetTimes.checkIn || presetTimes.checkOut) {
      setAttendanceData(prev => 
        prev.map(record => {
          if (selectedEmployees[record.employeeId]) {
            return {
              ...record,
              ...(presetTimes.checkIn && { checkIn: presetTimes.checkIn }),
              ...(presetTimes.checkOut && { checkOut: presetTimes.checkOut })
            };
          }
          return record;
        })
      );
    }
  };

  // Set all selected employees to present
  const markAllPresent = () => {
    handleBulkChange('status', 'Present');
  };

  // Set all selected employees to absent
  const markAllAbsent = () => {
    handleBulkChange('status', 'Absent');
  };

  // Save current configuration as a template
  const saveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    // Create template object
    const template = {
      id: Date.now(),
      name: templateName,
      date: new Date().toISOString(),
      presetTimes,
      defaultStatus: attendanceData[0]?.status || 'Present',
      defaultShift: attendanceData[0]?.shift || 'Day'
    };

    // Add to templates array
    const updatedTemplates = [...templates, template];
    setTemplates(updatedTemplates);
    
    // Save to localStorage
    localStorage.setItem('attendanceTemplates', JSON.stringify(updatedTemplates));
    
    // Reset and close modal
    setTemplateName('');
    setShowTemplateModal(false);
    
    // Show success message
    alert(`Template "${templateName}" saved successfully`);
  };

  // Load a template
  const loadTemplate = (template) => {
    // Apply template settings
    if (template.presetTimes) {
      setPresetTimes(template.presetTimes);
    }
    
    if (template.defaultStatus) {
      handleBulkChange('status', template.defaultStatus);
    }
    
    if (template.defaultShift) {
      handleBulkChange('shift', template.defaultShift);
    }
    
    // Close template list
    setShowTemplateList(false);
  };

  // Delete a template
  const deleteTemplate = (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== id);
      setTemplates(updatedTemplates);
      localStorage.setItem('attendanceTemplates', JSON.stringify(updatedTemplates));
    }
  };

  // Filter attendance data based on search and department filter
  const filteredAttendanceData = attendanceData.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || record.department === departmentFilter;
    return matchesSearch && matchesDepartment;
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

    return (
    <div className={`p-6 rounded-lg ${themeClasses.container}`}>
      <div className={`flex justify-between items-center mb-6 pb-4 border-b ${themeClasses.header}`}>
        <h2 className="text-2xl font-bold">Quick Attendance</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <FaSun className="text-yellow-300" /> : <FaMoon className="text-gray-600" />}
          </button>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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

      {/* Search and Filter */}
      <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap gap-4 items-center">
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
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-md flex items-center gap-2 shadow-sm ${themeClasses.filterButton}`}
          >
            <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-md">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
              {selectedCount} of {employees?.length || 0} employees selected
            </span>
          </div>
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
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Department</label>
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
          <table className={`min-w-full divide-y attendance-table ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead className={themeClasses.table.header}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Select</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Shift</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tooltip-container">
                  WFH
                  <span className="tooltip">Work From Home</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredAttendanceData.length > 0 ? (
                filteredAttendanceData.map((record, index) => {
                  const originalIndex = attendanceData.findIndex(r => r.employeeId === record.employeeId);
                  
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
                    <tr key={record.employeeId} 
                        className={`${!selectedEmployees[record.employeeId] ? 'opacity-50' : ''} ${themeClasses.table.row} transition-colors duration-150`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedEmployees[record.employeeId] || false}
                          onChange={(e) => handleSelectEmployee(record.employeeId, e.target.checked)}
                          className={`rounded h-5 w-5 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                        />
                      </td>
                      <td className={`px-6 py-4 font-medium ${themeClasses.table.cell}`}>{record.employeeName}</td>
                      <td className={`px-6 py-4 ${themeClasses.table.cell}`}>{record.department}</td>
                      <td className="px-6 py-4">
                        <select
                          value={record.status}
                          onChange={(e) => handleIndividualChange(originalIndex, 'status', e.target.value)}
                          className={`rounded-md ${themeClasses.input} ${statusClass} border-2 focus:border-blue-500`}
                          disabled={!selectedEmployees[record.employeeId]}
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Late">Late</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Half Day">Half Day</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={record.shift}
                          onChange={(e) => handleIndividualChange(originalIndex, 'shift', e.target.value)}
                          className={`rounded-md ${themeClasses.input} border-2 focus:border-blue-500`}
                          disabled={!selectedEmployees[record.employeeId]}
                        >
                          <option value="Day">Day</option>
                          <option value="Night">Night</option>
                          <option value="Morning">Morning</option>
                          <option value="Evening">Evening</option>
                          <option value="Flexible">Flexible</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="time"
                          value={record.checkIn}
                          onChange={(e) => handleIndividualChange(originalIndex, 'checkIn', e.target.value)}
                          className={`rounded-md ${themeClasses.input} border-2 focus:border-blue-500`}
                          disabled={!selectedEmployees[record.employeeId] || record.status === 'Absent' || record.status === 'On Leave'}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="time"
                          value={record.checkOut}
                          onChange={(e) => handleIndividualChange(originalIndex, 'checkOut', e.target.value)}
                          className={`rounded-md ${themeClasses.input} border-2 focus:border-blue-500`}
                          disabled={!selectedEmployees[record.employeeId] || record.status === 'Absent' || record.status === 'On Leave'}
                        />
                      </td>
                      <td className="px-6 py-4 relative group">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={record.workFromHome}
                            onChange={(e) => handleIndividualChange(originalIndex, 'workFromHome', e.target.checked)}
                            className={`rounded h-5 w-5 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                            disabled={!selectedEmployees[record.employeeId] || record.status === 'Absent' || record.status === 'On Leave'}
                          />
                          <div className="absolute left-full ml-2 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                            Work From Home
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={record.notes || ''}
                          onChange={(e) => handleIndividualChange(originalIndex, 'notes', e.target.value)}
                          className={`rounded-md w-full ${themeClasses.input} border-2 focus:border-blue-500`}
                          placeholder="Add notes..."
                          disabled={!selectedEmployees[record.employeeId]}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className={`px-6 py-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No employees match your search criteria
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
