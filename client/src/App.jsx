import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useContext } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Employees from "./pages/Employees"; // Employees Page
import { ThemeContext } from "./context/ThemeProvider"; // Theme Context
import InventoryManagement from "./pages/InventoryManagement";
import AttendancePage from "./pages/AttendancePage";
import ImageGeneration from "./pages/ImageGeneration";
import RawMaterialsInventory from "./pages/RawMaterialsInventory";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginWrapper />} />
        <Route path="/dashboard" element={<ProtectedRoute component={<Dashboard />} />} />
        <Route path="/employees" element={<ProtectedRoute component={<Employees />} />} />
        <Route path="/inventory" element={<ProtectedRoute component={<InventoryManagement />} />} />
        <Route path="/raw-materials" element={<ProtectedRoute component={<RawMaterialsInventory />} />} />
        <Route path="/attendance" element={<ProtectedRoute component={<AttendancePage />} />} />
        <Route path="/image-generation" element={<ProtectedRoute component={<ImageGeneration />} />} />
      </Routes>
    </Router>
  );
}

// 🔹 Wrapper for Layout (Handles Sidebar & Navbar)
function LayoutWrapper({ children }) {
  const { theme } = useContext(ThemeContext);
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  return (
    <div className={`flex flex-col md:flex-row h-screen bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary overflow-hidden`}>
      {isAuthenticated && <Sidebar />} {/* Sidebar only for authenticated users */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isAuthenticated && <Navbar />} {/* Navbar only for authenticated users */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
          <div className="responsive-container">
            {children}
          </div>
        </main>
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
