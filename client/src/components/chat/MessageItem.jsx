import { useState } from 'react';
import { Avatar, Box, IconButton, Menu, MenuItem, Typography, Paper } from '@mui/material';
import { 
  MoreVert as MoreVertIcon, 
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  Done as DoneIcon,
  AccessTime as AccessTimeIcon 
} from '@mui/icons-material';
import { format } from 'date-fns';
import { deleteMessage } from '../../api/messageApi';
import AttachmentPreview from './AttachmentPreview';

const MessageItem = ({ message, isOwnMessage, showSender, onMessageDeleted }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Format message time
  const formatMessageTime = (timestamp) => {
    return format(new Date(timestamp), 'h:mm a');
  };
  
  // Handle menu open/close
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle message deletion
  const handleDeleteMessage = async () => {
    try {
      setDeleting(true);
      await deleteMessage(message._id);
      
      // Notify parent component about the deleted message
      if (typeof onMessageDeleted === 'function') {
        onMessageDeleted(message._id);
      }
      
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    } finally {
      setDeleting(false);
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        mb: 1.5,
        maxWidth: '80%',
        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
        // Fixed styles to remove the right gap for sender's messages
        ...(isOwnMessage && {
          mr: 0,  // No right margin for own messages
          pr: 0,  // No right padding
          '& > div': {
            mr: 0, // No margin on children
            pr: 0  // No padding on children
          }
        })
      }}
    >
      {showSender && !isOwnMessage && (
        <Avatar
          sx={{ width: 32, height: 32, mr: 1, mt: 0.5 }}
        >
          {message.sender?.name?.charAt(0).toUpperCase() || '?'}
        </Avatar>
      )}
      
      <Box sx={{ maxWidth: '100%' }}>
        {showSender && !isOwnMessage && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 1, display: 'block', mb: 0.5 }}
          >
            {message.sender?.name || 'Unknown User'}
          </Typography>
        )}
        
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
            color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
            position: 'relative',
            wordBreak: 'break-word',
            ...(isOwnMessage && {
              mr: 0,  // No right margin for sender messages
              pr: 1.5, // Proper padding on the right
              width: '100%' // Use full width of container
            })
          }}
        >
          {message.content && (
            <Typography variant="body2">{message.content}</Typography>
          )}
          
          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mt: message.content ? 1.5 : 0 }}>
              {message.attachments.map((attachment, index) => (
                <AttachmentPreview key={index} attachment={attachment} />
              ))}
            </Box>
          )}
          
          <Box 
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 0.5,
              gap: 0.5, // Reduced gap for tighter layout
              alignItems: 'center'
            }}
          >
            {/* Message status indicators (only for own messages) */}
            {isOwnMessage && (
              <Box 
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: message.readBy?.length > 0 ? 'primary.main' : 'text.secondary'
                }}
              >
                {/* Determine which receipt icon to show */}
                {message.readBy?.length > 0 ? (
                  <DoneAllIcon fontSize="small" sx={{ fontSize: 14, color: 'primary.main' }} />
                ) : (
                  <DoneIcon fontSize="small" sx={{ fontSize: 14, opacity: 0.7 }} />
                )}
              </Box>
            )}
            
            <Typography 
              variant="caption" 
              sx={{ opacity: 0.8 }}
            >
              {formatMessageTime(message.createdAt)}
            </Typography>
            
            {isOwnMessage && (
              <IconButton 
                size="small" 
                onClick={handleMenuOpen}
                sx={{ opacity: 0.8, p: 0.2 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Paper>
      </Box>
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={handleDeleteMessage}
          disabled={deleting}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MessageItem;
