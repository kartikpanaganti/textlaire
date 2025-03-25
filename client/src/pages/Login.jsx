import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeProvider";
import { UserContext } from "../context/UserProvider";

function Login() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const { login } = useContext(UserContext);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (credentials.username === "admin" && credentials.password === "password") {
      // Create mock user data
      const userData = {
        id: "user123",
        name: "Admin User",
        email: "admin@example.com",
        role: "Administrator",
        avatar: null,
        preferences: {
          fontSize: "medium",
          language: "en",
          twoFactorEnabled: false
        }
      };
      
      // Use the login function from UserContext
      login(userData);
      navigate("/dashboard");
    } else {
      setError("Invalid credentials. Try again.");
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
          <p className="text-gray-300 text-center mb-4 sm:mb-6">Sign in to explore system</p>

          {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                className="w-full p-3 border border-gray-600 bg-gray-900/80 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                required
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="w-full p-3 border border-gray-600 bg-gray-900/80 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-500 text-white font-bold py-3 rounded-lg shadow-lg 
              transform transition-transform duration-300 hover:scale-105 hover:bg-cyan-600 mt-4"
            >
              Login
            </button>
          </form>
          
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>Demo credentials:</p>
            <p>Username: admin | Password: password</p>
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
