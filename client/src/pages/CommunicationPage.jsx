import { Box, Grid, useMediaQuery, useTheme } from '@mui/material';
import { useEffect } from 'react';
import { ChatProvider, useChat } from '../context/ChatContext';
import ChatListSidebar from '../components/chat/ChatListSidebar';
import ChatMessages from '../components/chat/ChatMessages';
import MessageInput from '../components/chat/MessageInput';
import notificationService from '../services/MessageNotificationService';

// Inner component to use the ChatContext
const CommunicationPageInner = () => {
  const { selectedChat, socket, user } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Initialize notification service when the page loads
  useEffect(() => {
    // Sync any existing notification data with the context
    if (socket && user) {
      console.log('CommunicationPage: Initializing notification service');
      // Make sure notification service is initialized with current user data
      notificationService.init(socket, user?._id || user?.id);
      
      // If we have a selected chat, clear its notifications
      if (selectedChat?._id) {
        console.log('CommunicationPage: Clearing notifications for selected chat:', selectedChat._id);
        const event = new CustomEvent('textlaire_chat_selected', { detail: selectedChat._id });
        window.dispatchEvent(event);
      }
    }
    
    // Set a flag that we're on the messages page
    console.log('CommunicationPage: Setting messages page as active');
    window.localStorage.setItem('textlaire_messages_page_active', 'true');
    
    // Cleanup when leaving this page
    return () => {
      console.log('CommunicationPage: Cleanup - messages page no longer active');
      window.localStorage.removeItem('textlaire_messages_page_active');
    };
  }, [socket, user, selectedChat]);
  
  // Dynamically adjust height for mobile vs desktop
  const containerHeight = isMobile 
    ? 'calc(100vh - 120px)' // More space adjustment for mobile browsers
    : 'calc(100vh - 80px)';
  
  return (
    <Box 
      sx={{ 
        height: containerHeight, 
        display: 'flex', 
        flexDirection: 'column',
        maxWidth: '100%',
        position: 'relative',
        pb: isMobile ? 2 : 0 // Add padding at bottom for mobile
      }}
    >
      <Box sx={{ flexGrow: 1, overflow: 'hidden', width: '100%' }}>
        <Grid container sx={{ height: '100%', maxWidth: '100%' }}>
          {/* Chat List Sidebar */}
          <Grid 
            item 
            xs={12} 
            md={4} 
            lg={3} 
            sx={{
              display: isMobile && selectedChat ? 'none' : 'block',
              height: '100%',
              borderRight: 1,
              borderColor: 'divider'
            }}
          >
            <ChatListSidebar />
          </Grid>
          
          {/* Chat Area */}
          <Grid 
            item 
            xs={12} 
            md={8} 
            lg={9} 
            sx={{
              display: isMobile && !selectedChat ? 'none' : 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <ChatMessages />
            </Box>
            <MessageInput />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

// Wrapper component to provide context
const CommunicationPage = () => {
  return (
    <ChatProvider>
      <CommunicationPageInner />
    </ChatProvider>
  );
};

export default CommunicationPage;
