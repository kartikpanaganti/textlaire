import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserProvider';
import { FaEdit, FaTrash, FaUserPlus, FaSync, FaFilter, FaEye, FaKey, FaLock, FaCheckSquare } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Define available pages for permissions
const AVAILABLE_PAGES = [
  { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
  { id: 'employees', name: 'Workforce', path: '/employees' },
  { id: 'raw-materials', name: 'Raw Materials', path: '/raw-materials' },
  { id: 'attendance', name: 'Attendance', path: '/attendance' },
  { id: 'image-generation', name: 'Image Generation', path: '/image-generation' },
  { id: 'products', name: 'Products', path: '/products' },
  { id: 'payroll', name: 'Payroll', path: '/payroll' },
  { id: 'messages', name: 'Messages', path: '/messages' },
];

const UserManagementPage = () => {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    password: '',
    secretKey: '',
    pagePermissions: [] // Array of permitted page IDs
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState({ field: 'name', direction: 'asc' });
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newSecretKey, setNewSecretKey] = useState('');
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      
      // Check if response has the expected format and contains users array
      if (response.data && response.data.success && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        console.error('Unexpected API response format:', response.data);
        setUsers([]); // Set empty array if format is unexpected
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users: ' + (err.response?.data?.message || err.message));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handler for user form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handler for permissions checkbox changes
  const handlePermissionChange = (pageId) => {
    if (selectedPermissions.includes(pageId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== pageId));
    } else {
      setSelectedPermissions([...selectedPermissions, pageId]);
    }
  };

  // Open modal for adding a new user
  const handleAddUser = () => {
    setCurrentUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user',
      password: '',
      secretKey: '',
      pagePermissions: []
    });
    setModalOpen(true);
  };

  // Open modal for editing an existing user
  const handleEditUser = (user) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '', // Don't populate password for security
      secretKey: '', // Don't populate secret key for security
      pagePermissions: user.pagePermissions || []
    });
    setModalOpen(true);
  };

  // Open modal for managing user permissions
  const handleManagePermissions = (user) => {
    setPermissionsUser(user);
    setSelectedPermissions(user.pagePermissions || []);
    setPermissionsModalOpen(true);
  };

  // Save permissions for a user
  const handleSavePermissions = async () => {
    try {
      await axios.put(`/api/users/${permissionsUser._id}/permissions`, {
        pagePermissions: selectedPermissions
      });
      toast.success('User permissions updated successfully');
      setPermissionsModalOpen(false);
      fetchUsers(); // Refresh user list
    } catch (err) {
      toast.error('Error updating permissions: ' + (err.response?.data?.message || err.message));
    }
  };

  // Submit handler for create/edit user form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentUser) {
        // Update existing user
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // Don't send empty password
        
        await axios.put(`/api/users/${currentUser._id}`, updateData);
        toast.success('User updated successfully');
      } else {
        // Create new user
        await axios.post('/api/users', formData);
        toast.success('User created successfully');
      }
      setModalOpen(false);
      fetchUsers(); // Refresh user list
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete a user
  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`/api/users/${userId}`);
      setConfirmDelete(null);
      fetchUsers(); // Refresh user list
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error('Error deleting user: ' + (err.response?.data?.message || err.message));
    }
  };

  // Reset user password and/or secret key
  const handleResetPassword = async () => {
    try {
      // Prepare data to send
      const resetData = {};
      if (newPassword) resetData.newPassword = newPassword;
      if (newSecretKey && currentUser.role === 'admin') resetData.newSecretKey = newSecretKey;
      
      // Only proceed if at least one field is provided
      if (Object.keys(resetData).length === 0) {
        toast.error('Please provide a new password or secret key');
        return;
      }
      
      await axios.post(`/api/users/${currentUser._id}/reset-credentials`, resetData);
      setResetPasswordModal(false);
      setNewPassword('');
      setNewSecretKey('');
      toast.success('Credentials updated successfully');
    } catch (err) {
      toast.error('Error updating credentials: ' + (err.response?.data?.message || err.message));
    }
  };

  // Apply filtering - ensure users is an array before filtering
  const filteredUsers = Array.isArray(users) ? users.filter(user => 
    user?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    user?.email?.toLowerCase().includes(filter.toLowerCase()) ||
    user?.role?.toLowerCase().includes(filter.toLowerCase())
  ) : [];

  // Apply sorting
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const fieldA = a[sortBy.field];
    const fieldB = b[sortBy.field];
    
    if (fieldA < fieldB) return sortBy.direction === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortBy.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Toggle sort direction
  const handleSort = (field) => {
    setSortBy({
      field,
      direction: sortBy.field === field && sortBy.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Admin access required</div>;
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-4">
          <button 
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
          >
            <FaSync className="mr-2" /> Refresh
          </button>
          <button 
            onClick={handleAddUser}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
          >
            <FaUserPlus className="mr-2" /> Add User
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="flex items-center text-gray-700">
              <FaFilter className="mr-2" /> Filter Users
            </label>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by name, email or role"
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2"
            />
          </div>
          <div>
            <p className="text-gray-700">Total Users: {users.length}</p>
            <p className="text-gray-700">Filtered: {filteredUsers.length}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {sortBy.field === 'name' && (
                      <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email
                    {sortBy.field === 'email' && (
                      <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    Role
                    {sortBy.field === 'role' && (
                      <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center">
                    Permissions
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('lastLogin')}
                >
                  <div className="flex items-center">
                    Last Login
                    {sortBy.field === 'lastLogin' && (
                      <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-red-500">{error}</td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                sortedUsers.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {user.role === 'admin' ? (
                          <span className="text-purple-600">Full Access</span>
                        ) : (
                          <div className="flex items-center">
                            <span className="mr-2">
                              {user.pagePermissions && user.pagePermissions.length 
                                ? `${user.pagePermissions.length} pages` 
                                : "No access"}
                            </span>
                            <button 
                              onClick={() => handleManagePermissions(user)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Manage page permissions"
                            >
                              <FaLock size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.formattedLastLogin || 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                        <button 
                          onClick={() => {
                            setCurrentUser(user);
                            setResetPasswordModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <FaKey className="mr-1" /> Reset
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(user)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <FaTrash className="mr-1" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{currentUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  {currentUser ? 'Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required={!currentUser}
                />
              </div>
              {formData.role === 'admin' && (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="secretKey">
                    {currentUser ? 'Secret Key (leave blank to keep current)' : 'Secret Key'}
                  </label>
                  <input
                    id="secretKey"
                    type="password"
                    name="secretKey"
                    value={formData.secretKey}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required={!currentUser && formData.role === 'admin'}
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {currentUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permissionsModalOpen && permissionsUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Manage Page Access for {permissionsUser.name}</h2>
            <div className="mb-4 text-sm text-gray-600">
              Select which pages this user can access. Admins automatically have access to all pages.
            </div>
            
            <div className="space-y-3 mb-6">
              {AVAILABLE_PAGES.map(page => (
                <div key={page.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`page-${page.id}`}
                    checked={selectedPermissions.includes(page.id)}
                    onChange={() => handlePermissionChange(page.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                  />
                  <label htmlFor={`page-${page.id}`} className="text-gray-700">{page.name}</label>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setSelectedPermissions(AVAILABLE_PAGES.map(p => p.id))}
                  className="text-blue-600 hover:text-blue-800 mr-4"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPermissions([])}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPermissionsModalOpen(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                >
                  <FaCheckSquare className="mr-2" /> Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Credentials Modal */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Reset Credentials for {currentUser?.name}</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            {currentUser?.role === 'admin' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newSecretKey">
                  New Secret Key
                </label>
                <input
                  id="newSecretKey"
                  type="password"
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setResetPasswordModal(false);
                  setNewPassword('');
                  setNewSecretKey('');
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Update Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete user <span className="font-bold">{confirmDelete.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(confirmDelete._id)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
