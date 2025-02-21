import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Employees from "./pages/Employees"; // Import Employees Page
import { ThemeContext } from "./context/ThemeProvider"; // Import Theme Context
import InventoryManagement from "./pages/InventoryManagement";
function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

function MainLayout() {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const showLayout = isAuthenticated && location.pathname !== "/";
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white`}>
      {showLayout && <Sidebar />} {/* Sidebar only on dashboard & employee page */}
      <div className="flex-1 flex flex-col">
        {showLayout && <Navbar />} {/* Navbar only on dashboard & employee page */}

        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/employees" element={isAuthenticated ? <Employees /> : <Navigate to="/" />} /> {/* New Employees Route */}
          <Route path="/inventory" element={isAuthenticated ? <InventoryManagement /> : <Navigate to="/" />} /> {/* New Inventory Management Route */}
        </Routes>
      </div>
    </div>
  );
}

export default App;
