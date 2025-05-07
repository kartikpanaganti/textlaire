import axios from 'axios';

/**
 * Create a custom axios instance that handles API requests properly
 * regardless of whether the app is accessed via localhost or IP address
 */
// Get the base API URL dynamically based on current window location
const getApiUrl = () => {
  // In development, always use the direct backend URL to avoid proxy issues
  // This is critical for consistent behavior across all types of requests
  if (import.meta.env.DEV) {
    // Always connect directly to the backend in development
    // This ensures consistent behavior regardless of how the app is accessed
    return 'http://localhost:5000';
  }
  
  // Production URL
  return import.meta.env.VITE_API_URL || 'https://textlaire.onrender.com';
};

// Create a base axios instance with dynamic configuration
const axiosInstance = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Helps with CORS
  },
  withCredentials: true, // Important for sending cookies with requests
});

console.log('API URL set to:', axiosInstance.defaults.baseURL);

// Interceptor to add authorization header if token exists
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle common response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized access. Redirecting to login...');
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page if the error is due to authentication
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
