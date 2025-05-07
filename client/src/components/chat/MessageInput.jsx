import { useState, useRef } from 'react';
import { Box, IconButton, InputBase, Paper, Tooltip, Badge, CircularProgress, Chip, Popover } from '@mui/material';
import { Send as SendIcon, AttachFile as AttachFileIcon, InsertEmoticon as EmojiIcon, Close as CloseIcon } from '@mui/icons-material';
import { sendMessage } from '../../api/messageApi';
import { useChat } from '../../context/ChatContext';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = () => {
  const { selectedChat, setMessages, sendTypingIndicator, sendStopTypingIndicator } = useChat();
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const fileInputRef = useRef(null);
  
  // Emoji picker handlers
  const handleEmojiClick = (emojiData) => {
    setMessageText(prev => prev + emojiData.emoji);
  };
  
  const handleEmojiPickerOpen = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };
  
  const handleEmojiPickerClose = () => {
    setEmojiAnchorEl(null);
  };
  
  // Handle sending message
  const handleSend = async () => {
    if ((!messageText.trim() && selectedFiles.length === 0) || !selectedChat) return;
    
    try {
      console.log('🚀 Sending message to chat:', selectedChat._id);
      setIsLoading(true);
      
      // Save the message content before clearing it
      const messageContent = messageText;
      
      // First clear input immediately for better user experience
      setMessageText('');
      setSelectedFiles([]);
      
      // Now send the message to the server
      const data = await sendMessage(messageContent, selectedChat._id, selectedFiles);
      console.log('✅ Message sent successfully, server returned:', data);
      
      // TEMPORARILY add the message directly to the chat for immediate feedback
      // This will be overwritten if/when the socket event arrives, but ensures the user sees their message
      setMessages(prev => [...prev, data]);
      
      // Alert the user that the message was sent
      console.log('Message added to UI, waiting for socket event...');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle typing events with debounce
  const typingTimeoutRef = useRef(null);
  
  const handleTyping = () => {
    if (selectedChat) {
      sendTypingIndicator(selectedChat._id);
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a new timeout to stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTypingIndicator(selectedChat._id);
      }, 3000);
    }
  };
  
  // Handle key press for sending message and typing indicators
  const handleKeyPress = (e) => {
    // Send message on Enter without shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      // Stop typing indicator when message is sent
      sendStopTypingIndicator(selectedChat?._id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } else {
      // Trigger typing indicator
      handleTyping();
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Check if total number of files exceeds 5
    if (selectedFiles.length + files.length > 5) {
      alert('You can only attach up to 5 files');
      return;
    }
    
    // Check file size limit (50MB per file)
    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed the 50MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...files]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove a selected file
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  if (!selectedChat) return null;
  
  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {selectedFiles.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              onDelete={() => removeFile(index)}
              size="small"
            />
          ))}
        </Box>
      )}
      
      {/* Message input */}
      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: '2px 4px',
        }}
      >
        {/* File attachment */}
        <input
          type="file"
          multiple
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="*/*" // Accept all file types
        />
        
        <Tooltip title="Attach files">
          <IconButton onClick={() => fileInputRef.current.click()}>
            <Badge badgeContent={selectedFiles.length} color="primary">
              <AttachFileIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        
        {/* Emoji picker */}
        <Tooltip title="Emoji">
          <IconButton onClick={handleEmojiPickerOpen}>
            <EmojiIcon />
          </IconButton>
        </Tooltip>
        <Popover
          open={Boolean(emojiAnchorEl)}
          anchorEl={emojiAnchorEl}
          onClose={handleEmojiPickerClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            searchDisabled
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
            width={300}
            height={400}
          />
        </Popover>
        
        {/* Text input */}
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Type a message"
          multiline
          maxRows={4}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        
        {/* Send button */}
        <IconButton 
          color="primary" 
          sx={{ p: '10px' }} 
          onClick={handleSend}
          disabled={isLoading || (!messageText.trim() && selectedFiles.length === 0)}
        >
          {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Paper>
    </Box>
  );
};

export default MessageInput;
