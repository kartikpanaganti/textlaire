import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSun, FaMoon, FaSignOutAlt, FaCog, FaUser } from "react-icons/fa";
import { ThemeContext } from "../../context/ThemeProvider";
import { UserContext } from "../../context/UserProvider";

function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(UserContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  // Close dropdowns when clicking outside
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
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? 
            <FaSun className="text-yellow-400" /> : 
            <FaMoon className="text-gray-700 dark:text-gray-300" />
          }
        </button>

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
