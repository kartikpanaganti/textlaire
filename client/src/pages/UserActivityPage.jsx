import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { UserContext } from "../context/UserProvider";
import { useNotification } from "../context/NotificationProvider";
import { SocketContext } from "../context/SocketProvider";
import ActivityFilters from "../components/users/UserActivity/ActivityFilters";
import ActivityDashboard from "../components/users/UserActivity/ActivityDashboard";
import SessionDetailsCard from "../components/users/UserActivity/SessionDetailsCard";
import { FaSync, FaDownload, FaUsersCog, FaSignOutAlt, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";

const UserActivityPage = () => {
  const { user } = useContext(UserContext);
  const { showSuccess, showError } = useNotification();
  const { socket, isConnected } = useContext(SocketContext);
  const [activeUsers, setActiveUsers] = useState([]);
  const [activityStats, setActivityStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("active");
  const [sessionHistory, setSessionHistory] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    startDate: "",
    endDate: "",
    userId: "",
    userEmail: "",
    ipAddress: "",
    deviceType: "",
    status: ""
  });
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  // Fetch active sessions
  const fetchActiveSessions = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/auth/sessions/active");
      setActiveUsers(response.data.sessions);
      setError(null);
    } catch (err) {
      console.error("Error fetching active sessions:", err);
      setError("Failed to load active user sessions");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch activity analytics data specifically for the dashboard
  const fetchAnalyticsData = async () => {
    try {
      const response = await axios.get("/api/auth/stats/analytics");
      if (response.data.success) {
        setActivityStats(prevStats => ({
          ...prevStats,
          ...response.data.analytics
        }));
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err);
    }
  };

  // Fetch activity stats
  const fetchActivityStats = async () => {
    try {
      const response = await axios.get("/api/auth/stats/activity");
      setActivityStats(response.data.stats);
      
      // Also fetch analytics data for more detailed dashboard
      fetchAnalyticsData();
    } catch (err) {
      console.error("Error fetching activity stats:", err);
    }
  };

  // Fetch session history
  const fetchSessionHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (historyFilters.startDate) params.append('startDate', historyFilters.startDate);
      if (historyFilters.endDate) params.append('endDate', historyFilters.endDate);
      if (historyFilters.userId) params.append('userId', historyFilters.userId);
      if (historyFilters.userEmail) params.append('userEmail', historyFilters.userEmail);
      if (historyFilters.ipAddress) params.append('ipAddress', historyFilters.ipAddress);
      if (historyFilters.deviceType) params.append('deviceType', historyFilters.deviceType);
      if (historyFilters.status) params.append('status', historyFilters.status);
      
      const response = await axios.get(
        `/api/auth/sessions/history?${params.toString()}`
      );
      
      if (response.data.success) {
        setSessionHistory(response.data.sessions);
      } else {
        setError(response.data.message || "Failed to load session history");
        setSessionHistory([]);
      }
    } catch (err) {
      console.error("Error fetching session history:", err);
      setError(err.response?.data?.message || "Failed to load session history");
      setSessionHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Force logout a user
  const handleForceLogout = async (sessionId) => {
    try {
      // Use the proxy configuration instead of direct URL
      await axios.post(`/api/auth/sessions/${sessionId}/logout`);
      
      // Refresh active sessions
      fetchActiveSessions();
      fetchActivityStats();
      
      // Show success message using the notification system
      showSuccess("Success", "User has been logged out successfully");
    } catch (err) {
      console.error("Error forcing logout:", err);
      
      // Show error message using the notification system
      showError("Error", "Failed to log out user");
    }
  };

  // Handle filter change
  const handleFilterChange = (filters) => {
    setHistoryFilters(filters);
  };

  // Apply filters
  const applyFilters = (e) => {
    if (e) e.preventDefault();
    fetchSessionHistory();
  };

  // Reset filters
  const resetFilters = () => {
    setHistoryFilters({
      startDate: "",
      endDate: "",
      userId: "",
      userEmail: "",
      ipAddress: "",
      deviceType: "",
      status: ""
    });
    // Fetch all history without filters
    fetchSessionHistory();
  };
  
  // Refresh dashboard data
  const refreshDashboard = () => {
    fetchActivityStats();
    fetchSessionHistory();
  };
  
  // View session details
  const viewSessionDetails = (session) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  // Initial data fetch on component mount
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchActiveSessions();
      fetchActivityStats();
      fetchSessionHistory(); // Also fetch session history on initial load
      
      // Set up real-time socket updates instead of polling
      if (socket && isConnected) {
        // Remove the polling interval as we'll use socket events instead
        console.log('Setting up real-time updates for session data');
        
        // Register for session updates
        socket.emit('register_for_session_updates');
      } else {
        // Fallback to polling if socket is not connected
        console.log('Falling back to polling for session updates');
        const intervalId = setInterval(() => {
          fetchActiveSessions();
          fetchActivityStats();
          if (selectedTab === "history") {
            fetchSessionHistory();
          }
        }, 30000);
        
        return () => clearInterval(intervalId);
      }
    }
  }, [user, socket, isConnected]);

  // Fetch session history when tab changes
  useEffect(() => {
    if (selectedTab === "history" && user?.role === 'admin') {
      fetchSessionHistory();
    }
  }, [selectedTab, user]);
  
  // Socket event listeners for real-time updates
  useEffect(() => {
    if (socket && isConnected && user?.role === 'admin') {
      // Listen for active sessions updates
      socket.on('active_sessions_updated', (data) => {
        console.log('Received active sessions update:', data);
        if (data.sessions) {
          setActiveUsers(data.sessions);
        }
      });
      
      // Listen for session history updates
      socket.on('session_history_updated', (data) => {
        console.log('Received session history update:', data);
        if (data.sessions && selectedTab === "history") {
          // Only update if we're on the history tab
          setSessionHistory(data.sessions);
        }
      });
      
      // Listen for activity stats updates
      socket.on('activity_stats_updated', (data) => {
        console.log('Received activity stats update:', data);
        if (data.stats) {
          setActivityStats(data.stats);
        }
      });
      
      // Listen for force logout events to refresh the session lists
      socket.on('user_logged_out', () => {
        console.log('User logout detected, refreshing sessions');
        fetchActiveSessions();
        fetchActivityStats();
        if (selectedTab === "history") {
          fetchSessionHistory();
        }
      });
      
      // Cleanup event listeners on unmount
      return () => {
        socket.off('active_sessions_updated');
        socket.off('session_history_updated');
        socket.off('activity_stats_updated');
        socket.off('user_logged_out');
      };
    }
  }, [socket, isConnected, user, selectedTab]);
  
  // Real-time duration updates for active sessions
  useEffect(() => {
    if (user?.role === 'admin' && selectedTab === 'active' && activeUsers.length > 0) {
      // Set up timer to update durations every second
      const durationTimer = setInterval(() => {
        // Update active sessions with fresh duration calculations
        const updatedUsers = activeUsers.map(session => {
          // Create a new object to trigger React re-render
          const updatedSession = {...session};
          // Recalculate duration based on current time
          if (updatedSession.loginTime) {
            const loginDate = new Date(updatedSession.loginTime);
            const now = new Date();
            const durationMs = now - loginDate;
            const seconds = Math.floor(durationMs / 1000);
            
            if (seconds < 60) {
              updatedSession.formattedDuration = `${seconds} sec`;
            } else {
              const minutes = Math.floor(seconds / 60);
              if (minutes < 60) {
                updatedSession.formattedDuration = `${minutes}m ${seconds % 60}s`;
              } else {
                const hours = Math.floor(minutes / 60);
                updatedSession.formattedDuration = `${hours}h ${minutes % 60}m`;
              }
            }
          }
          return updatedSession;
        });
        
        // Update the state with fresh durations
        setActiveUsers(updatedUsers);
      }, 1000); // Update every second
      
      // Clean up timer on unmount or tab change
      return () => clearInterval(durationTimer);
    }
  }, [activeUsers, selectedTab, user?.role]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  // Calculate session duration
  const calculateDuration = (loginTime, logoutTime) => {
    if (!loginTime) return 'N/A';
    
    const start = new Date(loginTime);
    const end = logoutTime ? new Date(logoutTime) : new Date();
    
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) return `${seconds} sec`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  };

  // If not admin, show access denied
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-red-500 text-6xl mb-4">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          You don't have permission to access this page. This area is restricted to administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Activity Monitor</h1>
      
      {/* Stats Cards */}
      {activityStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-5 lg:p-6 transform transition-all duration-300 hover:scale-105">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Total Users</h3>
            <div className="flex items-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{activityStats.totalUsers}</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-5 lg:p-6 transform transition-all duration-300 hover:scale-105">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Active Users</h3>
            <div className="flex items-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{activityStats.activeUsers}</div>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-2">
                ({Math.round((activityStats.activeUsers / activityStats.totalUsers) * 100)}%)
              </span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-5 lg:p-6 transform transition-all duration-300 hover:scale-105">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Active Sessions</h3>
            <div className="flex items-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{activityStats.activeSessions}</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-5 lg:p-6 transform transition-all duration-300 hover:scale-105">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Sessions (24h)</h3>
            <div className="flex items-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{activityStats.sessionsLast24Hours}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Activity Analytics Dashboard */}
      {activityStats && sessionHistory && sessionHistory.length > 0 ? (
        <div className="mb-8 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 md:p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">Login Activity Analytics</h2>
            <button 
              onClick={refreshDashboard}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaSync className="mr-1.5" size={14} />
              <span>Refresh</span>
            </button>
          </div>
          <div className="w-full min-h-[400px] md:h-[420px] overflow-x-auto"> {/* Adjusted height for two charts */}
            <ActivityDashboard 
              activityStats={activityStats} 
              sessionHistory={sessionHistory} 
            />
          </div>
        </div>
      ) : (
        <div className="mb-8 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 md:p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">Login Activity Analytics</h2>
            <button 
              onClick={refreshDashboard}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaSync className="mr-1.5" size={14} />
              <span>Refresh</span>
            </button>
          </div>
          <div className="flex justify-center items-center h-[400px]"> {/* Adjusted height for the loading/error state */}
            {isLoading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No activity data available. Try refreshing or changing your filters.</p>
            )}
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setSelectedTab("active")}
              className={`inline-block p-4 rounded-t-lg ${
                selectedTab === "active"
                  ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                  : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
              }`}
            >
              Active Sessions
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setSelectedTab("history")}
              className={`inline-block p-4 rounded-t-lg ${
                selectedTab === "history"
                  ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                  : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
              }`}
            >
              Session History
            </button>
          </li>
        </ul>
      </div>
      
      {/* Active Sessions Tab */}
      {selectedTab === "active" && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Currently Active Sessions</h2>
            <button
              onClick={fetchActiveSessions}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : activeUsers.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-400">No active sessions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Login Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activeUsers.map((session) => (
                    <tr key={session._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium">
                              {session.userId?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {session.userId?.email}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Role: {session.userId?.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(session.loginTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {session.formattedDuration || calculateDuration(session.loginTime, null)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {session.deviceInfo?.ipAddress ? (
                          <div>
                            {/* Display base IP without the Network Device tag */}
                            {session.deviceInfo.ipAddress.replace(/\(Network Device\)/g, '')}
                            
                            {/* Add a properly styled Network Device tag if IP is a private network */}
                            {(session.deviceInfo.ipAddress.includes('192.168.') || 
                              session.deviceInfo.ipAddress.includes('10.') || 
                              /^172\.(1[6-9]|2[0-9]|3[0-1])/.test(session.deviceInfo.ipAddress)) && 
                              <span className="ml-1 text-blue-600 font-medium">(Network Device)</span>
                            }
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          {/* Show device type with colored badge */}
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            session.deviceInfo?.device?.includes('Mobile') 
                              ? 'bg-blue-100 text-blue-800' 
                              : session.deviceInfo?.device?.includes('Tablet')
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {session.deviceInfo?.device || 'Unknown'}
                          </span>
                          
                          {/* Show OS details if available */}
                          {session.deviceInfo?.os && (
                            <div className="mt-1 text-xs text-gray-600">
                              {session.deviceInfo.os}
                              {session.deviceInfo.clientReportedInfo?.model && (
                                <span className="ml-1 font-medium">
                                  ({session.deviceInfo.clientReportedInfo.model})
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Show browser details if available */}
                          {session.deviceInfo?.browser && (
                            <div className="mt-0.5 text-xs text-gray-500">
                              {session.deviceInfo.browser}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleForceLogout(session.sessionId)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Force Logout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* Session History Tab */}
      {selectedTab === "history" && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Session History</h2>
            
            {/* Enhanced Filters */}
            <ActivityFilters 
              onApplyFilters={(filters) => {
                handleFilterChange(filters);
                applyFilters();
              }} 
              onResetFilters={resetFilters}
              initialFilters={historyFilters}
            />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
              <FaExclamationTriangle className="mr-2" />
              {error}
            </div>
          ) : sessionHistory.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-400">No session history found matching your filters.</p>
            </div>
          ) : (
            <>

              
              <div className="overflow-x-auto mt-6 w-full max-w-full">
                <table className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden table-fixed">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">
                        Login Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/7">
                        Logout Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/8">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/8">
                        IP Address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/8">
                        Device
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/10">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sessionHistory.map((session) => (
                      <tr key={session._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 overflow-hidden text-ellipsis">
                        <div className="flex items-center">
                          <div className="max-w-full overflow-hidden">
                            <div className="text-sm font-medium truncate">
                              {session.userId?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {session.userId?.email}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Role: {session.userId?.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm overflow-hidden text-ellipsis">
                        {session.formattedLoginTime || formatDate(session.loginTime)}
                      </td>
                      <td className="px-4 py-3 text-sm overflow-hidden text-ellipsis">
                        {session.formattedLogoutTime || (session.logoutTime ? formatDate(session.logoutTime) : 'Still Active')}
                      </td>
                      <td className="px-4 py-3 text-sm overflow-hidden text-ellipsis">
                        {calculateDuration(session.loginTime, session.logoutTime)}
                      </td>
                      <td className="px-4 py-3 text-sm overflow-hidden text-ellipsis">
                        {session.deviceInfo?.ipAddress ? (
                          <div>
                            {/* Display base IP without the Network Device tag */}
                            {session.deviceInfo.ipAddress.replace(/\(Network Device\)/g, '')}
                            
                            {/* Add a properly styled Network Device tag if IP is a private network */}
                            {(session.deviceInfo.ipAddress.includes('192.168.') || 
                              session.deviceInfo.ipAddress.includes('10.') || 
                              /^172\.(1[6-9]|2[0-9]|3[0-1])/.test(session.deviceInfo.ipAddress)) && 
                              <span className="ml-1 text-blue-600 font-medium">(Network Device)</span>
                            }
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm overflow-hidden text-ellipsis">
                        <div>
                          {/* Show device type with colored badge */}
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            session.deviceInfo?.device?.includes('Mobile') 
                              ? 'bg-blue-100 text-blue-800' 
                              : session.deviceInfo?.device?.includes('Tablet')
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {session.deviceInfo?.device || 'Unknown'}
                          </span>
                          
                          {/* Show OS details if available */}
                          {session.deviceInfo?.os && (
                            <div className="mt-1 text-xs text-gray-600">
                              {session.deviceInfo.os}
                              {session.deviceInfo.model && (
                                <span className="ml-1 font-medium">
                                  ({session.deviceInfo.model})
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Show browser details if available */}
                          {session.deviceInfo?.browser && (
                            <div className="mt-0.5 text-xs text-gray-500">
                              {session.deviceInfo.browser}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => viewSessionDetails(session)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <FaInfoCircle className="mr-1" /> Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          {/* Session Details Modal */}
          {showSessionDetails && selectedSession && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                  <h2 className="text-xl font-semibold">Session Details</h2>
                  <button
                    onClick={() => setShowSessionDetails(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <SessionDetailsCard session={selectedSession} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default UserActivityPage;
