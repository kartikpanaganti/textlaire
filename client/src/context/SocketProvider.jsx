import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { UserContext } from './UserProvider';

// Create Socket Context
export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, logout } = useContext(UserContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Function to handle network changes
  const setupNetworkListeners = (socketInstance) => {
    // Handle network change events
    const handleNetworkOnline = () => {
      console.log('Network connection restored');
      if (socketInstance && !socketInstance.connected) {
        console.log('Reconnecting socket after network change...');
        socketInstance.connect();
      }
    };

    const handleNetworkOffline = () => {
      console.log('Network connection lost');
    };

    window.addEventListener('online', handleNetworkOnline);
    window.addEventListener('offline', handleNetworkOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleNetworkOnline);
      window.removeEventListener('offline', handleNetworkOffline);
    };
  };

  // Initialize socket connection when user logs in
  useEffect(() => {
    let networkCleanup = null;

    if (user && user.id) {
      console.log('Initializing socket connection for user:', user.id);
      
      // Create socket connection with robust error handling for different networks
      const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10, // Increased attempts for network switches
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling'], // Support both connection types
        query: {
          userId: user.id,
          userAgent: navigator.userAgent,
          networkType: navigator.connection ? navigator.connection.type : 'unknown'
        }
      });

      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        setIsConnected(true);
        
        // Register user with socket
        socketInstance.emit('user_connected', {
          userId: user.id,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            networkType: navigator.connection ? navigator.connection.type : 'unknown'
          }
        });
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Handle force logout event (specific to this socket)
      socketInstance.on('force_logout', (data) => {
        console.log('Received force logout event:', data);
        
        // Show notification to user
        alert(data.message || 'Your session has been terminated by an administrator');
        
        // Perform logout
        logout();
        window.location.href = '/';
      });
      
      // Handle global force logout events (broadcasts to all connected clients)
      socketInstance.on('global_force_logout', (data) => {
        console.log('Received global force logout event:', data);
        
        // Check if this event is for the current user
        if (data.userId === user.id || data.userId === user._id) {
          console.log('This global force logout applies to current user');
          
          // Show notification to user
          alert(data.message || 'Your session has been terminated by an administrator');
          
          // Perform logout
          logout();
          
          // Redirect to login page
          window.location.href = '/';
        }
      });

      // Setup network change listeners
      networkCleanup = setupNetworkListeners(socketInstance);

      // Save socket instance
      setSocket(socketInstance);

      // Clean up on unmount
      return () => {
        console.log('Cleaning up socket connection');
        if (networkCleanup) networkCleanup();
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    } else {
      // Disconnect socket if user logs out
      console.log('No user detected, disconnecting socket if exists');
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      
      // Clean up network listeners
      if (networkCleanup) networkCleanup();
    }
  }, [user, logout]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
