import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useContext } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Employees from "./pages/Employees"; // Employees Page
import { ThemeContext } from "./context/ThemeProvider"; // Theme Context
import InventoryManagement from "./pages/InventoryManagement";

function App() {
  return (
    
    <Router>
      <Routes>
        
        <Route path="/" element={<LoginWrapper />} />
        <Route path="/dashboard" element={<ProtectedRoute component={<Dashboard />} />} />
        <Route path="/employees" element={<ProtectedRoute component={<Employees />} />} />
        <Route path="/inventory" element={<ProtectedRoute component={<InventoryManagement />} />} />
      </Routes>
    </Router>
  );
}

// 🔹 Wrapper for Layout (Handles Sidebar & Navbar)
function LayoutWrapper({ children }) {
  const { theme } = useContext(ThemeContext);
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white`}>
      {isAuthenticated && <Sidebar />} {/* Sidebar only for authenticated users */}
      <div className="flex-1 flex flex-col">
        {isAuthenticated && <Navbar />} {/* Navbar only for authenticated users */}
        {children}
      </div>
    </div>
  );
}

// 🔹 Wrapper to protect routes
function ProtectedRoute({ component }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return isAuthenticated ? <LayoutWrapper>{component}</LayoutWrapper> : <Navigate to="/" />;
}

// 🔹 Separate Login Wrapper (No Sidebar/Navbar)
function LoginWrapper() {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Login />;
}

export default App;
