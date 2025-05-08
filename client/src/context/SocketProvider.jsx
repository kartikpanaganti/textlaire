import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { UserContext } from './UserProvider';
import notificationService from '../services/MessageNotificationService';
import { toast } from 'react-toastify';

// Create Socket Context
export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, logout } = useContext(UserContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  // Add flag to prevent multiple force logout toasts
  const [forceLogoutInProgress, setForceLogoutInProgress] = useState(false);

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

    if (user && (user.id || user._id)) {
      const userId = user.id || user._id;
      console.log('Initializing socket connection for user:', userId);
      
      // Check if we have a token - try multiple sources
      let token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // If no separate token found, try to extract from user object
      if (!token && user && user.token) {
        token = user.token;
        // Store the token separately for future use
        localStorage.setItem('token', token);
        sessionStorage.setItem('token', token);
        console.log('Extracted token from user object and stored separately');
      }
      
      if (!token) {
        console.warn('No authentication token found. Cannot connect to socket.');
        return;
      }
      
      // CRITICAL FIX: Use the same hostname/protocol for Socket.io as for API requests
      // This ensures consistent behavior regardless of how the app is accessed (localhost vs IP)
      const currentHostname = window.location.hostname;
      const currentProtocol = window.location.protocol;
      
      // In development, dynamically configure the socket server URL based on how the client is accessed
      let serverUrl;
      
      if (import.meta.env.DEV) {
        // If accessing via IP address (not localhost), use that same IP for socket connection
        // This is crucial for mobile devices on the same network
        if (currentHostname !== 'localhost' && currentHostname !== '127.0.0.1') {
          serverUrl = `http://${currentHostname}:5000`;
          console.log(`Mobile device detected! Using IP-based socket URL: ${serverUrl}`);
        } else {
          // Default localhost connection
          serverUrl = 'http://localhost:5000';
        }
      } else {
        // In production, connect directly to the server
        serverUrl = import.meta.env.VITE_API_URL || 'https://textlaire.onrender.com';
      }
      
      console.log('Connecting socket from:', window.location.href);
      console.log('DEV MODE: Connecting socket directly to backend server:', serverUrl);
      
      // Create socket connection with auth token and enhanced configuration
      const newSocket = io(serverUrl, {
        withCredentials: true,
        auth: {
          token: token // Include the auth token
        },
        query: {
          userId: userId // Include userId in the query
        },
        reconnection: true,
        reconnectionAttempts: Infinity, // Never give up trying to reconnect
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // Important: Try both transports to ensure connectivity
        transports: ['websocket', 'polling']
      });
      
      console.log('Connecting socket to server at:', serverUrl, 'with userId:', userId);
      
      // Initialize the notification service
      notificationService.init(newSocket, userId);
      
      // Set up event listeners
      newSocket.on('connect', () => {
        console.log('Socket connected successfully:', newSocket.id);
        setIsConnected(true);
        
        // CRITICAL: Register with server using user ID
        if (user && (user.id || user._id)) {
          const userId = user.id || user._id;
          console.log('Sending user_connected event with userId:', userId);
          
          // Send the user_connected event to register with server
          // Send both as an object and as a direct property to ensure compatibility
          newSocket.emit('user_connected', { 
            userId: userId,
            token: token // Include the token for additional verification
          });
          
          // Request latest chat list to maintain UI consistency
          console.log('Requesting latest chat list after connection');
          setTimeout(() => {
            newSocket.emit('request_chat_list');
          }, 500);
        } else {
          console.warn('User object exists but no ID found:', user);
        }
      });
      
      // Handle test messages from server to verify connection
      newSocket.on('socket_test', (data) => {
        console.log('Socket test received:', data);
        // Use this as an opportunity to refresh our data
        if (user && user.id) {
          console.log('Connection verified, requesting fresh chat data');
          newSocket.emit('request_chat_list');
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });
      
      // CRITICAL FIX: Enhanced handling of new_message for guaranteed real-time delivery
      newSocket.on('new_message', (message) => {
        console.log('SOCKET: New message received in SocketProvider:', message._id);
        
        // Implement multiple delivery mechanisms for maximum reliability
        try {
          // 1. Direct custom event dispatch for immediate UI update and notification service
          const event = new CustomEvent('textlaire_new_message', { detail: message });
          window.dispatchEvent(event);
          console.log('SOCKET: Dispatched message via custom event for notification service');
          
          // Ensure notification service is initialized
          if (notificationService && (!notificationService.initialized || !notificationService.socket)) {
            console.log('SOCKET: Re-initializing notification service due to missing initialization');
            if (user && (user.id || user._id)) {
              const userId = user.id || user._id;
              notificationService.init(newSocket, userId);
            }
          }
          
          // Manually trigger notification handling for extra reliability
          if (message.sender?._id !== (user?.id || user?._id)) {
            console.log('SOCKET: Direct notification handling for reliability');
            // Only show notifications for messages not from the current user
            const chatId = message.chat?._id || message.chat;
            notificationService.addUnreadMessage(chatId, message);
            notificationService.showToastNotification(message);
            notificationService.notifyObservers();
          }
          
          // 2. Also re-emit the message on the socket after a brief delay
          // This helps in some edge cases where the initial event might be missed
          setTimeout(() => {
            newSocket.emit('message_received_confirmation', {
              messageId: message._id,
              receivedAt: new Date().toISOString()
            });
          }, 300);
          
          // 3. Store a backup in local storage for potential recovery
          const pendingMessages = JSON.parse(localStorage.getItem('textlaire_pending_messages') || '[]');
          if (!pendingMessages.some(m => m._id === message._id)) {
            pendingMessages.push({
              ...message,
              _receivedAt: new Date().toISOString()
            });
            // Keep only the latest 20 messages to prevent storage issues
            if (pendingMessages.length > 20) {
              pendingMessages.shift();
            }
            localStorage.setItem('textlaire_pending_messages', JSON.stringify(pendingMessages));
          }
        } catch (error) {
          console.error('SOCKET: Error handling new message:', error);
        }
      });
      
      // Set up other message event handlers
      setupMessageEventHandlers(newSocket);
      
      // Update socket state
      setSocket(newSocket);
      
      // Set up network change listeners
      networkCleanup = setupNetworkListeners(newSocket);
      
      // Return cleanup function for socket
      return () => {
        console.log('Cleaning up socket connection');
        if (newSocket) {
          newSocket.disconnect();
        }
        if (networkCleanup) {
          networkCleanup();
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

  // Set up message event handlers
  const setupMessageEventHandlers = (newSocket) => {
    // Process incoming chat messages
    newSocket.on('new_message', (message) => {
      console.log('New message received:', message);
      
      // Dispatch custom event for message notification handling
      if (message) {
        const event = new CustomEvent('textlaire_new_message', { detail: message });
        window.dispatchEvent(event);
      }
    });
    
    // Handle chat updates
    newSocket.on('chat_updated', (updatedChat) => {
      console.log('Chat updated:', updatedChat);
      // Dispatch event for chat context to handle
      if (updatedChat) {
        const event = new CustomEvent('textlaire_chat_updated', { detail: updatedChat });
        window.dispatchEvent(event);
      }
    });

    // Handle user online status updates
    newSocket.on('user_status_update', (update) => {
      console.log('User status update:', update);
      if (update) {
        const event = new CustomEvent('textlaire_user_status_update', { detail: update });
        window.dispatchEvent(event);
      }
    });
    
    // Handle force logout from admin
    newSocket.on('force_logout', (data) => {
      console.log('Force logout received:', data);
      
      // Prevent multiple logout flows
      if (forceLogoutInProgress) {
        console.log('Force logout already in progress, ignoring duplicate event');
        return;
      }
      
      setForceLogoutInProgress(true);
      toast.error(data.message || 'Your session has been terminated by an administrator');
      
      // Wait briefly so user can see the message before refresh
      setTimeout(() => {
        // Perform logout
        if (logout) {
          logout();
        } else {
          // Fallback logout method if context method unavailable
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        
        // Force page refresh
        window.location.reload();
      }, 1500);
    });
    
    // Handle global force logout broadcast
    newSocket.on('global_force_logout', (data) => {
      console.log('Global force logout received:', data);
      
      // Check if this message is meant for current user
      const currentUserId = user?.id || user?._id;
      if (currentUserId && data.userId === currentUserId.toString()) {
        // Prevent multiple logout flows
        if (forceLogoutInProgress) {
          console.log('Force logout already in progress, ignoring duplicate event');
          return;
        }
        
        console.log('This global force logout applies to current user, logging out...');
        setForceLogoutInProgress(true);
        toast.error(data.message || 'Your session has been terminated by an administrator');
        
        // Wait briefly so user can see the message before refresh
        setTimeout(() => {
          // Perform logout
          if (logout) {
            logout();
          } else {
            // Fallback logout method if context method unavailable
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          
          // Force page refresh
          window.location.reload();
        }, 1500);
      }
    });
    
    // Automatic reconnection handling
    newSocket.on('reconnect', (attempt) => {
      console.log(`Socket reconnected after ${attempt} attempts`);
      
      // Re-register user with server after reconnect
      if (user && (user.id || user._id)) {
        const userId = user.id || user._id;
        newSocket.emit('user_connected', { userId });
      }
      
      // Re-initialize notification service
      notificationService.init(newSocket, user?.id || user?._id);
    });
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
