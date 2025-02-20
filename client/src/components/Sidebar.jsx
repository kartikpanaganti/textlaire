import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaUserCog, FaBox, FaChartPie, FaSignOutAlt, 
  FaBars, FaTachometerAlt
} from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`${
        isCollapsed ? "w-20" : "w-72"
      } h-screen bg-blue-900 bg-opacity-90 backdrop-blur-lg text-white flex flex-col p-4 
      transition-all duration-300 ease-in-out shadow-xl relative border-r border-blue-700`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="text-2xl p-2 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          <FaBars />
        </button>
        {!isCollapsed && <h2 className="text-xl font-bold tracking-wide">Texlaire</h2>}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1">
        <ul className="space-y-4">
          <SidebarItem 
            icon={<FaTachometerAlt />} 
            label="Dashboard" 
            isCollapsed={isCollapsed} 
            onClick={() => navigate("/dashboard")} 
          />
          <SidebarItem 
            icon={<FaUserCog />} 
            label="Workforce" 
            isCollapsed={isCollapsed} 
            onClick={() => navigate("/employees")} 
          />
          <SidebarItem 
            icon={<FaBox />} 
            label="Inventory" 
            isCollapsed={isCollapsed} 
            onClick={() => navigate("/inventory")} 
          />
          <SidebarItem 
            icon={<FaChartPie />} 
            label="Analytics" 
            isCollapsed={isCollapsed} 
            onClick={() => navigate("/analytics")} 
          />
        </ul>
      </nav>

      {/* Logout Button */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center justify-center p-3 bg-red-500 hover:bg-red-600 text-white font-semibold 
        rounded-lg transition-all duration-300 mt-4"
      >
        <FaSignOutAlt className="text-xl" />
        {!isCollapsed && <span className="ml-3">Logout</span>}
      </button>
    </aside>
  );
}

// Sidebar Item Component for Reusability
const SidebarItem = ({ icon, label, isCollapsed, onClick }) => (
  <li>
    <button 
      className="flex items-center w-full p-3 hover:bg-blue-700 rounded-lg transition-all duration-300 
      text-lg font-medium tracking-wide"
      onClick={onClick}
    >
      <span className="text-2xl min-w-[40px]">{icon}</span>
      {!isCollapsed && <span className="ml-3">{label}</span>}
    </button>
  </li>
);

export default Sidebar;
