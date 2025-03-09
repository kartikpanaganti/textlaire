import axios from 'axios';

/**
 * Submit bulk attendance data for multiple employees
 * @param {Array} attendanceData - Array of attendance records
 * @returns {Promise} - Promise with the response data
 */
export const submitBulkAttendance = async (attendanceData) => {
  try {
    // Validate attendance data
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      throw new Error('Invalid attendance data format');
    }
    
    const response = await axios.post('http://localhost:5000/api/attendance/bulk', attendanceData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication error. Please log in again.');
    } else if (error.response?.status === 400) {
      throw error.response.data || { message: 'Invalid data format' };
    } else if (error.response?.data) {
      throw error.response.data;
    } else {
      throw new Error(error.message || 'Failed to submit attendance data');
    }
  }
};
