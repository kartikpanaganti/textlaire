import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { fetchMessages, markMessagesAsRead, clearChatHistory } from '../../api/messageApi';
import { Avatar, Box, CircularProgress, Divider, IconButton, Menu, MenuItem, Typography, Tooltip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { MoreVert as MoreVertIcon, ArrowBack as ArrowBackIcon, Group as GroupIcon, AccountCircle as ProfileIcon, Delete as DeleteIcon, ExitToApp as ExitIcon } from '@mui/icons-material';
import MessageItem from './MessageItem';
import GroupChatInfoModal from './GroupChatInfoModal';
import { format } from 'date-fns';

const ChatMessages = () => {
  const { user, selectedChat, setSelectedChat, messages, setMessages, isUserTypingInChat, getTypingUsersForChat } = useChat();
  const [loading, setLoading] = useState(false);
  const [openGroupInfo, setOpenGroupInfo] = useState(false);
  const [openProfileView, setOpenProfileView] = useState(false);
  const [openClearDialog, setOpenClearDialog] = useState(false);
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [clearingMessages, setClearingMessages] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const messagesEndRef = useRef(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  
  // Handle menu open/close
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle clearing all messages
  const handleClearMessages = async () => {
    if (!selectedChat) return;
    
    try {
      setClearingMessages(true);
      await clearChatHistory(selectedChat._id);
      setMessages([]);
      setOpenClearDialog(false);
    } catch (error) {
      console.error('Error clearing messages:', error);
      alert('Failed to clear messages');
    } finally {
      setClearingMessages(false);
      handleMenuClose();
    }
  };
  
  // Handle leaving group
  const handleLeaveGroup = async () => {
    if (!selectedChat || !selectedChat.isGroupChat) return;
    
    try {
      setLeavingGroup(true);
      // Import and use the leaveGroupChat function from chatApi
      const { leaveGroupChat } = await import('../../api/chatApi');
      await leaveGroupChat(selectedChat._id);
      
      // Update chat list to remove this chat
      setSelectedChat(null);
      setOpenLeaveDialog(false);
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group');
    } finally {
      setLeavingGroup(false);
      handleMenuClose();
    }
  };
  
  // Handle view profile
  const handleViewProfile = () => {
    setOpenProfileView(true);
    handleMenuClose();
  };
  
  // Get chat name and image
  const getChatInfo = () => {
    if (!selectedChat) return { name: '', image: '' };
    
    if (selectedChat.isGroupChat) {
      return {
        name: selectedChat.chatName,
        image: selectedChat.chatName.charAt(0).toUpperCase(),
        isGroup: true
      };
    }
    
    const otherUser = selectedChat.users.find((u) => u._id !== (user?._id || ''));
    return {
      name: otherUser?.name || 'Unknown',
      image: otherUser?.name.charAt(0).toUpperCase() || '?',
      isGroup: false
    };
  };
  
  // Get the typing user name for display
  const getTypingUser = (chatId) => {
    const typingUserIds = getTypingUsersForChat(chatId);
    if (!typingUserIds || typingUserIds.length === 0) return '';
    
    // In group chats, show the name of the person typing
    if (selectedChat?.isGroupChat) {
      const typingUser = selectedChat.users.find(u => u._id === typingUserIds[0]);
      if (typingUserIds.length === 1) {
        return `${typingUser?.name || 'Someone'} is typing...`;
      } else {
        return `${typingUser?.name || 'Someone'} and ${typingUserIds.length - 1} more are typing...`;
      }
    }
    
    // In one-on-one chats, just show 'typing...'
    return 'typing...';
  };
  
  // Fetch messages when selected chat changes
  useEffect(() => {
    if (!selectedChat) return;
    
    const fetchChatMessages = async () => {
      setLoading(true);
      try {
        const data = await fetchMessages(selectedChat._id);
        setMessages(data);
        
        // Mark messages as read (only if we have a valid chat ID)
        if (selectedChat && selectedChat._id) {
          try {
            await markMessagesAsRead(selectedChat._id);
          } catch (markError) {
            // Just log the error but don't stop the messages from loading
            console.warn('Error marking messages as read:', markError);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatMessages();
  }, [selectedChat, setMessages]);
  
  // Scroll to bottom when messages change or when a chat is first loaded
  useEffect(() => {
    // Force scroll to bottom when messages load
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);
  
  // Also scroll when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      // Use a small timeout to ensure the DOM has updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [selectedChat]);
  
  // Format date for message groups
  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };
  
  // Group messages by date
  const groupMessagesByDate = () => {
    if (!messages.length) return [];
    
    // First, deduplicate messages to prevent React key warnings
    const uniqueMessages = [];
    const messageIds = new Set();
    
    messages.forEach(message => {
      if (message._id && !messageIds.has(message._id)) {
        messageIds.add(message._id);
        uniqueMessages.push(message);
      }
    });
    
    const groups = [];
    let currentGroup = {
      date: formatMessageDate(uniqueMessages[0].createdAt),
      messages: [uniqueMessages[0]]
    };
    
    for (let i = 1; i < uniqueMessages.length; i++) {
      const currentDate = formatMessageDate(uniqueMessages[i].createdAt);
      
      if (currentDate === currentGroup.date) {
        currentGroup.messages.push(uniqueMessages[i]);
      } else {
        groups.push(currentGroup);
        currentGroup = {
          date: currentDate,
          messages: [uniqueMessages[i]]
        };
      }
    }
    
    groups.push(currentGroup);
    return groups;
  };
  
  // Handle back button
  const handleBack = () => {
    setSelectedChat(null);
  };
  
  // If no chat is selected
  if (!selectedChat) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: '400px', p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Select a conversation
          </Typography>
          <Typography color="text.secondary">
            Choose an existing conversation or start a new one to begin messaging
          </Typography>
        </Box>
      </Box>
    );
  }
  
  const chatInfo = getChatInfo();
  const messageGroups = groupMessagesByDate();
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <IconButton 
          sx={{ display: { sm: 'flex', md: 'none' }, mr: 1 }}
          onClick={handleBack}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Avatar sx={{ mr: 2 }}>{chatInfo.image}</Avatar>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            {chatInfo.name}
          </Typography>
          
          {chatInfo.isGroup && (
            <Typography variant="caption" color="text.secondary">
              {selectedChat.users.length} members
            </Typography>
          )}
        </Box>
        
        {chatInfo.isGroup && (
          <Tooltip title="Group Info">
            <IconButton onClick={() => setOpenGroupInfo(true)}>
              <GroupIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <IconButton onClick={handleMenuOpen}>
          <MoreVertIcon />
        </IconButton>
        
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          {chatInfo.isGroup ? (
            <MenuItem onClick={() => {
              handleMenuClose();
              setOpenGroupInfo(true);
            }}>
              <GroupIcon fontSize="small" sx={{ mr: 1 }} />
              Group info
            </MenuItem>
          ) : (
            <MenuItem onClick={handleViewProfile}>
              <ProfileIcon fontSize="small" sx={{ mr: 1 }} />
              View profile
            </MenuItem>
          )}
          
          <MenuItem onClick={() => setOpenClearDialog(true)}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Clear messages
          </MenuItem>
          
          {chatInfo.isGroup && (
            <MenuItem onClick={() => setOpenLeaveDialog(true)}>
              <ExitIcon fontSize="small" sx={{ mr: 1 }} />
              Leave group
            </MenuItem>
          )}
        </Menu>
      </Box>
      
      {/* Messages area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: 'grey.50'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : messageGroups.length > 0 ? (
          messageGroups.map((group, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    boxShadow: 1
                  }}
                >
                  {group.date}
                </Typography>
              </Box>
              
              {group.messages.map((message, msgIndex) => (
                <MessageItem 
                  key={message._id} 
                  message={message} 
                  isOwnMessage={message.sender?._id === user?._id}
                  showSender={chatInfo.isGroup}
                />
              ))}
            </Box>
          ))
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        )}
        {/* Typing indicator */}
        {selectedChat && isUserTypingInChat(selectedChat._id) && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                padding: '8px 12px',
                borderRadius: '16px',
                backgroundColor: 'background.paper',
                maxWidth: '80%',
                boxShadow: 1
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 0.5
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      animation: 'wave 1.3s linear infinite',
                      '&:nth-of-type(2)': {
                        animationDelay: '-1.1s'
                      },
                      '&:nth-of-type(3)': {
                        animationDelay: '-0.9s'
                      },
                      '@keyframes wave': {
                        '0%, 60%, 100%': {
                          transform: 'initial'
                        },
                        '30%': {
                          transform: 'translateY(-10px)'
                        }
                      }
                    }}
                  />
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      animation: 'wave 1.3s linear infinite',
                      animationDelay: '-1.1s'
                    }}
                  />
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      animation: 'wave 1.3s linear infinite',
                      animationDelay: '-0.9s'
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {getTypingUser(selectedChat._id)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Group chat info modal */}
      {selectedChat && chatInfo.isGroup && (
        <GroupChatInfoModal
          open={openGroupInfo}
          handleClose={() => setOpenGroupInfo(false)}
          chat={selectedChat}
        />
      )}
      
      {/* Clear messages confirmation dialog */}
      <Dialog
        open={openClearDialog}
        onClose={() => setOpenClearDialog(false)}
      >
        <DialogTitle>Clear Messages</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear all messages in this chat? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClearDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleClearMessages} 
            color="error"
            disabled={clearingMessages}
          >
            {clearingMessages ? 'Clearing...' : 'Clear'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Leave group confirmation dialog */}
      {chatInfo.isGroup && (
        <Dialog
          open={openLeaveDialog}
          onClose={() => setOpenLeaveDialog(false)}
        >
          <DialogTitle>Leave Group</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to leave this group? You will need to be added back by an admin to rejoin.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenLeaveDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleLeaveGroup} 
              color="error"
              disabled={leavingGroup}
            >
              {leavingGroup ? 'Leaving...' : 'Leave Group'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* User profile dialog - for 1-on-1 chats */}
      {!chatInfo.isGroup && selectedChat && (
        <Dialog
          open={openProfileView}
          onClose={() => setOpenProfileView(false)}
        >
          <DialogTitle>User Profile</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
              <Avatar sx={{ width: 80, height: 80, mb: 2 }}>
                {chatInfo.image}
              </Avatar>
              <Typography variant="h6">{chatInfo.name}</Typography>
              {selectedChat.users.filter(u => u._id !== user?._id).map(otherUser => (
                <Box key={otherUser._id} sx={{ mt: 2, textAlign: 'center' }}>
                  {otherUser.email && (
                    <Typography variant="body2" color="text.secondary">
                      Email: {otherUser.email}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProfileView(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ChatMessages;
