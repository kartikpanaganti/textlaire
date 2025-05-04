import { useState } from 'react';
import { FiEdit, FiTrash2, FiBriefcase, FiCalendar } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import EmployeeDetailsModal from './EmployeeDetailsModal';
import defaultProfileImage from '../../assets/images/default-profile.png';

const EmployeeCard = ({ employee, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getImageUrl = (url) => {
    if (!url) return defaultProfileImage;
    return url.startsWith('http') ? url : `http://${window.location.hostname}:5000${url}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleCardClick = (e) => {
    // Check if the click is on a button or its children
    if (e.target.closest('button')) {
      return;
    }
    setShowDetails(true);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(e);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(e);
  };

  return (
    <>
      <div 
        className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Card Header */}
        <div className="relative h-20 bg-gradient-to-r from-blue-500 to-purple-600">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }} />
          </div>

          {/* Profile Image */}
          <div className="absolute -bottom-8 left-4">
            <div className="w-16 h-16 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-800 shadow-md">
              <img
                src={getImageUrl(employee.image)}
                alt={`${employee.name}'s profile`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultProfileImage;
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={handleEdit}
              className="p-1 bg-white dark:bg-gray-800 rounded-full text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 hover:scale-110 z-10"
              title="Edit"
            >
              <FiEdit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 bg-white dark:bg-gray-800 rounded-full text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-all duration-300 hover:scale-110 z-10"
              title="Delete"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="pt-10 px-3 pb-3">
          <div className="space-y-2">
            {/* Name and Status */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {employee.name}
              </h3>
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                {employee.status}
              </span>
            </div>

            {/* Position and Department */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <FiBriefcase className="w-3.5 h-3.5" />
              <span className="truncate">{employee.position}</span>
            </div>

            {/* Salary */}
            <div className="flex items-center gap-1 text-sm">
              <FaRupeeSign className="text-green-500 w-3.5 h-3.5" />
              <span className="text-gray-900 dark:text-white font-medium">
                {employee.salary.toLocaleString()}
              </span>
            </div>

            {/* Joining Date */}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <FiCalendar className="w-3.5 h-3.5" />
              <span>Joined: {formatDate(employee.joiningDate)}</span>
            </div>
          </div>
        </div>

        {/* Hover Overlay Effect */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
      </div>

      {/* Employee Details Modal */}
      {showDetails && (
        <EmployeeDetailsModal
          employee={employee}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
};

export default EmployeeCard; 