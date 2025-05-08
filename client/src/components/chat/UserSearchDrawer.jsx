import { useState, useEffect } from 'react';
import { Box, Drawer, IconButton, InputAdornment, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, TextField, Typography, Avatar, CircularProgress, Divider } from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon, People as PeopleIcon } from '@mui/icons-material';
import axios from 'axios';

const UserSearchDrawer = ({ open, handleClose, onUserSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  
  // Load all users when drawer is opened
  useEffect(() => {
    if (open) {
      fetchAllUsers();
    }
  }, [open]);
  
  // Fetch all available users
  const fetchAllUsers = async () => {
    try {
      setLoadingAllUsers(true);
      // Use the search endpoint with a space as a workaround to get all users
      // The server will return users that match a space (which is all users)
      const { data } = await axios.get('/api/users/search?search=a');
      
      if (Array.isArray(data)) {
        setAllUsers(data);
        console.log(`Loaded ${data.length} users for chat`);
      } else {
        console.error('Unexpected data format:', data);
        setAllUsers([]); 
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
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
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={handleClose}
      PaperProps={{ 
        sx: { width: { xs: '100%', sm: 350 } }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">New Conversation</Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ px: 2, py: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search for users"
          value={searchTerm}
          onChange={handleSearch}
          autoFocus
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
      </Box>
      
      <List sx={{ px: 1 }}>
        {/* Display search results if there are any */}
        {searchResults.length > 0 ? (
          searchResults.map((user) => (
            <ListItem disablePadding key={user._id}>
              <ListItemButton 
                onClick={() => onUserSelect(user._id)}
                sx={{ borderRadius: 1 }}
              >
                <ListItemAvatar>
                  <Avatar>{user.name.charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={user.name}
                  secondary={user.email}
                />
              </ListItemButton>
            </ListItem>
          ))
        ) : searchTerm.trim().length > 1 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No users found matching '{searchTerm}'
            </Typography>
          </Box>
        ) : null}
        
        {/* Show all available users when no search is active */}
        {searchTerm.trim().length <= 1 && (
          <>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1">Available Users</Typography>
            </Box>
            
            {loadingAllUsers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : allUsers.length > 0 ? (
              allUsers.map((user) => (
                <ListItem disablePadding key={user._id}>
                  <ListItemButton 
                    onClick={() => onUserSelect(user._id)}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemAvatar>
                      <Avatar>{user.name.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={user.name}
                      secondary={user.email || user.role}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No users available
                </Typography>
              </Box>
            )}
          </>
        )}
      </List>
    </Drawer>
  );
};

export default UserSearchDrawer;
