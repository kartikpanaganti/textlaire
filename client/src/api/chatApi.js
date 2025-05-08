import axios from 'axios';

const API_URL = '/api';

// Create or fetch a chat with a user
export const accessChat = async (userId) => {
  try {
    const { data } = await axios.post(`${API_URL}/chat`, { userId }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all chats for the current user
export const fetchChats = async () => {
  try {
    console.log('Fetching all chats...');
    const { data } = await axios.get(`${API_URL}/chat`);
    
    // Ensure we always return an array
    if (Array.isArray(data)) {
      console.log(`Fetched ${data.length} chats`);
      return data;
    } else if (data && Array.isArray(data.chats)) {
      console.log(`Fetched ${data.chats.length} chats from data.chats property`);
      return data.chats;
    } else {
      console.warn('Unexpected chat data format:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching chats:', error);
    // Return empty array on error instead of throwing
    return [];
  }
};

// Create a group chat
export const createGroupChat = async (name, users) => {
  try {
    console.log('Creating group chat with:', { name, userCount: users.length });
    
    const { data } = await axios.post(`${API_URL}/chat/group`, {
      name,
      users: JSON.stringify(users),
    });
    
    console.log('Group chat creation response:', data);
    
    // Return a consistent format even if the server doesn't
    if (data && data._id) {
      return data;
    } else if (data && data.chat) {
      return data.chat;
    } else {
      console.warn('Unexpected group chat creation response format:', data);
      return { _id: null, chatName: name, isGroupChat: true, users: [], ...data };
    }
  } catch (error) {
    console.error('Group chat creation error:', error);
    throw error.response?.data || error.message;
  }
};

// Rename a group chat
export const renameGroupChat = async (chatId, chatName) => {
  try {
    const { data } = await axios.put(`${API_URL}/chat/rename`, {
      chatId,
      chatName,
    });
    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Add a user to a group chat
export const addUserToGroup = async (chatId, userId) => {
  try {
    const { data } = await axios.put(`${API_URL}/chat/groupadd`, {
      chatId,
      userId,
    });
    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Remove a user from a group chat
export const removeUserFromGroup = async (chatId, userId) => {
  try {
    const { data } = await axios.put(`${API_URL}/chat/groupremove`, {
      chatId,
      userId,
    });
    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Leave a group chat (current user leaves the group)
export const leaveGroupChat = async (chatId) => {
  try {
    const { data } = await axios.put(`${API_URL}/chat/groupleave`, {
      chatId,
    });
    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
