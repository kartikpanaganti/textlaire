import { useState } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, List, ListItem, ListItemAvatar, ListItemText, Avatar, IconButton, CircularProgress, InputAdornment } from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { createGroupChat } from '../../api/chatApi';
import axios from 'axios';
import { useChat } from '../../context/ChatContext';

const NewGroupChatModal = ({ open, handleClose, refreshChats }) => {
  const { user } = useChat();
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Reset state when modal closes
  const handleModalClose = () => {
    setGroupName('');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUsers([]);
    handleClose();
  };

  // Handle search input change
  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim().length <= 1) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/users/search?search=${term}`);
      // Filter out current user and already selected users
      const filteredResults = data.filter(
        (u) => u._id !== user._id && !selectedUsers.some(selected => selected._id === u._id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add user to selected users
  const handleSelectUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter((u) => u._id !== user._id));
    setSearchTerm('');
  };

  // Remove user from selected users
  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  // Create new group chat
  const handleSubmit = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    
    if (selectedUsers.length < 2) {
      alert('Please select at least 2 users for a group chat');
      return;
    }
    
    try {
      setSubmitLoading(true);
      await createGroupChat(
        groupName,
        selectedUsers.map((u) => u._id)
      );
      
      await refreshChats();
      handleModalClose();
    } catch (error) {
      console.error('Error creating group chat:', error);
      alert('Failed to create group chat');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleModalClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Create New Group Chat
        <IconButton onClick={handleModalClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Group Name"
            fullWidth
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            margin="normal"
          />
        </Box>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Search for users to add"
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
        />
        
        {/* Selected users */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 2, gap: 1 }}>
          {selectedUsers.map((user) => (
            <Chip
              key={user._id}
              avatar={<Avatar>{user.name.charAt(0).toUpperCase()}</Avatar>}
              label={user.name}
              onDelete={() => handleRemoveUser(user._id)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
        
        {/* Search results */}
        {searchResults.length > 0 && (
          <List sx={{ mt: 2, maxHeight: '200px', overflow: 'auto' }}>
            {searchResults.map((user) => (
              <ListItem 
                key={user._id} 
                secondaryAction={
                  <IconButton onClick={() => handleSelectUser(user)}>
                    <AddIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar>{user.name.charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={user.name}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleModalClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={submitLoading || selectedUsers.length < 2 || !groupName.trim()}
        >
          {submitLoading ? <CircularProgress size={24} /> : 'Create Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewGroupChatModal;
