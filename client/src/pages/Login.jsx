import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeProvider";
import { UserContext } from "../context/UserProvider";
import axios from "axios";

function Login() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const { login } = useContext(UserContext);
  const [credentials, setCredentials] = useState({ email: "", password: "", secretKey: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState("employee"); // employee or admin
  
  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    // Clear error when user types
    if (error) setError("");
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    // Clear error when switching login type
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Prepare login data based on login type
      const loginData = {
        email: credentials.email,
        password: credentials.password
      };
      
      // Add secret key for admin login
      if (loginType === "admin") {
        if (!credentials.secretKey) {
          setError("Secret key is required for admin login");
          setIsLoading(false);
          return;
        }
        loginData.secretKey = credentials.secretKey;
      }
      
      // Call the API to login using the proxy configured in vite.config.js
      const response = await axios.post(`/api/auth/login`, loginData);
      
      // Check if the user role matches the selected login type
      if ((loginType === "admin" && response.data.user.role !== "admin") ||
          (loginType === "employee" && response.data.user.role !== "employee")) {
        setError(`Invalid credentials for ${loginType} login.`);
        setIsLoading(false);
        return;
      }
      
      // Format user data for context
      const userData = {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        role: response.data.user.role,
        token: response.data.token,
        avatar: null,
        preferences: {
          fontSize: "medium",
          language: "en",
          twoFactorEnabled: false
        }
      };
      
      // Use the login function from UserContext
      login(userData);
      
      // Redirect based on role
      if (response.data.user.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-blue-900 to-purple-900">
      {/* Bubbles Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="bubbles">
          {Array(20).fill(0).map((_, index) => (
            <span key={index} className="bubble"></span>
          ))}
        </div>
      </div>

      {/* Glassmorphic Login Box */}
      <div className="relative flex h-screen justify-center items-center z-10 px-4">
        <div className="backdrop-blur-md bg-white/10 p-6 sm:p-8 rounded-lg shadow-lg border border-white/20 w-full max-w-md text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4 text-center text-cyan-300">Welcome</h2>
          <p className="text-gray-300 text-center mb-4">Sign in to explore system</p>

          {/* Login Type Selector */}
          <div className="flex mb-6 bg-gray-800/50 rounded-lg p-1">
            <button
              type="button"
              onClick={() => handleLoginTypeChange("employee")}
              className={`flex-1 py-2 rounded-md text-center transition-all ${loginType === "employee" ? "bg-cyan-600 text-white" : "text-gray-300 hover:bg-gray-700/50"}`}
            >
              Employee
            </button>
            <button
              type="button"
              onClick={() => handleLoginTypeChange("admin")}
              className={`flex-1 py-2 rounded-md text-center transition-all ${loginType === "admin" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700/50"}`}
            >
              Admin
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                value={credentials.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-600 bg-gray-900/80 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                required
                autoComplete="email"
                placeholder={loginType === "admin" ? "admin@example.com" : "employee@example.com"}
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Password</label>
              <input
                type="password"
                name="password"
                id="password"
                value={credentials.password}
                onChange={handleChange}
                className="w-full p-3 border border-gray-600 bg-gray-900/80 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {/* Secret Key Field - Only shown for admin login */}
            {loginType === "admin" && (
              <div>
                <label className="block text-gray-300 mb-1">Admin Secret Key</label>
                <input
                  type="password"
                  name="secretKey"
                  id="secretKey"
                  value={credentials.secretKey}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-600 bg-gray-900/80 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                  required
                  autoComplete="off"
                  placeholder="Enter your admin secret key"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${loginType === "admin" ? "bg-purple-600 hover:bg-purple-700" : "bg-cyan-600 hover:bg-cyan-700"} text-white font-bold py-3 rounded-lg shadow-lg 
              transform transition-all duration-300 hover:scale-105 mt-4 flex items-center justify-center`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                `Sign in as ${loginType === "admin" ? "Administrator" : "Employee"}`
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p className="mb-1">Need an account? Contact your administrator.</p>
            <p className="text-xs opacity-75">This is a secure login system. All login attempts are monitored.</p>
          </div>
        </div>
      </div>

      {/* Bubble Animation CSS */}
      <style>
        {`
          /* Bubble Background */
          .bubbles {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .bubble {
            position: absolute;
            bottom: -100px;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            animation: floatUp 10s linear infinite;
            filter: blur(2px);
          }

          .bubble:nth-child(odd) {
            width: 60px;
            height: 60px;
            animation-duration: 12s;
          }

          .bubble:nth-child(even) {
            width: 30px;
            height: 30px;
            animation-duration: 8s;
          }

          .bubble:nth-child(1) { left: 10%; animation-delay: 2s; }
          .bubble:nth-child(2) { left: 20%; animation-delay: 3s; }
          .bubble:nth-child(3) { left: 30%; animation-delay: 5s; }
          .bubble:nth-child(4) { left: 40%; animation-delay: 1s; }
          .bubble:nth-child(5) { left: 50%; animation-delay: 4s; }
          .bubble:nth-child(6) { left: 60%; animation-delay: 3s; }
          .bubble:nth-child(7) { left: 70%; animation-delay: 5s; }
          .bubble:nth-child(8) { left: 80%; animation-delay: 2s; }
          .bubble:nth-child(9) { left: 90%; animation-delay: 6s; }
          .bubble:nth-child(10) { left: 95%; animation-delay: 1s; }

          @keyframes floatUp {
            0% {
              transform: translateY(0) scale(0.8);
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateY(-100vh) scale(1.2);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}

export default Login;
