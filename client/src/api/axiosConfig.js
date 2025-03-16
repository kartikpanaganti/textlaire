import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to handle /api prefix
apiClient.interceptors.request.use((config) => {
  // If URL already starts with /api, don't modify it
  if (!config.url.startsWith('/api')) {
    config.url = `/api${config.url}`;
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors here (e.g., logging, showing notifications)
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient; 