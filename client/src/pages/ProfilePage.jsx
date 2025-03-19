import { useContext, useState, useRef } from "react";
import { UserContext } from "../context/UserProvider";
import { FaUserCircle, FaEdit, FaTimes, FaCamera } from "react-icons/fa";

function ProfilePage() {
  const { user, updateProfile, updateAvatar } = useContext(UserContext);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: ""
  });
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const fileInputRef = useRef(null);

  // Open edit modal with current user data
  const openEditModal = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || ""
    });
    setIsEditModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit profile update
  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditModalOpen(false);
  };

  // Submit password change
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    // In a real app, you would verify the current password and update the password
    alert("Password updated successfully!");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setChangePasswordModal(false);
  };

  // Handle enable 2FA
  const enableTwoFactor = () => {
    // Simulate 2FA setup
    alert("Two-factor authentication setup would be initiated here!");
  };

  // Handle avatar upload button click
  const handleAvatarButtonClick = () => {
    fileInputRef.current.click();
  };

  // Handle avatar file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPEG, PNG, and GIF files are allowed.");
      return;
    }

    // In a real app, you would upload the file to your server
    // For this demo, we'll just use a local URL
    const reader = new FileReader();
    reader.onload = (event) => {
      updateAvatar(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>
      <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
          <div className="relative">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-24 h-24 flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user?.name || "User"} 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <FaUserCircle className="text-gray-500 dark:text-gray-400 text-6xl" />
              )}
            </div>
            <button 
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
              onClick={handleAvatarButtonClick}
            >
              <FaCamera size={14} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.name || "User"}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user?.email || "user@example.com"}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {user?.role || "User"} • Member since {new Date().toLocaleDateString()}
            </p>
            <button 
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              onClick={openEditModal}
            >
              <FaEdit /> Edit Profile
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="space-y-6">
            <h3 className="text-lg font-medium border-b border-gray-200 dark:border-gray-700 pb-2">Account Information</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Full Name</p>
                <p className="font-medium">{user?.name || "User"}</p>
              </div>
              
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Email Address</p>
                <p className="font-medium">{user?.email || "user@example.com"}</p>
              </div>
              
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">User ID</p>
                <p className="font-medium">{user?.id || "N/A"}</p>
              </div>
              
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Role</p>
                <p className="font-medium">{user?.role || "User"}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-lg font-medium border-b border-gray-200 dark:border-gray-700 pb-2">Security</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Password</p>
                <div className="flex items-center justify-between">
                  <p className="font-medium">••••••••</p>
                  <button 
                    className="text-blue-500 hover:text-blue-700 text-sm"
                    onClick={() => setChangePasswordModal(true)}
                  >
                    Change
                  </button>
                </div>
              </div>
              
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Two-Factor Authentication</p>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{user?.preferences?.twoFactorEnabled ? "Enabled" : "Not Enabled"}</p>
                  <button 
                    className="text-blue-500 hover:text-blue-700 text-sm"
                    onClick={enableTwoFactor}
                  >
                    {user?.preferences?.twoFactorEnabled ? "Manage" : "Enable"}
                  </button>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-medium border-b border-gray-200 dark:border-gray-700 pb-2 mt-8">Session</h3>
            
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Last Active</p>
              <p className="font-medium">Now</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Your role (e.g., Developer, Manager)"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Change Password</h2>
              <button 
                onClick={() => setChangePasswordModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage; 