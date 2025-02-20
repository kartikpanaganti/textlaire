import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (credentials.username === "admin" && credentials.password === "password") {
      localStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard");
    } else {
      setError("Invalid credentials. Try again.");
    }
  };

  return (
    <div className="relative flex h-screen justify-center items-center bg-gradient-to-r from-blue-600 to-purple-700 overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>

      {/* Glassmorphism Login Box */}
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-8 w-96">
        <h2 className="text-3xl font-extrabold text-white text-center mb-6">Login</h2>

        {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-white font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              className="w-full p-3 border border-white/30 rounded-lg bg-white/20 text-white placeholder-gray-300 
              focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-white font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full p-3 border border-white/30 rounded-lg bg-white/20 text-white placeholder-gray-300 
              focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg 
            transform transition-transform duration-300 hover:scale-105 hover:shadow-xl"
          >
            Login
          </button>
        </form>
      </div>

      {/* Bubble Animation CSS */}
      <style>
        {`
          .bubble {
            position: absolute;
            bottom: -100px;
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            animation: floatUp 10s infinite linear;
          }

          .bubble:nth-child(1) { left: 10%; width: 40px; height: 40px; animation-duration: 8s; }
          .bubble:nth-child(2) { left: 30%; width: 60px; height: 60px; animation-duration: 12s; }
          .bubble:nth-child(3) { left: 50%; width: 30px; height: 30px; animation-duration: 9s; }
          .bubble:nth-child(4) { left: 70%; width: 70px; height: 70px; animation-duration: 11s; }
          .bubble:nth-child(5) { left: 90%; width: 50px; height: 50px; animation-duration: 10s; }

          @keyframes floatUp {
            0% { transform: translateY(0); opacity: 1; }
            50% { opacity: 0.7; }
            100% { transform: translateY(-110vh); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
}

export default Login;
