import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaUserCircle, FaSun, FaMoon, FaSignOutAlt, FaCog, FaUser } from "react-icons/fa";
import { ThemeContext } from "../../context/ThemeProvider"; // Import Theme Context

function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext); // Get theme from context
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState(3); // Example notification count

  // Logout Function
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated"); // Remove auth token
    navigate("/", { replace: true }); // Redirect to login page
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-menu")) {
        setIsDropdownOpen(false);
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
          onClick={toggleTheme} // Use ThemeContext's function
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? 
            <FaSun className="text-yellow-400" /> : 
            <FaMoon className="text-gray-700 dark:text-gray-300" />
          }
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            aria-label="Notifications"
          >
            <FaBell className="text-gray-700 dark:text-gray-300" />
          </button>
          {notifications > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {notifications}
            </span>
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
            <span className="text-light-text-primary dark:text-dark-text-primary font-medium hidden sm:block">User</span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-surface shadow-lg rounded-md overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
              <button className="flex items-center w-full px-4 py-2 text-light-text-primary dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-gray-700">
                <FaUser className="mr-2" /> Profile
              </button>
              <button className="flex items-center w-full px-4 py-2 text-light-text-primary dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-gray-700">
                <FaCog className="mr-2" /> Settings
              </button>
              <hr className="border-gray-200 dark:border-gray-700" />
              <button 
                className="flex items-center w-full px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handleLogout} // Logout action
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
