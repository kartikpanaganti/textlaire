import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiDollarSign,
  FiCalendar,
  FiMapPin,
  FiAlertTriangle,
  FiClock,
  FiFileText,
  FiArrowLeft,
  FiEdit,
  FiTool,
  FiAward
} from 'react-icons/fi';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [id]);

  const fetchEmployeeDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/employees/${id}`);
      setEmployee(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching employee details:', err);
      setError('Failed to load employee details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Terminated':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => navigate('/employees')}
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft className="mr-2" /> Back to Employees
        </button>
      </div>
    );
  }

  if (!employee) return null;

  const sections = [
    {
      title: 'Personal Information',
      icon: <FiUser />,
      items: [
        { label: 'Full Name', value: employee.name, icon: <FiUser /> },
        { label: 'Email', value: employee.email || 'N/A', icon: <FiMail /> },
        { label: 'Phone', value: employee.phoneNumber, icon: <FiPhone /> },
        { label: 'Emergency Contact', value: employee.emergencyContact || 'N/A', icon: <FiAlertTriangle /> },
        { label: 'Address', value: employee.address || 'N/A', icon: <FiMapPin /> },
      ]
    },
    {
      title: 'Employment Information',
      icon: <FiBriefcase />,
      items: [
        { label: 'Employee ID', value: employee.employeeID, icon: <FiAward /> },
        { label: 'Department', value: employee.department, icon: <FiBriefcase /> },
        { label: 'Position', value: employee.position, icon: <FiUser /> },
        { label: 'Work Type', value: employee.workType, icon: <FiBriefcase /> },
        { label: 'Status', value: employee.status, icon: <FiUser />, isStatus: true },
        { label: 'Joining Date', value: formatDate(employee.joiningDate), icon: <FiCalendar /> },
        { label: 'Salary', value: `$${employee.salary?.toLocaleString()}`, icon: <FiDollarSign /> },
        { label: 'Working Hours', value: employee.workingHours || 'N/A', icon: <FiClock /> },
      ]
    },
    {
      title: 'Additional Information',
      icon: <FiFileText />,
      items: [
        { label: 'Experience Level', value: employee.experienceLevel || 'N/A', icon: <FiAward /> },
        { label: 'Skills', value: employee.skills || 'N/A', icon: <FiTool /> },
        { label: 'Previous Experience', value: employee.previousExperience || 'N/A', icon: <FiFileText /> },
        { label: 'Supervisor', value: employee.supervisor || 'N/A', icon: <FiUser /> },
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <button
            onClick={() => navigate('/employees')}
            className="mr-4 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Employee Details</h1>
        </div>
        <button
          onClick={() => navigate(`/employees/edit/${employee._id}`)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <FiEdit /> Edit Employee
        </button>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700">
            <img
              src={employee.image ? `http://localhost:5000${employee.image}` : "/default-profile.png"}
              alt={employee.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-profile.png";
              }}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{employee.name}</h2>
            <p className="text-gray-600 dark:text-gray-300">{employee.position}</p>
            <p className="text-gray-500 dark:text-gray-400">{employee.department}</p>
            <span className={`mt-2 px-3 py-1 inline-flex text-sm rounded-full ${getStatusColor(employee.status)}`}>
              {employee.status}
            </span>
          </div>
        </div>
      </div>

      {/* Information Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-blue-500 dark:text-blue-400">{section.icon}</span>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{section.title}</h3>
            </div>
            <div className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-start gap-3">
                  <span className="mt-1 text-gray-400 dark:text-gray-500">{item.icon}</span>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                    {item.isStatus ? (
                      <span className={`px-2 py-1 text-sm rounded-full ${getStatusColor(item.value)}`}>
                        {item.value}
                      </span>
                    ) : (
                      <p className="text-gray-800 dark:text-white">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDetails; 