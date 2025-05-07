import { useState } from 'react';
import { Box, Drawer, IconButton, InputAdornment, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, TextField, Typography, Avatar, CircularProgress } from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';

const UserSearchDrawer = ({ open, handleClose, onUserSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

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
      </List>
    </Drawer>
  );
};

export default UserSearchDrawer;
