import axios from 'axios';

const API_URL = '/api';

// Send a message (with optional files)
export const sendMessage = async (content, chatId, files = []) => {
  try {
    const formData = new FormData();
    
    // Add message content and chat ID
    formData.append('content', content);
    formData.append('chatId', chatId);
    
    // Add files if any
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }
    
    const { data } = await axios.post(`${API_URL}/message`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all messages for a chat
export const fetchMessages = async (chatId) => {
  try {
    const { data } = await axios.get(`${API_URL}/message/${chatId}`);
    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (chatId) => {
  try {
    if (!chatId) {
      console.warn('No chatId provided to markMessagesAsRead');
      return null;
    }
    const { data } = await axios.put(`${API_URL}/message/read/${chatId}`);
    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete a specific message
export const deleteMessage = async (messageId) => {
  try {
    const { data } = await axios.delete(`${API_URL}/message/${messageId}`);
    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Clear all messages in a chat (keeps the chat but removes messages)
export const clearChatHistory = async (chatId) => {
  try {
    const { data } = await axios.delete(`${API_URL}/message/clear/${chatId}`);
    return data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error.response?.data || error.message;
  }
};


