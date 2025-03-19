import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaUserCircle, FaSun, FaMoon, FaSignOutAlt, FaCog, FaUser, FaEnvelope, FaCheck } from "react-icons/fa";
import { ThemeContext } from "../../context/ThemeProvider";
import { UserContext } from "../../context/UserProvider";

function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(UserContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New message received", time: "2 min ago", read: false },
    { id: 2, text: "Your document was shared", time: "1 hour ago", read: false },
    { id: 3, text: "Meeting reminder: Team standup", time: "3 hours ago", read: false }
  ]);

  // Logout Function
  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  // Navigate to profile
  const navigateToProfile = () => {
    navigate("/profile");
    setIsDropdownOpen(false);
  };

  // Navigate to settings
  const navigateToSettings = () => {
    navigate("/settings");
    setIsDropdownOpen(false);
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  // Get unread notification count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-menu")) {
        setIsDropdownOpen(false);
      }
      if (!event.target.closest(".notifications-menu")) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white dark:bg-dark-surface shadow-md p-4 flex justify-between items-center transition-all duration-300">
      {/* Logo */}
      <h2 className="text-2xl md:text-4xl font-semibold text-light-text-primary dark:text-dark-text-primary ml-12 md:ml-0" style={{fontFamily: "Style Script, serif", fontWeight: "600px" }}>Textlaire</h2>

      {/* Right Side - Icons & User */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? 
            <FaSun className="text-yellow-400" /> : 
            <FaMoon className="text-gray-700 dark:text-gray-300" />
          }
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative notifications-menu">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            aria-label="Notifications"
          >
            <FaBell className="text-gray-700 dark:text-gray-300" />
          </button>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
          
          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-surface shadow-lg rounded-md overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-light-text-primary dark:text-dark-text-primary">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-light-text-primary dark:text-dark-text-primary">
                            {notification.text}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {notification.time}
                          </span>
                        </div>
                        {!notification.read && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 p-1"
                            aria-label="Mark as read"
                          >
                            <FaCheck className="text-xs" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
                <button 
                  className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => navigate('/notifications')}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative dropdown-menu">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            aria-label="User menu"
          >
            <FaUserCircle className="text-gray-700 dark:text-gray-300 text-2xl" />
            <span className="text-light-text-primary dark:text-dark-text-primary font-medium hidden sm:block">
              {user?.name || "User"}
            </span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-surface shadow-lg rounded-md overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
              <button 
                className="flex items-center w-full px-4 py-2 text-light-text-primary dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={navigateToProfile}
              >
                <FaUser className="mr-2" /> Profile
              </button>
              <button 
                className="flex items-center w-full px-4 py-2 text-light-text-primary dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={navigateToSettings}
              >
                <FaCog className="mr-2" /> Settings
              </button>
              <hr className="border-gray-200 dark:border-gray-700" />
              <button 
                className="flex items-center w-full px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
