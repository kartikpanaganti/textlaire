import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSun, FaMoon, FaSignOutAlt, FaCog, FaUser, FaEnvelope } from "react-icons/fa";
import { ThemeContext } from "../../context/ThemeProvider";
import { UserContext } from "../../context/UserProvider";
import { SocketContext } from "../../context/SocketProvider";

function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(UserContext);
  const { socket } = useContext(SocketContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Listen for new messages to update unread count
  useEffect(() => {
    // Load initial unread count from storage
    const storedUnreadMessages = JSON.parse(localStorage.getItem('textlaire_unread_messages') || '[]');
    setUnreadCount(storedUnreadMessages.length);
    
    // Listen for new messages via custom event
    const handleNewMessage = (event) => {
      const message = event.detail;
      if (!message || !message._id) return;
      
      // Update unread count
      setUnreadCount(prev => {
        // Get current unread messages
        const unreadMessages = JSON.parse(localStorage.getItem('textlaire_unread_messages') || '[]');
        
        // Check if this message is already in the unread list
        if (!unreadMessages.some(m => m._id === message._id)) {
          // Add to unread messages
          unreadMessages.push({
            _id: message._id,
            chatId: message.chat,
            timestamp: new Date().toISOString()
          });
          
          // Store updated list
          localStorage.setItem('textlaire_unread_messages', JSON.stringify(unreadMessages));
          
          // Return new count
          return unreadMessages.length;
        }
        
        return prev;
      });
    };
    
    // Register event listener
    window.addEventListener('textlaire_new_message', handleNewMessage);
    
    // Cleanup
    return () => {
      window.removeEventListener('textlaire_new_message', handleNewMessage);
    };
  }, []);
  
  // Function to navigate to messages page and clear unread count
  const navigateToMessages = () => {
    navigate('/messages');
    // Clear unread messages when navigating to messages page
    localStorage.setItem('textlaire_unread_messages', '[]');
    setUnreadCount(0);
  };

  return (
    <nav className="bg-white dark:bg-dark-surface shadow-md p-4 flex justify-between items-center transition-all duration-300">
      {/* Logo */}
      <h2 className="text-2xl md:text-4xl font-semibold text-light-text-primary dark:text-dark-text-primary ml-12 md:ml-0" style={{fontFamily: "Style Script, serif", fontWeight: "600px" }}>Textlaire</h2>

      {/* Right Side - Icons & User */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Messages Button with Notification Badge */}
        <div className="relative">
          {/* <button 
            onClick={navigateToMessages}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            aria-label="Messages"
          >
            <FaEnvelope className="text-gray-700 dark:text-gray-300" />
          </button> */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        
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
