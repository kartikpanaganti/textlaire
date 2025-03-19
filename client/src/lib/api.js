import axios from 'axios';

// Configure API URL based on hostname or env var
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 
    'http://localhost:5000' : 
    `http://${window.location.hostname}:5000`);

// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_URL,
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

/**
 * Configure the fal.ai client
 * @returns {Promise<Object>} - Configuration result
 */
export const configureFalClient = async () => {
  try {
    // This functionality is now handled server-side
    // Client just needs to know where to send requests
    return { success: true, baseUrl: API_URL };
  } catch (error) {
    console.error('Error configuring client:', error);
    throw error;
  }
};

/**
 * Connect to realtime API
 * @param {string} modelId - The model ID to connect to
 * @param {Object} options - Connection options
 * @returns {Promise<Object>} - WebSocket connection details
 */
export const getWebSocketDetails = async () => {
  try {
    const response = await apiClient.get('/api/ws-proxy');
    return response.data;
  } catch (error) {
    console.error('Error getting WebSocket details:', error);
    throw error;
  }
};

/**
 * Submit attendance data in bulk
 * @param {Array} attendanceData - Array of attendance records
 * @returns {Promise<Object>} - API response
 */
export const submitBulkAttendance = async (attendanceData) => {
  try {
    const response = await apiClient.post('/attendance/bulk', attendanceData);
    return response.data;
  } catch (error) {
    console.error('Error submitting attendance:', error);
    throw error;
  }
};

/**
 * Get all patterns
 * @returns {Promise<Array>} - Array of patterns
 */
export const getAllPatterns = async () => {
  try {
    const response = await apiClient.get('/patterns');
    return response.data;
  } catch (error) {
    console.error('Error fetching patterns:', error);
    throw error;
  }
};

/**
 * Get a specific pattern
 * @param {string} id - Pattern ID
 * @returns {Promise<Object>} - Pattern object
 */
export const getPatternById = async (id) => {
  try {
    const response = await apiClient.get(`/patterns/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching pattern with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Save a pattern
 * @param {Object} data - Pattern data
 * @param {File|Blob} imageFile - Image file or blob
 * @returns {Promise<Object>} - Saved pattern
 */
export const savePattern = async (data, imageFile) => {
  try {
    const formData = new FormData();
    
    // Add all data fields to the form
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    
    // Add the image file
    if (imageFile) {
      // If it's already a File object, use it as is
      // Otherwise, convert Blob to File
      const file = imageFile instanceof File 
        ? imageFile 
        : new File([imageFile], `pattern-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      formData.append('image', file);
    }
    
    const response = await apiClient.post('/patterns', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error saving pattern:', error);
    throw error;
  }
};

/**
 * Delete a pattern
 * @param {string} id - Pattern ID
 * @returns {Promise<Object>} - Result of the operation
 */
export const deletePattern = async (id) => {
  try {
    const response = await apiClient.delete(`/patterns/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting pattern with ID ${id}:`, error);
    throw error;
  }
};

export default apiClient; 