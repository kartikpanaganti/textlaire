import { useState, useEffect } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, List, ListItem, ListItemAvatar, ListItemText, Avatar, IconButton, CircularProgress, InputAdornment, Divider, Alert } from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon, Add as AddIcon, People as PeopleIcon, InfoOutlined as InfoIcon } from '@mui/icons-material';
import { createGroupChat } from '../../api/chatApi';
import axios from 'axios';
import { useChat } from '../../context/ChatContext';
import { useSnackbar } from 'notistack';

const NewGroupChatModal = ({ open, handleClose, refreshChats }) => {
  const { 
    user, 
    chats,
    setSelectedChat,
    fetchChats: contextFetchChats, 
    setChats: contextSetChats 
  } = useChat();
  const { enqueueSnackbar } = useSnackbar();
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal closes
  const handleModalClose = () => {
    setGroupName('');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUsers([]);
    setError('');
    handleClose();
  };
  
  // Load all users when modal is opened
  useEffect(() => {
    if (open) {
      fetchAllUsers();
    }
  }, [open]);
  
  // Fetch all available users
  const fetchAllUsers = async () => {
    try {
      setLoadingAllUsers(true);
      // Use the search endpoint with "a" as a workaround to get all users
      // Most user names contain an "a" so this should return almost all users
      const { data } = await axios.get('/api/users/search?search=a');
      
      if (Array.isArray(data)) {
        // Filter out current user
        const filteredUsers = data.filter(u => u._id !== user._id);
        setAllUsers(filteredUsers);
        console.log(`Loaded ${filteredUsers.length} users for group chat`);
      } else {
        console.error('Unexpected data format:', data);
        setAllUsers([]);
        setError('Failed to load users. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoadingAllUsers(false);
    }
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
    setError('');
    
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    
    if (selectedUsers.length < 2) {
      setError('Please select at least 2 users for a group chat');
      return;
    }
    
    try {
      setSubmitLoading(true);
      const response = await createGroupChat(
        groupName,
        selectedUsers.map((u) => u._id)
      );
      
      console.log('Group chat created:', response);
      
      // Immediately add the new group chat to the state
      if (response && response._id) {
        // Update the chats list first before closing the modal
        if (contextSetChats) {
          // Get current chats and add the new one to the top
          const updatedChats = [response, ...(Array.isArray(chats) ? chats : [])];
          contextSetChats(updatedChats);
          
          // Auto-select the newly created group chat
          if (setSelectedChat) {
            setSelectedChat(response);
          }
          
          enqueueSnackbar('Group chat created successfully!', { variant: 'success' });
          handleModalClose();
        } else {
          // Fallback to traditional refresh method
          try {
            // Try to refresh chats using the passed function first
            if (typeof refreshChats === 'function') {
              await refreshChats();
              enqueueSnackbar('Group chat created successfully!', { variant: 'success' });
            } else {
              console.warn('refreshChats is not a function, using context methods');
              // Use context methods directly if no refresh function provided
              if (contextFetchChats) {
                const chatsData = await contextFetchChats();
                contextSetChats(chatsData);
                enqueueSnackbar('Group chat created successfully!', { variant: 'success' });
              } else {
                // No way to refresh - inform user
                enqueueSnackbar('Group created, but please refresh to see it', { variant: 'warning' });
              }
            }
            handleModalClose();
          } catch (refreshError) {
            console.error('Error refreshing chats:', refreshError);
            // Still close the modal and show success since the chat was created
            enqueueSnackbar('Group created, but chat list may need refreshing', { variant: 'warning' });
            handleModalClose();
          }
        }
      } else {
        setError('Received invalid response from server');
        console.error('Invalid response:', response);
      }
    } catch (error) {
      console.error('Error creating group chat:', error);
      setError(error.response?.data?.message || 'Failed to create group chat');
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
        
        {/* Display errors */}
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
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
        
        {/* Show all available users when no search is active */}
        {searchTerm.trim().length <= 1 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1">Available Users</Typography>
            </Box>
            
            {loadingAllUsers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <List sx={{ maxHeight: '200px', overflow: 'auto' }}>
                {allUsers
                  .filter(u => !selectedUsers.some(selected => selected._id === u._id))
                  .map((user) => (
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
                        secondary={user.email || user.role}
                      />
                    </ListItem>
                  ))}
              </List>
            )}
          </Box>
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
