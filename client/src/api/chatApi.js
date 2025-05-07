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
    const { data } = await axios.get(`${API_URL}/chat`);
    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create a group chat
export const createGroupChat = async (name, users) => {
  try {
    const { data } = await axios.post(`${API_URL}/chat/group`, {
      name,
      users: JSON.stringify(users),
    });
    return data;
  } catch (error) {
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
