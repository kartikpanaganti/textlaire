import axios from 'axios';

/**
 * Create a custom axios instance that handles API requests properly
 * regardless of whether the app is accessed via localhost or IP address
 */
// Get the base API URL dynamically based on current window location
const getApiUrl = () => {
  if (import.meta.env.DEV) {
    // In development, use the server IP that matches how the client is being accessed
    const hostname = window.location.hostname;
    
    // If accessing via IP address, use that same IP to connect to the server
    // This is crucial for mobile devices on the same network
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      console.log(`Detected access via IP: ${hostname}, connecting to server at same IP`);
      return `http://${hostname}:5000`; // Use the same IP but correct server port
    }
    
    // Default for localhost access
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
  // Try to get token from localStorage first
  let token = localStorage.getItem('token');
  
  // If token doesn't exist in localStorage, try to get it from sessionStorage
  if (!token) {
    token = sessionStorage.getItem('token');
  }
  
  // If we found a token, add it to the request headers
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Added auth token to request:', config.url);
  } else {
    console.warn('No auth token found for request:', config.url);
    
    // Attempt to get user data to check if we should have a token
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userData) {
      console.warn('User data exists but no token found. User may need to re-login.');
    }
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
      // Check if we have a token in localStorage
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      // If we have a token but still got a 401, the token might be expired
      if (token) {
        console.warn('Received 401 despite having a token. Token may be expired.');
        
        // Check if this is a background request (e.g., from socket events)
        const isBackgroundRequest = error.config && 
          (error.config.url.includes('/api/message/') || 
           window.__isBackgroundRequest === true);
        
        if (isBackgroundRequest) {
          console.log('Background request failed with 401. Not redirecting.');
          // For background requests, don't redirect, just report the error
        } else {
          // For user-initiated requests, clear storage and redirect
          console.log('User-initiated request failed with 401. Redirecting to login...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        // No token found, redirect to login
        console.log('No token found. Redirecting to login...');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
