export const submitBulkAttendance = async (attendanceData) => {
  try {
    const response = await axios.post('/api/attendance/bulk', attendanceData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
