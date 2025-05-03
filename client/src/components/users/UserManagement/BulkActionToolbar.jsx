import React, { useState } from 'react';
import { FaUsers, FaUserPlus, FaFileImport, FaFileExport, FaUserSlash, FaKey } from 'react-icons/fa';

const BulkActionToolbar = ({ selectedUsers, onBulkAction }) => {
  const [showActions, setShowActions] = useState(false);

  // Handle bulk action selection
  const handleBulkAction = (actionType) => {
    onBulkAction(actionType, selectedUsers);
    setShowActions(false);
  };

  return (
    <div className="relative">
      {/* Main button */}
      <button
        onClick={() => setShowActions(!showActions)}
        disabled={selectedUsers.length === 0}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${selectedUsers.length === 0
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'}`}
      >
        <FaUsers />
        <span>Bulk Actions ({selectedUsers.length})</span>
      </button>

      {/* Dropdown menu */}
      {showActions && selectedUsers.length > 0 && (
        <div className="absolute left-0 mt-2 w-60 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => handleBulkAction('activate')}
              className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              role="menuitem"
            >
              <FaUserPlus className="text-green-500" />
              <span>Activate Accounts</span>
            </button>
            
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              role="menuitem"
            >
              <FaUserSlash className="text-red-500" />
              <span>Deactivate Accounts</span>
            </button>
            
            <button
              onClick={() => handleBulkAction('resetPassword')}
              className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              role="menuitem"
            >
              <FaKey className="text-yellow-500" />
              <span>Reset Passwords</span>
            </button>
            
            <button
              onClick={() => handleBulkAction('export')}
              className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              role="menuitem"
            >
              <FaFileExport className="text-blue-500" />
              <span>Export User Data</span>
            </button>
            
            <button
              onClick={() => handleBulkAction('delete')}
              className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              role="menuitem"
            >
              <FaUserSlash className="text-red-500" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionToolbar;
