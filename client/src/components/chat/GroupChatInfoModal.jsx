import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { renameGroupChat, addUserToGroup, removeUserFromGroup } from '../../api/chatApi';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import UserSearchDrawer from './UserSearchDrawer';

const GroupChatInfoModal = ({ open, handleClose, chat }) => {
  const { user, selectedChat, setSelectedChat } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [newGroupName, setNewGroupName] = useState(chat?.chatName || '');
  const [renameLoading, setRenameLoading] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [openUserSearch, setOpenUserSearch] = useState(false);
  
  const isAdmin = chat?.groupAdmin?._id === user?._id;
  
  // Handle group rename
  const handleRename = async () => {
    if (!newGroupName.trim() || newGroupName === chat?.chatName || !chat?._id) {
      setIsEditing(false);
      setNewGroupName(chat?.chatName || '');
      return;
    }
    
    try {
      setRenameLoading(true);
      const updatedChat = await renameGroupChat(chat._id, newGroupName);
      setSelectedChat(updatedChat);
      setIsEditing(false);
    } catch (error) {
      console.error('Error renaming group:', error);
      alert('Failed to rename group');
    } finally {
      setRenameLoading(false);
    }
  };
  
  // Handle adding a user to the group
  const handleAddUser = async (userId) => {
    if (!chat?._id || !userId) {
      alert('Unable to add user: Missing chat or user information');
      return;
    }
    
    try {
      setUserActionLoading(true);
      const updatedChat = await addUserToGroup(chat._id, userId);
      setSelectedChat(updatedChat);
      setOpenUserSearch(false);
    } catch (error) {
      console.error('Error adding user to group:', error);
      alert('Failed to add user to group');
    } finally {
      setUserActionLoading(false);
    }
  };
  
  // Handle removing a user from the group
  const handleRemoveUser = async (userId) => {
    if (!userId || !chat?._id) {
      alert('Unable to remove user: Missing chat or user information');
      return;
    }
    
    if (!window.confirm('Are you sure you want to remove this user from the group?')) {
      return;
    }
    
    try {
      setUserActionLoading(true);
      const updatedChat = await removeUserFromGroup(chat._id, userId);
      setSelectedChat(updatedChat);
    } catch (error) {
      console.error('Error removing user from group:', error);
      alert('Failed to remove user from group');
    } finally {
      setUserActionLoading(false);
    }
  };
  
  // Handle leaving the group (remove self)
  const handleLeaveGroup = () => {
    if (!user?._id) {
      alert('Unable to leave group: User information is missing');
      return;
    }
    handleRemoveUser(user._id);
  };
  
  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Group Info
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            {isEditing ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Group Name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  autoFocus
                  disabled={renameLoading}
                />
                <IconButton 
                  color="primary" 
                  onClick={handleRename}
                  disabled={renameLoading}
                >
                  {renameLoading ? <CircularProgress size={24} /> : <CheckIcon />}
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">{chat?.chatName}</Typography>
                {isAdmin && (
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setIsEditing(true);
                      setNewGroupName(chat?.chatName || '');
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            )}
            
            <Typography variant="body2" color="text.secondary">
              Created by {chat?.groupAdmin?.name || 'Unknown'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              {chat?.users?.length || 0} Participants
            </Typography>
            
            {isAdmin && (
              <Button 
                startIcon={<PersonAddIcon />}
                onClick={() => setOpenUserSearch(true)}
                disabled={userActionLoading}
              >
                Add People
              </Button>
            )}
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {chat?.users?.map((participant) => (
              <ListItem 
                key={participant._id}
                secondaryAction={
                  (isAdmin && participant._id !== user._id) ? (
                    <Tooltip title="Remove from group">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleRemoveUser(participant._id)}
                        disabled={userActionLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  ) : null
                }
              >
                <ListItemAvatar>
                  <Avatar>{participant?.name?.charAt(0).toUpperCase() || '?'}</Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={(
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {participant?.name || 'Unknown User'}
                      {chat?.groupAdmin && participant?._id === chat.groupAdmin._id && (
                        <Typography variant="caption" color="primary">(Admin)</Typography>
                      )}
                      {participant?._id === user?._id && (
                        <Typography variant="caption">(You)</Typography>
                      )}
                    </Box>
                  )}
                  secondary={participant.email}
                />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              color="error" 
              variant="outlined"
              onClick={handleLeaveGroup}
              disabled={userActionLoading}
            >
              {userActionLoading ? <CircularProgress size={24} /> : 'Leave Group'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      
      <UserSearchDrawer 
        open={openUserSearch}
        handleClose={() => setOpenUserSearch(false)}
        onUserSelect={handleAddUser}
      />
    </>
  );
};

export default GroupChatInfoModal;
