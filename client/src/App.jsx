import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useContext } from "react";
import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import EmployeePage from "./pages/EmployeePage"; // Updated to use our new EmployeePage
import EmployeeDetails from "./components/employee/EmployeeDetails";
import { ThemeContext } from "./context/ThemeProvider"; // Theme Context
import AttendancePage from "./pages/AttendancePage";
import ImageGeneration from "./pages/ImageGenerator";
import RawMaterialsInventory from "./pages/RawMaterialsInventory";
import PayrollPage from "./pages/PayrollPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginWrapper />} />
        <Route path="/dashboard" element={<ProtectedRoute component={<Dashboard />} />} />
        <Route path="/employees" element={<ProtectedRoute component={<EmployeePage />} />} />
        <Route path="/employees/:id" element={<ProtectedRoute component={<EmployeeDetails />} />} />
        <Route path="/raw-materials" element={<ProtectedRoute component={<RawMaterialsInventory />} />} />
        <Route path="/attendance" element={<ProtectedRoute component={<AttendancePage />} />} />
        <Route path="/image-generation" element={<ProtectedRoute component={<ImageGeneration/>} noContainer={true} />} />
        <Route path="/payroll" element={<ProtectedRoute component={<PayrollPage />} />} />
      </Routes>
    </Router>
  );
}

// �� Wrapper for Layout (Handles Sidebar & Navbar)
function LayoutWrapper({ children, noContainer = false }) {
  const { theme } = useContext(ThemeContext);
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  
  // Check if the current component is ImageGeneration
  const isImageGenerator = children.type === ImageGeneration;

  return (
    <div className={`flex flex-col md:flex-row h-screen bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary overflow-hidden`}>
      {isAuthenticated && <Sidebar />} {/* Sidebar only for authenticated users */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isAuthenticated && <Navbar />} {/* Navbar only for authenticated users */}
        <main className="flex-1 overflow-auto scrollbar-thin">
          {noContainer ? (
            children
          ) : (
            <div className="responsive-container">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// 🔹 Wrapper to protect routes
function ProtectedRoute({ component, noContainer = false }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return isAuthenticated ? <LayoutWrapper noContainer={noContainer}>{component}</LayoutWrapper> : <Navigate to="/" />;
}

// 🔹 Separate Login Wrapper (No Sidebar/Navbar)
function LoginWrapper() {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Login />;
}

export default App;
