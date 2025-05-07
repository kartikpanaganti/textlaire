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
        
        // Sort chats by latest message time
        const sortedChats = data.sort((a, b) => {
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
  const fetchMessages = async (chatId) => {
    if (!chatId) {
      console.warn('Attempted to fetch messages without a chat ID');
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
      const response = await api.get(`/api/messages/${chatId}`, {
        // Add timeout to prevent hanging requests
        timeout: 5000,
        // Add retry logic for failed requests
        validateStatus: (status) => status < 500 // Only treat 500+ errors as actual errors
      });
      
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
      
      // Always fetch fresh messages
      const getMessages = async () => {
        const freshMessages = await fetchMessages(selectedChat._id);
        setMessages(freshMessages);
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
      setMessages(prev => {
        // Check for duplicates by ID
        if (prev.some(msg => msg._id === newMessage._id)) {
          console.log(`Message ${newMessage._id} already in state, skipping`);
          return prev;
        }
        
        console.log(`Adding message ${newMessage._id} to messages list`);
        const updatedMessages = [...prev, newMessage];
        
        // Cache in session storage
        try {
          sessionStorage.setItem(`messages-${chatId}`, JSON.stringify(updatedMessages));
        } catch (error) {
          console.error('Error caching messages:', error);
        }
        
        return updatedMessages;
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
      // Add to notifications
      setNotifications(prev => {
        // Avoid duplicates
        if (prev.some(n => n._id === newMessage._id)) {
          return prev;
        }
        return [newMessage, ...prev];
      });
      
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
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Audio play error:', e.message));
      } catch (error) {
        console.log('Notification sound not available');
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
    
    // Handler for new messages via socket
    const handleNewMessage = (newMessage) => {
      console.log('SOCKET: New message received:', newMessage._id);
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
        setChats(updatedChats);
        
        // Cache the updated chat list
        try {
          const chatData = JSON.stringify(updatedChats);
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
      if (selectedChat && selectedChat._id.toString() === chatId.toString()) {
        fetchMessages(chatId).then(freshMessages => {
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
    window.addEventListener('textlaire_new_message', handleDirectMessage);
    
    // If we have a selected chat, join that room
    if (selectedChat?._id) {
      console.log(`Joining chat room: ${selectedChat._id}`);
      socket.emit('join_chat', { chatId: selectedChat._id });
      
      // Also request a refresh of messages to ensure we have the latest
      setTimeout(() => {
        socket.emit('request_message_refresh', { chatId: selectedChat._id });
      }, 500);
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
