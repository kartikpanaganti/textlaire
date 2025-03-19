import { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/UserProvider";
import { ThemeContext } from "../context/ThemeProvider";
import { FaSun, FaMoon, FaBell, FaEnvelope, FaLock, FaDesktop, FaFont, FaGlobe, FaSignOutAlt, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function SettingsPage() {
  const { user, updatePreferences, logout } = useContext(UserContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState("notifications");
  const [fontSizePreference, setFontSizePreference] = useState("medium");
  const [language, setLanguage] = useState("en");
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const navigate = useNavigate();

  // Initialize preferences from user context
  useEffect(() => {
    if (user?.preferences) {
      setFontSizePreference(user.preferences.fontSize || "medium");
      setLanguage(user.preferences.language || "en");
    }
  }, [user]);

  // Toggle preferences
  const togglePreference = (key) => {
    updatePreferences({ 
      [key]: !user?.preferences?.[key] 
    });
  };

  // Handle font size change
  const changeFontSize = (size) => {
    setFontSizePreference(size);
    updatePreferences({ fontSize: size });
    
    // Apply font size to document root
    const sizes = {
      small: "14px",
      medium: "16px",
      large: "18px"
    };
    document.documentElement.style.fontSize = sizes[size];
  };

  // Handle language change
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    updatePreferences({ language: newLang });
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
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
    setIsChangePasswordModalOpen(false);
  };

  // Handle 2FA verification code
  const handleVerificationCodeChange = (e) => {
    setVerificationCode(e.target.value);
  };

  // Submit 2FA setup
  const handleTwoFactorSubmit = (e) => {
    e.preventDefault();
    // Simulate 2FA verification
    if (verificationCode === "123456") {
      alert("Two-factor authentication enabled successfully!");
      updatePreferences({ twoFactorEnabled: true });
      setIsTwoFactorModalOpen(false);
    } else {
      alert("Invalid verification code. Please try again.");
    }
  };

  // Handle sign out from all devices
  const handleSignOutAll = () => {
    // Simulate signing out from all devices
    alert("You've been signed out from all devices!");
    setShowSessionsModal(false);
    // In a real app, you would invalidate all sessions except the current one
    // For this demo, we'll just log the user out completely
    logout();
    navigate("/", { replace: true });
  };

  // Mock active sessions for display
  const activeSessions = [
    { id: 1, device: "Current Browser", location: "New York, USA", lastActive: "Now", isCurrent: true },
    { id: 2, device: "iPhone App", location: "Boston, USA", lastActive: "2 hours ago", isCurrent: false },
    { id: 3, device: "Windows Desktop", location: "Miami, USA", lastActive: "Yesterday", isCurrent: false }
  ];

  const tabs = [
    { id: "notifications", label: "Notifications", icon: <FaBell /> },
    { id: "appearance", label: "Appearance", icon: <FaDesktop /> },
    { id: "security", label: "Security", icon: <FaLock /> },
    { id: "language", label: "Language", icon: <FaGlobe /> },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {/* Settings Tabs */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Notifications Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <FaBell className="text-gray-500 dark:text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium">App Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive notifications within the application
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={user?.preferences?.notifications || false}
                      onChange={() => togglePreference('notifications')}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <FaEnvelope className="text-gray-500 dark:text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive updates and alerts via email
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={user?.preferences?.emailAlerts || false}
                      onChange={() => togglePreference('emailAlerts')}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Appearance Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    {theme === "dark" ? (
                      <FaMoon className="text-gray-500 dark:text-gray-400 mt-1" />
                    ) : (
                      <FaSun className="text-gray-500 dark:text-gray-400 mt-1" />
                    )}
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {theme === "dark" ? "Dark mode is currently active" : "Light mode is currently active"}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <FaFont className="text-gray-500 dark:text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium">Font Size</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Adjust the text size for better readability
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                        fontSizePreference === 'small' 
                          ? 'bg-blue-500 text-white' 
                          : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => changeFontSize('small')}
                    >
                      A-
                    </button>
                    <button 
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                        fontSizePreference === 'medium' 
                          ? 'bg-blue-500 text-white' 
                          : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => changeFontSize('medium')}
                    >
                      A
                    </button>
                    <button 
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                        fontSizePreference === 'large' 
                          ? 'bg-blue-500 text-white' 
                          : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => changeFontSize('large')}
                    >
                      A+
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="font-medium">Change Password</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Update your password to enhance security
                    </p>
                  </div>
                  <button 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    onClick={() => setIsChangePasswordModalOpen(true)}
                  >
                    Change Password
                  </button>
                </div>
                
                <div className="flex justify-between items-start pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button 
                    className="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    onClick={() => setIsTwoFactorModalOpen(true)}
                  >
                    {user?.preferences?.twoFactorEnabled ? "Manage" : "Enable"}
                  </button>
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Sessions</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Manage active sessions and sign out from other devices
                    </p>
                  </div>
                  <button 
                    className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={() => setShowSessionsModal(true)}
                  >
                    Manage Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Language Settings */}
          {activeTab === "language" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Language Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Language
                  </label>
                  <select 
                    id="language" 
                    value={language}
                    onChange={handleLanguageChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="en">English (US)</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese (Simplified)</option>
                  </select>
                </div>
                
                <div className="mt-6">
                  <button 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    onClick={() => alert(`Language set to ${language}!`)}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Change Password</h2>
              <button 
                onClick={() => setIsChangePasswordModalOpen(false)}
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
                  onClick={() => setIsChangePasswordModalOpen(false)}
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

      {/* Two-Factor Authentication Modal */}
      {isTwoFactorModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
              <button 
                onClick={() => setIsTwoFactorModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            </div>

            {user?.preferences?.twoFactorEnabled ? (
              <div>
                <p className="mb-4 text-green-600 dark:text-green-400 font-medium">
                  Two-factor authentication is currently enabled
                </p>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                  Your account is protected by an additional layer of security. When signing in, you'll need to provide a verification code from your authentication app.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      updatePreferences({ twoFactorEnabled: false });
                      setIsTwoFactorModalOpen(false);
                      alert("Two-factor authentication has been disabled.");
                    }}
                    className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Disable 2FA
                  </button>
                  <button
                    onClick={() => setIsTwoFactorModalOpen(false)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTwoFactorSubmit}>
                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    To enable two-factor authentication, scan this QR code with your authentication app and enter the verification code.
                  </p>
                  
                  {/* Placeholder for QR code image */}
                  <div className="mx-auto w-48 h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 border border-gray-300 dark:border-gray-600">
                    <span className="text-gray-500 dark:text-gray-400 text-sm text-center">
                      [QR Code Image]<br/>Use code: 123456
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="verificationCode"
                      value={verificationCode}
                      onChange={handleVerificationCodeChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter the 6-digit code from your authentication app
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTwoFactorModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Enable 2FA
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Active Sessions</h2>
              <button 
                onClick={() => setShowSessionsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-3 grid grid-cols-12 text-sm font-medium text-gray-600 dark:text-gray-400">
                <div className="col-span-4">Device</div>
                <div className="col-span-4">Location</div>
                <div className="col-span-3">Last Active</div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-3">
                {activeSessions.map(session => (
                  <div key={session.id} className="grid grid-cols-12 py-3 border-b border-gray-200 dark:border-gray-700 text-sm">
                    <div className="col-span-4 font-medium text-gray-800 dark:text-gray-200 flex items-center">
                      {session.device}
                      {session.isCurrent && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="col-span-4 text-gray-600 dark:text-gray-400">{session.location}</div>
                    <div className="col-span-3 text-gray-600 dark:text-gray-400">{session.lastActive}</div>
                    <div className="col-span-1 flex justify-end">
                      {!session.isCurrent && (
                        <button 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => alert(`Session from ${session.device} has been terminated.`)}
                        >
                          <FaSignOutAlt />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setShowSessionsModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Close
              </button>
              <button
                onClick={handleSignOutAll}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
              >
                <FaSignOutAlt /> Sign Out All Devices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage; 