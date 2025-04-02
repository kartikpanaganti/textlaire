import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FaUserCog, FaBox, FaChartPie, FaSignOutAlt, 
  FaBars, FaTachometerAlt, FaIndustry, FaClipboardList, 
  FaTruck, FaCogs, FaBoxOpen, FaMoneyBillWave,
  FaShoppingCart
} from "react-icons/fa";
import { IoPersonCircleOutline } from "react-icons/io5";
import { IoImagesOutline} from "react-icons/io5";
import { ThemeContext } from "../../context/ThemeProvider";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useContext(ThemeContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (mobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Define theme-based colors
  const isDarkMode = theme === 'dark';
  
  // Theme-based colors with blue backgrounds for both modes
  const colors = {
    sidebar: isDarkMode 
      ? 'bg-blue-900 bg-opacity-95 border-blue-800' 
      : 'bg-blue-700 bg-opacity-95 border-blue-600',
    text: 'text-white',
    activeItem: isDarkMode 
      ? 'bg-blue-800 text-white' 
      : 'bg-blue-600 text-white',
    hoverItem: isDarkMode 
      ? 'hover:bg-blue-800 hover:text-white' 
      : 'hover:bg-blue-600 hover:text-white',
    icon: 'text-white',
    border: isDarkMode 
      ? 'border-blue-800' 
      : 'border-blue-600',
    logout: isDarkMode 
      ? 'bg-red-900 hover:bg-red-800 text-white' 
      : 'bg-red-600 hover:bg-red-700 text-white'
  };

  // Determine sidebar classes based on state
  const sidebarClasses = isMobileView
    ? `fixed z-40 h-screen ${colors.sidebar} backdrop-blur-lg ${colors.text} flex flex-col p-4 
       transition-all duration-300 ease-in-out shadow-xl border-r ${colors.border}
       ${isMobileMenuOpen ? 'left-0 w-72' : '-left-72 w-72'}`
    : `${isCollapsed ? "w-20" : "w-72"} h-screen ${colors.sidebar} backdrop-blur-lg ${colors.text} flex flex-col p-4 
       transition-all duration-300 ease-in-out shadow-xl relative border-r ${colors.border}`;

  return (
    <>
      {/* Mobile menu overlay */}
      {isMobileView && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Mobile menu toggle button - visible only on mobile */}
      {isMobileView && !isMobileMenuOpen && (
        <button 
          onClick={toggleMobileMenu}
          className={`fixed top-4 left-4 z-50 p-2 rounded-lg ${isDarkMode ? 'bg-blue-900' : 'bg-blue-700'} text-white shadow-lg`}
          aria-label="Open menu"
        >
          <FaBars className="text-xl" />
        </button>
      )}

      <aside className={sidebarClasses}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => isMobileView ? toggleMobileMenu() : setIsCollapsed(!isCollapsed)} 
            className={`text-2xl p-2 rounded-lg ${colors.hoverItem} transition duration-300 text-white`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FaBars className="text-white" />
          </button>
          {(!isCollapsed || (isMobileView && isMobileMenuOpen)) && (
            <h2 className="text-xl font-bold tracking-wide text-white">MENU</h2>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1">
          <ul className="space-y-2">
            <SidebarItem 
              icon={<FaTachometerAlt className={colors.icon} />} 
              label="Dashboard" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/dashboard"}
              onClick={() => {
                navigate("/dashboard");
                if (isMobileView) toggleMobileMenu();
              }}
              colors={colors}
            />
            <SidebarItem 
              icon={<FaUserCog className={colors.icon} />} 
              label="Workforce" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/employees"}
              onClick={() => {
                navigate("/employees");
                if (isMobileView) toggleMobileMenu();
              }}
              colors={colors}
            />
            <SidebarItem 
              icon={<FaBoxOpen className={colors.icon} />} 
              label="Raw Materials" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/raw-materials"}
              onClick={() => {
                navigate("/raw-materials");
                if (isMobileView) toggleMobileMenu();
              }}
              colors={colors}
            />
            <SidebarItem 
              icon={<IoPersonCircleOutline className={colors.icon} />} 
              label="Attendance" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/attendance"}
              onClick={() => {
                navigate("/attendance");
                if (isMobileView) toggleMobileMenu();
              }}
              colors={colors}
            />
            <SidebarItem 
              icon={<IoImagesOutline className={colors.icon} />} 
              label="Image Generation" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/image-generation"}
              onClick={() => {
                navigate("/image-generation");
                if (isMobileView) toggleMobileMenu();
              }}
              colors={colors}
            />
            <SidebarItem 
              icon={<FaShoppingCart className={colors.icon} />} 
              label="Products" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/products"}
              onClick={() => {
                navigate("/products");
                if (isMobileView) toggleMobileMenu();
              }}
              colors={colors}
            />
            <SidebarItem 
              icon={<FaChartPie className={colors.icon} />} 
              label="Analytics" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/analytics"}
              onClick={() => {
                navigate("/analytics");
                if (isMobileView) toggleMobileMenu();
              }}
              colors={colors}
            />
            <SidebarItem 
              icon={<FaTruck className={colors.icon} />} 
              label="Production" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/production"}
              onClick={() => {
                navigate("/production");
                if (isMobileView) toggleMobileMenu();
              }}
              colors={colors}
            />
            <SidebarItem 
              icon={<FaMoneyBillWave className={colors.icon} />} 
              label="Payroll" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/payroll"}
              onClick={() => {
                navigate("/payroll");
                if (isMobileView) toggleMobileMenu();
              }}
              colors={colors}
            />
          </ul>
        </nav>

        {/* Logout Button */}
        <button
          onClick={() => {
            localStorage.removeItem("isAuthenticated");
            navigate("/");
            if (isMobileView) toggleMobileMenu();
          }}
          className={`flex items-center justify-center p-3 ${colors.logout} font-semibold 
          rounded-lg transition-all duration-300 mt-4`}
          aria-label="Logout"
        >
          <FaSignOutAlt className="text-xl" />
          {(!isCollapsed || (isMobileView && isMobileMenuOpen)) && <span className="ml-3">Logout</span>}
        </button>
      </aside>
    </>
  );
}

// Sidebar Item Component with Active State and Animation
const SidebarItem = ({ icon, label, isCollapsed, isActive, onClick, colors }) => (
  <li>
    <button 
      className={`flex items-center w-full p-3 rounded-lg transition-all duration-300 text-lg font-medium tracking-wide text-white
        ${
          isActive 
            ? colors.activeItem + " shadow-md scale-105" 
            : colors.hoverItem
        }
      `}
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="text-2xl min-w-[40px] text-white">{icon}</span>
      {!isCollapsed && <span className="ml-3 text-white">{label}</span>}
    </button>
  </li>
);

export default Sidebar;
