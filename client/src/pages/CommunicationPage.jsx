import { Box, Grid, useMediaQuery, useTheme } from '@mui/material';
import { ChatProvider, useChat } from '../context/ChatContext';
import ChatListSidebar from '../components/chat/ChatListSidebar';
import ChatMessages from '../components/chat/ChatMessages';
import MessageInput from '../components/chat/MessageInput';

// Inner component to use the ChatContext
const CommunicationPageInner = () => {
  const { selectedChat } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Grid container sx={{ height: '100%' }}>
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
