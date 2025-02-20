import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaUserCircle, FaSun, FaMoon, FaSignOutAlt, FaCog, FaUser } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [notifications, setNotifications] = useState(3); // Example notification count
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Toggle Theme Mode
  const toggleTheme = () => {
    const newTheme = darkMode ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

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
    <nav className="bg-white dark:bg-gray-900 shadow-md p-4 flex justify-between items-center transition-all duration-300">
      {/* Logo */}
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Texlaire</h2>

      {/* Right Side - Icons & User */}
      <div className="flex items-center gap-4">
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
        >
          {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-600" />}
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
            <FaBell className="text-gray-600 dark:text-white" />
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
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
          >
            <FaUserCircle className="text-gray-600 dark:text-white text-2xl" />
            <span className="text-gray-800 dark:text-white font-medium hidden sm:block">User</span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden z-50">
              <button className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                <FaUser className="mr-2" /> Profile
              </button>
              <button className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                <FaCog className="mr-2" /> Settings
              </button>
              <hr className="border-gray-300 dark:border-gray-700" />
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
