import axiosInstance from './axiosInstance';

// Generic login function for all user types
export const loginUser = async (credentials) => {
  try {
    console.log('Logging in with credentials:', { ...credentials, password: '****' });
    const response = await axiosInstance.post('/auth/login', credentials);
    console.log('Login successful, response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Legacy support for specific role logins (all use the same endpoint)
export const loginEmployee = loginUser;
export const loginAdmin = loginUser;

// User logout
export const logoutUser = async () => {
  try {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Get current user info
export const getCurrentUser = async () => {
  try {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};
