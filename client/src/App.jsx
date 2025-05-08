import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useContext } from "react";
import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import EmployeePage from "./pages/EmployeePage";
import { ThemeContext } from "./context/ThemeProvider"; // Theme Context
import { UserContext } from "./context/UserProvider"; // User Context
import AttendancePage from "./pages/AttendancePage";
import ImageGeneration from "./pages/ImageGenerator";
import ImageToImagePage from "./pages/ImageToImagePage";
import RawMaterialsInventory from "./pages/RawMaterialsInventory";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ProductsPage from "./pages/ProductsPage";
import UserManagementPage from "./pages/UserManagementPage";
import UserActivityPage from "./pages/UserActivityPage";
import PayrollManagementPage from "./pages/PayrollManagementPage";
import CommunicationPage from "./pages/CommunicationPage"; // Import Communication Page
import DeviceDetector from "./components/common/DeviceDetector";
import PageViewTracker from "./components/common/PageViewTracker";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaLock, FaHome, FaExclamationTriangle } from 'react-icons/fa';

// Define the mapping between paths and permissions
const PROTECTED_PATHS = {
  'dashboard': 'dashboard',
  'employees': 'employees',
  'raw-materials': 'raw-materials',
  'attendance': 'attendance',
  'image-generation': 'image-generation',
  'image-to-image': 'image-generation', // Consider this part of image-generation
  'products': 'products',
  'payroll': null, // No specific permission required, accessible to all authenticated users
  'messages': 'messages',
  'communication': 'messages', // Maps to messages permission
  'user-management': 'admin',
  'user-activity': 'admin',
  'profile': 'profile',
  'settings': 'settings',
  'welcome': null // No permission required for welcome page
};

function App() {
  const { isAuthenticated } = useContext(UserContext);
  
  return (
    <Router>
      {/* Add DeviceDetector component for authenticated users */}
      {isAuthenticated && <DeviceDetector />}
      
      {/* Add PageViewTracker component for authenticated users */}
      {isAuthenticated && <PageViewTracker />}
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/" element={<LoginWrapper />} />
        <Route path="/welcome" element={<ProtectedRoute component={<WelcomePage />} />} />
        <Route path="/dashboard" element={<ProtectedRoute component={<Dashboard />} />} />
        <Route path="/employees" element={<ProtectedRoute component={<EmployeePage />} />} />
        <Route path="/raw-materials" element={<ProtectedRoute component={<RawMaterialsInventory />} />} />
        <Route path="/attendance" element={<ProtectedRoute component={<AttendancePage />} />} />
        <Route path="/image-generation" element={<ProtectedRoute component={<ImageGeneration/>} noContainer={true} />} />
        <Route path="/image-to-image" element={<ProtectedRoute component={<ImageToImagePage/>} noContainer={true} />} />
        <Route path="/products" element={<ProtectedRoute component={<ProductsPage />} />} />
        <Route path="/user-management" element={<ProtectedRoute component={<UserManagementPage />} />} />
        <Route path="/user-activity" element={<ProtectedRoute component={<UserActivityPage />} />} />
        <Route path="/payroll" element={<ProtectedRoute component={<PayrollManagementPage />} />} />
        <Route path="/messages" element={<ProtectedRoute component={<CommunicationPage />} noContainer={true} />} />
        <Route path="/communication" element={<Navigate to="/messages" replace />} />

        {/* profile and settings pages */}
        <Route path="/profile" element={<ProtectedRoute component={<ProfilePage />} />} />
        <Route path="/settings" element={<ProtectedRoute component={<SettingsPage />} />} />
        
        {/* 404 page - this must be at the end */}
        <Route path="*" element={<ProtectedRoute component={<NotFound />} />} />
      </Routes>
    </Router>
  );
}

// Wrapper for Layout (Handles Sidebar & Navbar)
function LayoutWrapper({ children, noContainer = false }) {
  const { theme } = useContext(ThemeContext);
  const { isAuthenticated } = useContext(UserContext);
  
  // Check if the current component is ImageGeneration or ImageToImagePage
  const isImageGenerator = children.type === ImageGeneration || children.type === ImageToImagePage;

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

// Access Denied component
function AccessDenied({ pageId }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="bg-red-100 dark:bg-red-900 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <FaLock className="text-red-600 dark:text-red-300 text-4xl" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have permission to access this page.
          {pageId && <span> Permission required: <strong>{pageId}</strong></span>}
        </p>
        <div className="flex justify-center">
          <button 
            onClick={() => window.location.href = '/welcome'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
          >
            <FaHome className="mr-2" /> Go to Welcome Page
          </button>
        </div>
      </div>
    </div>
  );
}

// 🔹 Wrapper to protect routes
function ProtectedRoute({ component, noContainer = false }) {
  const { isAuthenticated, isLoading, user } = useContext(UserContext);
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  // Get the current path to check permissions
  const location = window.location.pathname;
  const pathSegment = location.split('/')[1]; // Extract the first segment after the /
  
  // Get the required permission for this path
  const requiredPermission = PROTECTED_PATHS[pathSegment];
  
  // Always allow access to profile, settings, and welcome page 
  if (pathSegment === 'profile' || pathSegment === 'settings' || pathSegment === 'welcome') {
    return <LayoutWrapper noContainer={noContainer}>{component}</LayoutWrapper>;
  }
  
  // Admin users have access to all pages
  if (user?.role === 'admin') {
    return <LayoutWrapper noContainer={noContainer}>{component}</LayoutWrapper>;
  }
  
  // If requiredPermission is null, the route is accessible to all authenticated users
  if (requiredPermission === null) {
    return <LayoutWrapper noContainer={noContainer}>{component}</LayoutWrapper>;
  }
  
  // Check if user has permission for this page
  if (requiredPermission && user?.pagePermissions?.includes(requiredPermission)) {
    return <LayoutWrapper noContainer={noContainer}>{component}</LayoutWrapper>;
  }
  
  // User doesn't have permission, show access denied
  return <LayoutWrapper><AccessDenied pageId={requiredPermission} /></LayoutWrapper>;
}

// 🔹 Separate Login Wrapper (No Sidebar/Navbar)
function LoginWrapper() {
  const { isAuthenticated, isLoading } = useContext(UserContext);
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? <Navigate to="/welcome" /> : <Login />;
}

// Welcome Page Component
function WelcomePage() {
  const { user } = useContext(UserContext);
  const currentHour = new Date().getHours();
  
  // Determine greeting based on time of day
  let greeting = "Hello";
  if (currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 max-w-3xl w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-blue-600 dark:text-blue-400">
          {greeting}, {user?.name || "User"}!
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
          Welcome to the Textlaire Management System. Navigate using the sidebar to access your permitted features.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {user?.pagePermissions?.includes('dashboard') && (
            <QuickLink path="/dashboard" label="Dashboard" />
          )}
          {user?.pagePermissions?.includes('employees') && (
            <QuickLink path="/employees" label="Workforce" />
          )}
          {user?.pagePermissions?.includes('messages') && (
            <QuickLink path="/messages" label="Messages" />
          )}
          {user?.role === 'admin' && (
            <QuickLink path="/user-management" label="User Management" />
          )}
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First login'}</p>
        </div>
      </div>
    </div>
  );
}

// Quick Link Component for Welcome Page
function QuickLink({ path, label }) {
  return (
    <a href={path} className="bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 
       text-blue-800 dark:text-blue-300 p-4 rounded-lg transition-all duration-200 
       flex flex-col items-center justify-center border border-blue-200 dark:border-blue-800">
      <span className="text-lg font-medium">{label}</span>
      <span className="text-sm mt-1">Access {label}</span>
    </a>
  );
}

// Not Found Component for 404 errors
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <div className="text-yellow-500 mb-4">
          <FaExclamationTriangle size={60} className="mx-auto" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">404 - Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center gap-4">
          <a href="/welcome" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center">
            <FaHome className="mr-2" /> Go to Welcome Page
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
