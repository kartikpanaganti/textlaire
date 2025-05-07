import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { fetchChats } from '../api/chatApi';
import { toast } from 'react-toastify';
import { SocketContext } from './SocketProvider';
import api from '../api/axiosInstance';

// Create and export the ChatContext
export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  // Use the socket from SocketProvider instead of creating a new one
  const { socket } = useContext(SocketContext);
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const messageProcessorRef = useRef(null);
  
  // Initialize user data from localStorage
  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('user'));
      if (userInfo) {
        setUser(userInfo);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }
  }, []);

  // Load chats on initialization with local cache for faster initial load
  useEffect(() => {
    if (user) {
      // Try to load from session first for quick display
      const cachedChats = sessionStorage.getItem('textlaire_chats');
      
      if (cachedChats) {
        try {
          console.log('Displaying cached chats while fetching fresh data');
          setChats(JSON.parse(cachedChats));
        } catch (error) {
          console.error('Error parsing cached chats:', error);
        }
      }
      
      // Always fetch fresh data from server
      fetchFreshChats();
    }
  }, [user]);

  // Function to fetch fresh chats data from the server
  const fetchFreshChats = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching fresh chats from server...');
      const data = await fetchChats();
      
      if (data && Array.isArray(data)) {
        console.log(`Received ${data.length} chats from server`);
        
        // Deduplicate chats by ID to prevent React key warnings
        const uniqueChats = [];
        const chatIds = new Set();
        
        data.forEach(chat => {
          // Only add if we haven't seen this ID before
          if (chat._id && !chatIds.has(chat._id)) {
            chatIds.add(chat._id);
            uniqueChats.push(chat);
          } else if (chat._id) {
            console.warn(`Skipping duplicate chat with ID: ${chat._id}`);
          } else {
            console.warn('Skipping chat without ID:', chat);
          }
        });
        
        // Sort chats by latest message time
        const sortedChats = uniqueChats.sort((a, b) => {
          const timeA = new Date(a.latestMessage?.createdAt || a.updatedAt || a.createdAt);
          const timeB = new Date(b.latestMessage?.createdAt || b.updatedAt || b.createdAt);
          return timeB - timeA;
        });
        
        // Update state with sorted chats
        setChats(sortedChats);
        
        // Cache the data in both session and local storage
        try {
          const chatData = JSON.stringify(sortedChats);
          sessionStorage.setItem('textlaire_chats', chatData);
          localStorage.setItem('textlaire_chats', chatData);
        } catch (error) {
          console.error('Error caching chats:', error);
        }
      } else {
        console.warn('Received invalid chat data from server');
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for a specific chat
  const fetchMessages = async (chatId, isSocketInitiated = false) => {
    if (!chatId) {
      console.warn('Attempted to fetch messages without a chat ID');
      return [];
    }
    
    // Check if we have a token before making the request
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found. Cannot fetch messages.');
      return [];
    }
    
    setIsLoading(true);
    try {
      // Validate the chat ID format before making the request
      // This helps prevent 404 errors for invalid IDs
      if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
        console.warn(`Invalid chat ID format: ${chatId}`);
        return [];
      }
      
      console.log(`Fetching messages for chat: ${chatId}`);
      // CRITICAL FIX: Use singular 'message' to match the server route
      const response = await api.get(`/api/message/${chatId}`, {
        // Add timeout to prevent hanging requests
        timeout: 5000,
        // Add retry logic for failed requests
        validateStatus: (status) => status < 500 // Only treat 500+ errors as actual errors
      });
      
      // If this is a socket-initiated request, store that information in a global variable
      // that the axios interceptor can check without needing custom headers
      if (isSocketInitiated) {
        window.__isBackgroundRequest = true;
        // Reset after a short delay
        setTimeout(() => {
          window.__isBackgroundRequest = false;
        }, 1000);
      }
      
      if (response.status === 404) {
        console.warn(`No messages found for chat ID: ${chatId}`);
        return [];
      }
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} messages for chat ${chatId}`);
        
        // Cache the messages for this chat
        try {
          sessionStorage.setItem(`messages-${chatId}`, JSON.stringify(response.data));
        } catch (error) {
          console.error('Error caching messages:', error);
        }
        
        return response.data;
      }
      
      console.warn(`Received invalid message data for chat ${chatId}:`, response.data);
      return [];
    } catch (error) {
      console.error(`Error fetching messages for chat ${chatId}:`, error);
      
      // Don't show toast for network errors to avoid spamming the user
      if (error.code !== 'ECONNABORTED' && !error.message.includes('Network Error')) {
        toast.error('Failed to load messages');
      }
      
      // Try to return cached messages as fallback
      try {
        const cachedMessages = sessionStorage.getItem(`messages-${chatId}`);
        if (cachedMessages) {
          console.log(`Using cached messages for chat ${chatId}`);
          return JSON.parse(cachedMessages);
        }
      } catch (cacheError) {
        console.error('Error reading cached messages:', cacheError);
      }
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Update messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      // First try to load from cache for immediate display
      const cachedMessages = sessionStorage.getItem(`messages-${selectedChat._id}`);
      if (cachedMessages) {
        try {
          setMessages(JSON.parse(cachedMessages));
        } catch (error) {
          console.error('Error parsing cached messages:', error);
        }
      } else {
        // Reset messages if no cache exists
        setMessages([]);
      }
      
      // Check if we have a token before fetching messages
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found. Cannot fetch fresh messages.');
        // Try to get user from storage
        const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userData) {
          // If we have user data but no token, the token may have expired
          console.warn('User data exists but no token found. User may need to re-login.');
          toast.error('Your session has expired. Please log in again.');
        }
        return;
      }
      
      // Always fetch fresh messages if we have a token
      const getMessages = async () => {
        const freshMessages = await fetchMessages(selectedChat._id);
        if (freshMessages && freshMessages.length > 0) {
          setMessages(freshMessages);
        }
      };
      
      getMessages();
      
      // Join the chat room via socket.io
      if (socket) {
        socket.emit('join_chat', { chatId: selectedChat._id });
      }
    } else {
      // Clear messages when no chat is selected
      setMessages([]);
    }
  }, [selectedChat, socket]);

  // Process a new message - unified handler for all message sources
  const processNewMessage = useCallback((newMessage) => {
    console.log(`PROCESSING MESSAGE: ${newMessage._id || 'unknown'}`);
    
    if (!newMessage || !newMessage._id) {
      console.warn('Received invalid message:', newMessage);
      return;
    }
    
    // Get chat ID in a robust way
    const chatId = newMessage.chat?._id || 
                 (typeof newMessage.chat === 'string' ? newMessage.chat : null);
    
    if (!chatId) {
      console.warn('Message has no chat ID:', newMessage);
      return;
    }
    
    // Check if message belongs to selected chat
    const selectedChatId = selectedChat?._id?.toString();
    const messageForSelectedChat = selectedChatId === chatId.toString();
    
    console.log(`Message for chat ${chatId}, selected: ${selectedChatId}, matches: ${messageForSelectedChat}`);
    
    // Update messages if this is for the currently selected chat
    if (messageForSelectedChat) {
      setMessages(prevMessages => {
        // Check if message already exists in the list to avoid duplicates
        const messageExists = prevMessages.some(m => m._id === newMessage._id);
        if (messageExists) {
          console.log(`Message ${newMessage._id} already exists in messages list, skipping`);
          return prevMessages;
        }
        console.log(`Adding message ${newMessage._id} to messages list`);
        
        // Create a new array with unique messages only
        const uniqueMessages = [];
        const messageIds = new Set();
        
        // Add existing messages, ensuring no duplicates
        prevMessages.forEach(msg => {
          if (msg._id && !messageIds.has(msg._id)) {
            messageIds.add(msg._id);
            uniqueMessages.push(msg);
          }
        });
        
        // Add the new message
        if (newMessage._id && !messageIds.has(newMessage._id)) {
          messageIds.add(newMessage._id);
          uniqueMessages.push(newMessage);
        }
        
        // Cache in session storage
        try {
          sessionStorage.setItem(`messages-${chatId}`, JSON.stringify(uniqueMessages));
        } catch (error) {
          console.error('Error caching messages:', error);
        }
        
        return uniqueMessages;
      });
      
      // Force a refresh of the messages after a short delay
      // This helps ensure the UI updates properly
      setTimeout(() => {
        if (socket) {
          console.log('Requesting message refresh for selected chat');
          socket.emit('request_message_refresh', { chatId });
        }
      }, 200);
    }
    
    // Always update the chats list for any new message
    setChats(prev => {
      // Find the chat in the list
      const chatIndex = prev.findIndex(c => c._id.toString() === chatId.toString());
      
      if (chatIndex === -1) {
        console.log(`Chat ${chatId} not found in state, fetching fresh data`);
        // Schedule a fresh fetch without blocking current update
        setTimeout(() => fetchFreshChats(), 100);
        return prev;
      }
      
      // Create a new array with all chats
      const updatedChats = [...prev];
      
      // Update the specific chat with the new message
      updatedChats[chatIndex] = {
        ...updatedChats[chatIndex],
        latestMessage: newMessage
      };
      
      // Remove the chat from its current position
      const updatedChat = updatedChats.splice(chatIndex, 1)[0];
      
      // Add it to the beginning (most recent)
      updatedChats.unshift(updatedChat);
      
      // Cache the updated chats
      try {
        const chatData = JSON.stringify(updatedChats);
        sessionStorage.setItem('textlaire_chats', chatData);
        localStorage.setItem('textlaire_chats', chatData);
      } catch (error) {
        console.error('Error caching chats:', error);
      }
      
      return updatedChats;
    });
    
    // Show notification if message is not for the selected chat
    if (!messageForSelectedChat) {
      // Track shown notifications to prevent duplicates
      const notificationKey = `${newMessage._id}_${Date.now()}`;
      
      // Check if we've already shown a toast for this message
      const recentNotifications = JSON.parse(sessionStorage.getItem('textlaire_recent_notifications') || '[]');
      const alreadyShown = recentNotifications.includes(newMessage._id);
      
      // Add to notifications state
      setNotifications(prev => {
        // Avoid duplicates in the notifications list
        if (prev.some(n => n._id === newMessage._id)) {
          return prev;
        }
        return [newMessage, ...prev];
      });
      
      // Only show toast if we haven't shown it recently
      if (!alreadyShown) {
        // Track this notification to prevent duplicates
        recentNotifications.push(newMessage._id);
        // Keep only the most recent 20 notifications
        if (recentNotifications.length > 20) {
          recentNotifications.shift();
        }
        sessionStorage.setItem('textlaire_recent_notifications', JSON.stringify(recentNotifications));
        
        // Show toast notification
        const sender = newMessage.sender?.name || 'Someone';
        const content = newMessage.content || 
                       (newMessage.attachments?.length ? 'Sent an attachment' : 'New message');
        
        toast.info(`${sender}: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          toastId: newMessage._id, // Use message ID as toast ID to prevent duplicates
          onClick: () => {
            // When user clicks the notification, open that chat
            setSelectedChat(prevChat => {
              // Only change if it's a different chat
              if (prevChat?._id !== chatId) {
                // Find the full chat object from our chats list
                const fullChat = chats.find(c => c._id.toString() === chatId.toString());
                return fullChat || prevChat;
              }
              return prevChat;
            });
          }
        });
        
        // Play notification sound
        try {
          // Create audio element only if needed
          const audio = new Audio();
          audio.src = '/notification.mp3';
          // Preload the audio
          audio.preload = 'auto';
          // Add error handling
          audio.onerror = (e) => console.log('Audio load error:', e.message);
          // Only play after loaded
          audio.oncanplaythrough = () => {
            audio.play().catch(e => console.log('Audio play error:', e.message));
          };
        } catch (error) {
          console.log('Notification sound not available:', error.message);
        }
      }
    }
  }, [selectedChat, chats]);

  // Store the message processor in a ref to avoid recreation on every render
  useEffect(() => {
    messageProcessorRef.current = processNewMessage;
  }, [processNewMessage]);

  // Set up socket event listeners for real-time messaging
  useEffect(() => {
    if (!socket) {
      console.log('No socket available');
      return;
    }
    
    console.log('Setting up socket event listeners in ChatContext');
    
    // CRITICAL FIX: First, remove any existing listeners to prevent duplicates
    // This ensures we don't have multiple listeners for the same events
    socket.off('new_message');
    socket.off('typing_indicator');
    socket.off('typing_indicator_stop');
    socket.off('chat_list_update');
    socket.off('refresh_messages');
    socket.off('refresh_chat_data');
    
    // Handler for new messages via socket
    const handleNewMessage = (newMessage) => {
      // Prevent duplicate message handling by checking if we've already seen this message
      if (!newMessage || !newMessage._id) return;
      
      // Track message IDs to prevent duplicate processing
      const processedMessageIds = JSON.parse(sessionStorage.getItem('textlaire_processed_messages') || '[]');
      if (processedMessageIds.includes(newMessage._id)) {
        console.log('SOCKET: Ignoring duplicate message:', newMessage._id);
        return;
      }
      
      console.log('SOCKET: New message received:', newMessage._id);
      
      // Add to processed messages
      processedMessageIds.push(newMessage._id);
      // Keep only the most recent 50 messages to prevent memory issues
      if (processedMessageIds.length > 50) {
        processedMessageIds.shift();
      }
      sessionStorage.setItem('textlaire_processed_messages', JSON.stringify(processedMessageIds));
      
      if (messageProcessorRef.current) {
        messageProcessorRef.current(newMessage);
      }
    };
    
    // Handler for typing indicators
    const handleTypingIndicator = ({ userId, chatId }) => {
      if (!userId || !chatId) return;
      
      setTypingUsers(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), userId]
      }));
    };
    
    // Handler for stop typing indicators
    const handleStopTyping = ({ userId, chatId }) => {
      if (!userId || !chatId) return;
      
      setTypingUsers(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).filter(id => id !== userId)
      }));
    };
    
    // Handler for chat list updates
    const handleChatListUpdate = (updatedChats) => {
      console.log(`SOCKET: Received updated chat list with ${updatedChats?.length || 0} chats`);
      if (updatedChats && Array.isArray(updatedChats) && updatedChats.length > 0) {
        // Deduplicate chats by ID to prevent React key warnings
        const uniqueChats = [];
        const chatIds = new Set();
        
        updatedChats.forEach(chat => {
          // Only add if we haven't seen this ID before
          if (chat._id && !chatIds.has(chat._id)) {
            chatIds.add(chat._id);
            uniqueChats.push(chat);
          }
        });
        
        setChats(uniqueChats);
        
        // Cache the updated chat list
        try {
          const chatData = JSON.stringify(uniqueChats);
          sessionStorage.setItem('textlaire_chats', chatData);
          localStorage.setItem('textlaire_chats', chatData);
        } catch (error) {
          console.error('Error caching chat list:', error);
        }
      }
    };
    
    // Handler for refresh messages requests
    const handleRefreshMessages = ({ chatId }) => {
      console.log('SOCKET: Received refresh_messages for chat:', chatId);
      if (selectedChat && selectedChat._id && chatId && 
          selectedChat._id.toString() === chatId.toString()) {
        // Pass isSocketInitiated=true to prevent 401 redirects
        fetchMessages(chatId, true).then(freshMessages => {
          if (freshMessages && freshMessages.length > 0) {
            setMessages(freshMessages);
            console.log(`Updated messages for chat ${chatId} with ${freshMessages.length} messages`);
          }
        });
      }
    };
    
    // Handler for global chat data refresh
    const handleRefreshChatData = () => {
      console.log('SOCKET: Received refresh_chat_data');
      fetchFreshChats();
    };
    
    // Handler for custom direct message events
    const handleDirectMessage = (event) => {
      console.log('CUSTOM EVENT: Received message via custom event');
      if (messageProcessorRef.current && event.detail) {
        messageProcessorRef.current(event.detail);
      }
    };
    
    // Register all event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('typing_indicator', handleTypingIndicator);
    socket.on('typing_indicator_stop', handleStopTyping);
    socket.on('chat_list_update', handleChatListUpdate);
    socket.on('refresh_messages', handleRefreshMessages);
    socket.on('refresh_chat_data', handleRefreshChatData);
    
    // Remove any existing custom event listeners before adding new ones
    window.removeEventListener('textlaire_new_message', handleDirectMessage);
    window.addEventListener('textlaire_new_message', handleDirectMessage);
    
    // If we have a selected chat, join that room
    if (selectedChat?._id) {
      console.log(`Joining chat room: ${selectedChat._id}`);
      socket.emit('join_chat', { chatId: selectedChat._id });
      
      // Also request a refresh of messages to ensure we have the latest
      // Use a longer timeout to avoid race conditions
      setTimeout(() => {
        if (socket.connected) {
          socket.emit('request_message_refresh', { chatId: selectedChat._id });
        }
      }, 1000);
    }
    
    // Periodically check socket connection and reconnect if needed
    const connectionCheckInterval = setInterval(() => {
      if (socket && !socket.connected) {
        console.log('Socket disconnected, attempting to reconnect...');
        socket.connect();
      }
    }, 5000);
    
    // Clean up function to remove event listeners
    return () => {
      console.log('Cleaning up socket event listeners');
      socket.off('new_message', handleNewMessage);
      socket.off('typing_indicator', handleTypingIndicator);
      socket.off('typing_indicator_stop', handleStopTyping);
      socket.off('chat_list_update', handleChatListUpdate);
      socket.off('refresh_messages', handleRefreshMessages);
      socket.off('refresh_chat_data', handleRefreshChatData);
      window.removeEventListener('textlaire_new_message', handleDirectMessage);
      clearInterval(connectionCheckInterval);
    };
  }, [socket, selectedChat]);

  // Function to send typing indicator
  const sendTypingIndicator = (chatId) => {
    if (socket && user && chatId) {
      socket.emit('typing', { chatId, userId: user._id || user.id });
    }
  };
  
  // Function to send stop typing indicator
  const sendStopTypingIndicator = (chatId) => {
    if (socket && user && chatId) {
      socket.emit('stop_typing', { chatId, userId: user._id || user.id });
    }
  };
  
  // Check if a user is typing in a specific chat
  const isUserTypingInChat = (chatId) => {
    return typingUsers[chatId] && typingUsers[chatId].length > 0;
  };
  
  // Get typing users for a chat
  const getTypingUsersForChat = (chatId) => {
    return typingUsers[chatId] || [];
  };
  
  return (
    <ChatContext.Provider value={{
      user, 
      chats, 
      selectedChat, 
      setSelectedChat, 
      setChats, 
      messages, 
      setMessages, 
      notifications, 
      setNotifications, 
      isLoading, 
      socket,
      fetchFreshChats,
      sendTypingIndicator,
      sendStopTypingIndicator,
      isUserTypingInChat,
      getTypingUsersForChat,
      typingUsers
    }}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => {
  return useContext(ChatContext);
};

// Export the ChatProvider as default for compatibility with existing imports
export default ChatProvider;
