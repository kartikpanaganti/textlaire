import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FaUserCog, FaBox, FaChartPie, FaSignOutAlt, 
  FaBars, FaTachometerAlt, FaIndustry, FaClipboardList, 
  FaTruck, FaCogs 
} from "react-icons/fa";
import { IoPersonCircleOutline } from "react-icons/io5";
import { IoImagesOutline} from "react-icons/io5";


function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Determine sidebar classes based on state
  const sidebarClasses = isMobileView
    ? `fixed z-40 h-screen bg-blue-900 bg-opacity-90 backdrop-blur-lg text-white flex flex-col p-4 
       transition-all duration-300 ease-in-out shadow-xl border-r border-blue-700
       ${isMobileMenuOpen ? 'left-0 w-72' : '-left-72 w-72'}`
    : `${isCollapsed ? "w-20" : "w-72"} h-screen bg-blue-900 bg-opacity-90 backdrop-blur-lg text-white flex flex-col p-4 
       transition-all duration-300 ease-in-out shadow-xl relative border-r border-blue-700`;

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
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-900 text-white shadow-lg"
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
            className="text-2xl p-2 rounded-lg hover:bg-blue-700 transition duration-300"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FaBars />
          </button>
          {(!isCollapsed || (isMobileView && isMobileMenuOpen)) && (
            <h2 className="text-xl font-bold tracking-wide">MENU</h2>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1">
          <ul className="space-y-2">
            <SidebarItem 
              icon={<FaTachometerAlt />} 
              label="Dashboard" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/dashboard"}
              onClick={() => {
                navigate("/dashboard");
                if (isMobileView) toggleMobileMenu();
              }} 
            />
            <SidebarItem 
              icon={<FaUserCog />} 
              label="Workforce" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/employees"}
              onClick={() => {
                navigate("/employees");
                if (isMobileView) toggleMobileMenu();
              }} 
            />
            <SidebarItem 
              icon={<FaBox />} 
              label="Inventory" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/inventory"}
              onClick={() => {
                navigate("/inventory");
                if (isMobileView) toggleMobileMenu();
              }} 
            />
            <SidebarItem 
              icon={<IoPersonCircleOutline />} 
              label="Attendance" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/attendance"}
              onClick={() => {
                navigate("/attendance");
                if (isMobileView) toggleMobileMenu();
              }} 
            />
            <SidebarItem 
              icon={<IoImagesOutline />} 
              label="Image Generation" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/image-generation"}
              onClick={() => {
                navigate("/image-generation");
                if (isMobileView) toggleMobileMenu();
              }} 
            />
            <SidebarItem 
              icon={<FaChartPie />} 
              label="Analytics" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/analytics"}
              onClick={() => {
                navigate("/analytics");
                if (isMobileView) toggleMobileMenu();
              }} 
            />
            <SidebarItem 
              icon={<FaTruck />} 
              label="Suppliers" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/suppliers"}
              onClick={() => {
                navigate("/suppliers");
                if (isMobileView) toggleMobileMenu();
              }} 
            />
            <SidebarItem 
              icon={<FaCogs />} 
              label="Settings" 
              isCollapsed={isCollapsed && !isMobileMenuOpen} 
              isActive={location.pathname === "/settings"}
              onClick={() => {
                navigate("/settings");
                if (isMobileView) toggleMobileMenu();
              }} 
            />
          </ul>
        </nav>

        {/* Logout Button */}
        <button
          onClick={() => {
            navigate("/");
            if (isMobileView) toggleMobileMenu();
          }}
          className="flex items-center justify-center p-3 bg-red-500 hover:bg-red-600 text-white font-semibold 
          rounded-lg transition-all duration-300 mt-4"
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
const SidebarItem = ({ icon, label, isCollapsed, isActive, onClick }) => (
  <li>
    <button 
      className={`flex items-center w-full p-3 rounded-lg transition-all duration-300 text-lg font-medium tracking-wide
        ${
          isActive 
            ? "bg-blue-700 shadow-md scale-105 text-cyan-300" 
            : "hover:bg-blue-700 hover:text-cyan-200"
        }
      `}
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="text-2xl min-w-[40px]">{icon}</span>
      {!isCollapsed && <span className="ml-3">{label}</span>}
    </button>
  </li>
);

export default Sidebar;
