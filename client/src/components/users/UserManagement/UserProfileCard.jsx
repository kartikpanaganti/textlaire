import React, { useState } from 'react';
import { FaEdit, FaEye, FaEyeSlash, FaInfoCircle, FaBan, FaUnlock, FaUserCog } from 'react-icons/fa';

const UserProfileCard = ({ user, onEdit, onBanUser, onResetPassword }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  // Determine user status and style
  const getUserStatusBadge = () => {
    if (user.isBanned) {
      return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Banned</span>;
    } else if (user.isLoggedIn) {
      return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Online</span>;
    } else {
      return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Offline</span>;
    }
  };

  // Get role badge styles
  const getRoleBadge = () => {
    switch (user.role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Admin</span>;
      case 'manager':
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Manager</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Employee</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* User card header with quick actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 border-b dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {getUserStatusBadge()}
          {getRoleBadge()}
        </div>
      </div>

      {/* Expandable details section */}
      <div className="p-4">
        <div className="flex justify-between mb-3">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 dark:text-blue-400 flex items-center"
          >
            <FaInfoCircle className="mr-1" />
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <div className="space-x-2">
            <button 
              onClick={() => onEdit(user)}
              className="p-1.5 bg-blue-100 text-blue-700 rounded-md dark:bg-blue-700 dark:text-blue-100"
              title="Edit User"
            >
              <FaEdit size={14} />
            </button>
            <button 
              onClick={() => onResetPassword(user._id)}
              className="p-1.5 bg-yellow-100 text-yellow-700 rounded-md dark:bg-yellow-700 dark:text-yellow-100"
              title="Reset Password"
            >
              <FaUnlock size={14} />
            </button>
            <button 
              onClick={() => onBanUser(user._id, !user.isBanned)}
              className={`p-1.5 ${user.isBanned ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'} rounded-md`}
              title={user.isBanned ? 'Unban User' : 'Ban User'}
            >
              {user.isBanned ? <FaUnlock size={14} /> : <FaBan size={14} />}
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-3 space-y-3 text-sm border-t pt-3 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last Login</p>
                <p className="font-medium">{formatDate(user.lastLogin)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Account Created</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last Activity</p>
                <p className="font-medium">{formatDate(user.lastActivity)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Login Count</p>
                <p className="font-medium">{user.loginCount || 0}</p>
              </div>
            </div>

            {user.permissions && (
              <div className="mt-2">
                <p className="text-gray-500 dark:text-gray-400 mb-1">Permissions</p>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.map(permission => (
                    <span key={permission} className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.departments && (
              <div className="mt-2">
                <p className="text-gray-500 dark:text-gray-400 mb-1">Departments</p>
                <div className="flex flex-wrap gap-1">
                  {user.departments.map(dept => (
                    <span key={dept} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded text-xs">
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileCard;
