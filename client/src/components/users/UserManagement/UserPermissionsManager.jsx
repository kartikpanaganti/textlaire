import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaShieldAlt, FaCheck } from 'react-icons/fa';

const PERMISSION_GROUPS = [
  {
    name: 'Admin',
    description: 'Full access to all system functions',
    permissions: ['admin.access', 'admin.manage', 'admin.settings']
  },
  {
    name: 'User Management',
    description: 'Control user accounts and access',
    permissions: ['users.view', 'users.create', 'users.edit', 'users.delete']
  },
  {
    name: 'Products',
    description: 'Product catalog management',
    permissions: ['products.view', 'products.create', 'products.edit', 'products.delete']
  },
  {
    name: 'Inventory',
    description: 'Stock and inventory tracking',
    permissions: ['inventory.view', 'inventory.manage', 'inventory.reports']
  },
  {
    name: 'Payroll',
    description: 'Payroll management and processing',
    permissions: ['payroll.view', 'payroll.process', 'payroll.reports']
  },
  {
    name: 'Reports',
    description: 'Access to system reports',
    permissions: ['reports.view', 'reports.export', 'reports.scheduled']
  },
];

const UserPermissionsManager = ({ userId, currentPermissions = [], onSave, onCancel }) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    // Initialize with current permissions
    setSelectedPermissions(currentPermissions);
  }, [currentPermissions]);

  const togglePermission = (permission) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const selectAllInGroup = (permissions) => {
    setSelectedPermissions(prev => {
      const newPermissions = [...prev];
      permissions.forEach(permission => {
        if (!newPermissions.includes(permission)) {
          newPermissions.push(permission);
        }
      });
      return newPermissions;
    });
  };

  const deselectAllInGroup = (permissions) => {
    setSelectedPermissions(prev => {
      return prev.filter(p => !permissions.includes(p));
    });
  };

  const handleSave = () => {
    onSave(userId, selectedPermissions);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <FaShieldAlt className="mr-2 text-blue-500" /> 
          User Permissions
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
          >
            <FaSave className="mr-2" /> Save Changes
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center"
          >
            <FaTimes className="mr-2" /> Cancel
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {PERMISSION_GROUPS.map((group) => {
          const groupPermissions = group.permissions;
          const allSelected = groupPermissions.every(p => selectedPermissions.includes(p));
          const someSelected = groupPermissions.some(p => selectedPermissions.includes(p));
          const isExpanded = expandedGroups[group.name] === true;

          return (
            <div key={group.name} className="border dark:border-gray-700 rounded-lg overflow-hidden">
              <div 
                className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-750 cursor-pointer"
                onClick={() => toggleGroup(group.name)}
              >
                <div className="flex items-center">
                  <div 
                    className={`w-5 h-5 mr-3 rounded flex items-center justify-center border ${allSelected 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : someSelected 
                        ? 'bg-blue-100 border-blue-500' 
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      allSelected 
                        ? deselectAllInGroup(groupPermissions)
                        : selectAllInGroup(groupPermissions);
                    }}
                  >
                    {allSelected && <FaCheck size={12} />}
                    {someSelected && !allSelected && <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>}
                  </div>
                  <div>
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{group.description}</p>
                  </div>
                </div>
                <div className="text-gray-400">
                  {isExpanded ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 border-t dark:border-gray-700 space-y-2">
                  {groupPermissions.map(permission => (
                    <div key={permission} className="flex items-center">
                      <div 
                        className={`w-5 h-5 mr-3 rounded flex items-center justify-center border ${
                          selectedPermissions.includes(permission)
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500'
                        } cursor-pointer`}
                        onClick={() => togglePermission(permission)}
                      >
                        {selectedPermissions.includes(permission) && <FaCheck size={12} />}
                      </div>
                      <span className="text-sm">
                        {permission.split('.').map(part => 
                          part.charAt(0).toUpperCase() + part.slice(1)
                        ).join(' › ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserPermissionsManager;
