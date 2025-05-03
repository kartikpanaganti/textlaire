import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? 
      'http://localhost:5000' : 
      `${window.location.protocol}//${window.location.host}`),
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Configure the fal.ai client
 * @returns {Promise<boolean>} - Configuration result
 */
export const configureFalClient = async () => {
  try {
    // Initialize necessary configurations
    console.log('Configuring fal.ai client...');
    // Any initialization code here
    return true;
  } catch (error) {
    console.error('Error configuring fal.ai client:', error);
    throw error;
  }
};

/**
 * Connect to realtime API
 * @returns {Promise<Object>} - WebSocket connection details
 */
export const getWebSocketDetails = async () => {
  try {
    const response = await api.get('/api/fal/ws-details');
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
    const response = await api.post('/api/attendance/bulk', attendanceData);
    return response.data;
  } catch (error) {
    console.error('Error submitting bulk attendance:', error);
    throw error;
  }
};

/**
 * Get all patterns
 * @returns {Promise<Array>} - Array of patterns
 */
export const getAllPatterns = async () => {
  try {
    const response = await api.get('/api/patterns');
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
    const response = await api.get(`/api/patterns/${id}`);
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
    
    const response = await api.post('/api/patterns', formData, {
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
    const response = await api.delete(`/api/patterns/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting pattern with ID ${id}:`, error);
    throw error;
  }
};

// Save a generated image
export const saveGeneratedImage = async (imageData) => {
  try {
    const response = await api.post('/api/image-generation/save', imageData);
    return response.data;
  } catch (error) {
    console.error('Error saving generated image:', error);
    throw error;
  }
};

// Get all generated images
export const getAllImageResults = async (page = 1, limit = 20) => {
  try {
    const response = await api.get('/api/image-generation', {
      params: { page, limit }
    });
    return response.data.images;
  } catch (error) {
    console.error('Error fetching image results:', error);
    throw error;
  }
};

// Get a single generated image by ID
export const getImageResultById = async (id) => {
  try {
    const response = await api.get(`/api/image-generation/${id}`);
    return response.data.image;
  } catch (error) {
    console.error('Error fetching image result:', error);
    throw error;
  }
};

// Delete a generated image
export const deleteGeneratedImage = async (id) => {
  try {
    const response = await api.delete(`/api/images/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting image with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Save a generated design as a product in inventory
 * @param {Object} productData - Product data including image, name, description, etc.
 * @returns {Promise<Object>} - Saved product details
 */
export const saveProductToInventory = async (productData) => {
  try {
    const formData = new FormData();
    
    // Add all data fields to the form
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'image' && typeof value === 'object') {
          // If it's an image file or blob
          formData.append('image', value);
        } else {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }
      }
    });
    
    const response = await api.post('/api/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error saving product to inventory:', error);
    throw error;
  }
};

export default api; 