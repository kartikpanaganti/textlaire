import { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/UserProvider";
import { ThemeContext } from "../context/ThemeProvider";
import { FaSun, FaMoon, FaLock, FaDesktop, FaFont, FaGlobe, FaSignOutAlt, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function SettingsPage() {
  const { user, updatePreferences, logout } = useContext(UserContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState("appearance");
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
  const changeLanguage = (lang) => {
    setLanguage(lang);
    updatePreferences({ language: lang });
  };

  const tabs = [
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
          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Appearance Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Choose between light and dark theme
                    </p>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    {theme === "dark" ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                  </button>
                </div>

                <div>
                  <p className="font-medium mb-2">Font Size</p>
                  <div className="flex gap-4">
                    {["small", "medium", "large"].map((size) => (
                      <button
                        key={size}
                        className={`px-4 py-2 rounded-md capitalize ${
                          fontSizePreference === size
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                        onClick={() => changeFontSize(size)}
                      >
                        {size}
                      </button>
                    ))}
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={user?.preferences?.twoFactorEnabled || false}
                      onChange={() => togglePreference('twoFactorEnabled')}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <button
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Change Password
                </button>

                <button
                  onClick={() => setShowSessionsModal(true)}
                  className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Manage Active Sessions
                </button>
              </div>
            </div>
          )}

          {/* Language Settings */}
          {activeTab === "language" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Language Settings</h2>
              
              <div>
                <p className="font-medium mb-2">Select Language</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { code: "en", name: "English" },
                    { code: "es", name: "Spanish" },
                    { code: "fr", name: "French" },
                    { code: "de", name: "German" }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      className={`px-4 py-2 rounded-md ${
                        language === lang.code
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                      onClick={() => changeLanguage(lang.code)}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage; 