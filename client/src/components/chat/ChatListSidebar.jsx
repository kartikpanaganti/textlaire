import { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { accessChat, fetchChats } from '../../api/chatApi';
import { Avatar, Badge, Box, Divider, IconButton, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, TextField, Typography, InputAdornment } from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Group as GroupIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import NewGroupChatModal from './NewGroupChatModal';
import UserSearchDrawer from './UserSearchDrawer';
import notificationService from '../../services/MessageNotificationService';

const ChatListSidebar = () => {
  const { 
    user, 
    chats, 
    setChats, 
    selectedChat, 
    setSelectedChat, 
    notifications, 
    setNotifications, 
    isLoading, 
    setIsLoading,
    getUnreadCountForChat: contextGetUnreadCountForChat 
  } = useChat();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);
  const [openGroupModal, setOpenGroupModal] = useState(false);
  const [openUserSearch, setOpenUserSearch] = useState(false);
  const [unreadMessagesByChatId, setUnreadMessagesByChatId] = useState({});

  // Subscribe to notification service for unread counts
  useEffect(() => {
    console.log('ChatListSidebar subscribing to notification service');
    
    // Subscribe to notification service 
    const unsubscribe = notificationService.subscribe(update => {
      console.log('ChatListSidebar received update:', update);
      setUnreadMessagesByChatId(update.byChatId);
    });
    
    // Listen for notification service ready events
    const handleServiceReady = () => {
      console.log('ChatListSidebar: Notification service ready');
      const notifState = {
        byChatId: notificationService.unreadMessages,
        total: notificationService.totalUnreadCount
      };
      console.log('ChatListSidebar: Current notification state:', notifState);
      setUnreadMessagesByChatId(notifState.byChatId);
    };
    
    window.addEventListener('textlaire_notification_service_ready', handleServiceReady);
    
    // Force re-fetch initial state after a brief delay
    setTimeout(() => {
      const initialState = {
        byChatId: notificationService.unreadMessages,
        total: notificationService.totalUnreadCount
      };
      console.log('ChatListSidebar: Force fetching initial state:', initialState);
      setUnreadMessagesByChatId(initialState.byChatId);
    }, 500);
    
    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('textlaire_notification_service_ready', handleServiceReady);
      console.log('ChatListSidebar unsubscribed from notification service');
    };
  }, []);

  // Filter chats based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter((chat) => {
        // For group chats, search by group name
        if (chat.isGroupChat) {
          return chat.chatName.toLowerCase().includes(searchTerm.toLowerCase());
        }
        // For one-on-one chats, search by the other user's name
        const otherUser = chat.users.find((u) => u._id !== user._id);
        return otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredChats(filtered);
    }
  }, [searchTerm, chats, user]);

  // Refresh chats
  const refreshChats = async () => {
    setIsLoading(true);
    try {
      const data = await fetchChats();
      setChats(data);
    } catch (error) {
      console.error('Error refreshing chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat selection
  const handleSelectChat = (chat) => {
    console.log('ChatListSidebar: Selecting chat:', chat._id);
    
    // Set the selected chat in the context
    setSelectedChat(chat);
    
    // Save selected chat ID to localStorage for notification handling
    localStorage.setItem('textlaire_selected_chat_id', chat._id);
    
    // Dispatch event to notify notification service
    const event = new CustomEvent('textlaire_chat_selected', { detail: chat._id });
    window.dispatchEvent(event);
    console.log('ChatListSidebar: Dispatched chat_selected event');
  };

  // Format timestamp for last message
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // If message is from today, show time only
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    // If message is from this week, show day name
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return format(date, 'EEE');
    }
    
    // Otherwise show date
    return format(date, 'MMM d');
  };

  // Function to get chat name
  const getChatName = (chat) => {
    if (chat.isGroupChat) {
      return chat.chatName;
    }
    
    // For one-on-one chats, show the other user's name
    const otherUser = chat.users.find((u) => u._id !== user._id);
    return otherUser?.name || 'Unknown User';
  };

  // Function to get latest message text preview
  const getLatestMessagePreview = (chat) => {
    const latest = chat.latestMessage;
    
    if (!latest) {
      return 'No messages yet';
    }
    
    // If message has attachments
    if (latest.attachments && latest.attachments.length > 0) {
      if (latest.content) {
        return `${latest.content} [attachment]`;
      }
      return `[attachment]`;
    }
    
    return latest.content || '';
  };

  // Get unread count for a chat
  const getUnreadCountForChat = (chatId) => {
    console.log(`Getting unread count for chat ${chatId}`, unreadMessagesByChatId[chatId]?.length || 0);
    
    // First try from notification service state
    const unreadMessages = unreadMessagesByChatId[chatId];
    if (unreadMessages) {
      return unreadMessages.length;
    }
    
    // Fall back to context if available
    if (contextGetUnreadCountForChat) {
      return contextGetUnreadCountForChat(chatId);
    }
    
    // Default to global notification service
    return notificationService.getUnreadCountForChat(chatId);
  };

  // Handle user selection from search
  const handleUserSelect = async (userId) => {
    try {
      // Using the proper loading state from context or component
      // Don't try to use setIsLoading if it's not defined
      const data = await accessChat(userId);
      
      // Check if the chat is not already in the list
      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      
      setSelectedChat(data);
      setOpenUserSearch(false);
    } catch (error) {
      console.error('Error accessing chat:', error);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">Messages</Typography>
        <Box>
          <IconButton onClick={() => setOpenUserSearch(true)}>
            <AddIcon />
          </IconButton>
          <IconButton onClick={() => setOpenGroupModal(true)}>
            <GroupIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Search */}
      <Box sx={{ px: 2, py: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Divider />
      
      {/* Chat List */}
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {filteredChats.map((chat) => {
          const unreadCount = getUnreadCountForChat(chat._id);
          const isSelected = selectedChat && selectedChat._id === chat._id;
          
          return (
            <ListItem 
              key={chat._id} 
              disablePadding 
              secondaryAction={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Typography variant="caption" color="text.secondary">
                    {chat.latestMessage && formatTimestamp(chat.latestMessage.createdAt)}
                  </Typography>
                  {unreadCount > 0 && (
                    <Badge 
                      badgeContent={unreadCount} 
                      color="error" 
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              }
            >
              <ListItemButton 
                selected={isSelected}
                onClick={() => handleSelectChat(chat)}
                sx={{ 
                  borderRadius: 1,
                  m: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                  },
                  position: 'relative',
                  ...(unreadCount > 0 && {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '4px',
                      height: '70%',
                      backgroundColor: 'error.main',
                      borderRadius: '0 2px 2px 0'
                    }
                  })
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    {getChatName(chat).charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={getChatName(chat)}
                  secondary={getLatestMessagePreview(chat)}
                  primaryTypographyProps={{
                    fontWeight: unreadCount > 0 ? 700 : 400,
                    variant: 'body1',
                    noWrap: true
                  }}
                  secondaryTypographyProps={{
                    noWrap: true,
                    color: unreadCount > 0 ? 'text.primary' : 'text.secondary',
                    fontWeight: unreadCount > 0 ? 500 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Modals */}
      <NewGroupChatModal 
        open={openGroupModal} 
        handleClose={() => setOpenGroupModal(false)}
        refreshChats={refreshChats}
      />
      
      <UserSearchDrawer 
        open={openUserSearch}
        handleClose={() => setOpenUserSearch(false)}
        onUserSelect={handleUserSelect}
      />
    </Box>
  );
};

export default ChatListSidebar;
