import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCog, FaBox, FaChartPie, FaSignOutAlt, FaBars, FaTachometerAlt } from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/", { replace: true });
  };

  return (
    <aside
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-blue-900 text-white flex flex-col p-4 transition-all duration-300 ease-in-out shadow-lg relative`}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {/* Sidebar Header */}
      <div className="flex items-center mb-6">
        <FaBars className="text-2xl cursor-pointer transition-transform duration-300" />
        {!isCollapsed && <h2 className="text-2xl font-semibold ml-4 transition-opacity duration-300">MENU</h2>}
      </div>

      <nav className="flex-1">
        <ul>
          {/* Dashboard Button */}
          <li className="mb-4">
            <button 
              className="flex items-center w-full p-2 hover:bg-blue-700 rounded-lg transition-all duration-300"
              onClick={() => navigate("/dashboard")} // Navigate to Dashboard
            >
              <FaTachometerAlt className="mr-3 text-xl min-w-[32px]" />
              {!isCollapsed && <span className="transition-opacity duration-300">Dashboard</span>}
            </button>
          </li>
          {/* Workforce (Employees) Button */}
          <li className="mb-4">
            <button 
              className="flex items-center w-full p-2 hover:bg-blue-700 rounded-lg transition-all duration-300"
              onClick={() => navigate("/employees")}
            >
              <FaUserCog className="mr-3 text-xl min-w-[32px]" />
              {!isCollapsed && <span className="transition-opacity duration-300">Workforce</span>}
            </button>
          </li>
          {/* Inventory Button */}
          <li className="mb-4">
            <button 
              className="flex items-center w-full p-2 hover:bg-blue-700 rounded-lg transition-all duration-300"
              onClick={() => navigate("/inventory")}
            >
              <FaBox className="mr-3 text-xl min-w-[32px]" />
              {!isCollapsed && <span className="transition-opacity duration-300">Inventory Management</span>}
            </button>
          </li>
          {/* Analytics Button */}
          <li className="mb-4">
            <button 
              className="flex items-center w-full p-2 hover:bg-blue-700 rounded-lg transition-all duration-300"
              onClick={() => navigate("/analytics")}
            >
              <FaChartPie className="mr-3 text-xl min-w-[32px]" />
              {!isCollapsed && <span className="transition-opacity duration-300">Analytics</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-all duration-300"
      >
        <FaSignOutAlt className="mr-3 text-xl min-w-[32px]" />
        {!isCollapsed && <span className="transition-opacity duration-300">Logout</span>}
      </button>
    </aside>
  );
}

export default Sidebar;
