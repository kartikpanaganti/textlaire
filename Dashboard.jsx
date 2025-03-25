const fetchAttendanceData = async () => {
  try {
    // Check if this is the correct endpoint URL
    const response = await axios.get('http://localhost:5000/api/attendance');
    // Or possibly another path like:
    // const response = await axios.get('http://localhost:5000/v1/attendance');
    
    setAttendanceData(response.data);
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    // Optional: Add fallback behavior or user-friendly error display
    setAttendanceData([]);
  }
}; 