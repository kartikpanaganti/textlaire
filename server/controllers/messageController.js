import Message from "../models/Message.js";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import { io, userSockets } from "../server.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { getBaseUrl } from '../config/baseUrl.js';

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads/chat");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept all file types for now, but can restrict by type if needed
  cb(null, true);
};

// Initialize multer upload
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit file size to 50MB
});

// Send a message
export const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;
  
  if (!content && (!req.files || req.files.length === 0)) {
    return res.status(400).json({ message: "Message content or files are required" });
  }
  
  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }
  
  try {
    // Process uploaded files if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Use the centralized base URL configuration for consistent file access
        const baseUrl = getBaseUrl();
        attachments.push({
          fileName: file.originalname,
          filePath: `/uploads/chat/${file.filename}`,
          fileUrl: `${baseUrl}/uploads/chat/${file.filename}`,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadDate: new Date()
        });
      });
    }
    
    // Create new message
    const newMessage = {
      sender: req.user.userId,
      content: content || "", // Empty string if only files are sent
      chat: chatId,
      attachments: attachments
    };
    
    let message = await Message.create(newMessage);
    
    // Populate message with sender and chat info
    message = await message.populate("sender", "name email");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name email",
    });
    
    // Update the latest message for this chat
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
    });
    
    // CRITICAL FIX FOR REAL-TIME MESSAGING
    // Maximum redundancy approach to ensure message delivery
    console.log(`[BROADCAST] New message ${message._id} to chat ${message.chat._id}`);
    
    try {
      // 1. Broadcast to the chat room (most efficient approach)
      io.to(`chat-${message.chat._id}`).emit("new_message", message);
      console.log(`[BROADCAST] Sent to chat room: chat-${message.chat._id}`);
      
      // 2. Send to each user individually (fallback #1)
      const userPromises = message.chat.users.map(async (user) => {
        const userId = user._id?.toString();
        if (!userId) return;
        
        // Send to user's personal room
        io.to(`user-${userId}`).emit("new_message", message);
        console.log(`[BROADCAST] Sent to user room: user-${userId}`);
        
        // Direct delivery to all socket connections for this user (fallback #2)
        const userSocketIds = userSockets.get(userId);
        if (userSocketIds && userSocketIds.size > 0) {
          userSocketIds.forEach(socketId => {
            io.to(socketId).emit("new_message", message);
            console.log(`[BROADCAST] Sent directly to socket: ${socketId}`);
            
            // Also send a system message to trigger refresh
            io.to(socketId).emit("refresh_messages", {
              chatId: message.chat._id.toString(),
              messageId: message._id.toString(),
              timestamp: new Date().toISOString()
            });
          });
        } else {
          console.log(`[BROADCAST] No active sockets found for user: ${userId}`);
        }
      });
      
      // Wait for all user broadcasts to complete
      await Promise.all(userPromises);
      
      // 3. Global broadcast as absolute last resort
      io.emit('refresh_chat_data', {
        type: 'new_message',
        chatId: message.chat._id.toString(),
        timestamp: new Date().toISOString()
      });
      
      console.log(`[BROADCAST] Complete for message: ${message._id}`);
    } catch (error) {
      console.error(`[BROADCAST] Error broadcasting message:`, error);
    }
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};

// Get all messages for a chat
export const getAllMessages = async (req, res) => {
  const { chatId } = req.params;
  
  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }
  
  // Validate chat ID format to prevent MongoDB errors
  if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
    console.warn(`Invalid chat ID format received: ${chatId}`);
    // Return empty array instead of error for invalid format
    // This prevents 404 errors in the client
    return res.status(200).json([]);
  }
  
  try {
    // First check if the chat exists
    const chatExists = await Chat.findById(chatId);
    
    if (!chatExists) {
      console.warn(`Chat not found for ID: ${chatId}`);
      // Return empty array instead of 404 for non-existent chat
      // This is more resilient for the client
      return res.status(200).json([]);
    }
    
    // Find all messages for this chat
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email")
      .populate("chat");
    
    console.log(`Found ${messages.length} messages for chat ${chatId}`);
    res.status(200).json(messages);
  } catch (error) {
    console.error(`Error fetching messages for chat ${chatId}:`, error);
    // Return empty array instead of error
    // This prevents 500 errors in the client
    res.status(200).json([]);
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  const { chatId } = req.params;
  
  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }
  
  try {
    // Find all unread messages in this chat
    const unreadMessages = await Message.find({
      chat: chatId,
      readBy: { $ne: req.user.userId },
    });
    
    // Mark all as read by adding this user to readBy
    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { chat: chatId, readBy: { $ne: req.user.userId } },
        { $addToSet: { readBy: req.user.userId } }
      );
      
      // Get all other users in the chat
      const chat = await Chat.findById(chatId);
      if (chat) {
        // Notify other users that messages have been read
        chat.users.forEach(userId => {
          // Add null check for userId
          if (userId && req.user && req.user.userId && userId.toString() !== req.user.userId.toString()) {
            io.to(`user-${userId}`).emit('messages_read', {
              chatId,
              userId: req.user.userId
            });
          }
        });
      }
    }
    
    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error marking messages as read", error: error.message });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  
  if (!messageId) {
    return res.status(400).json({ message: "Message ID is required" });
  }
  
  try {
    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Check if user is authorized to delete (only sender can delete)
    if (message.sender.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }
    
    // Delete any attached files
    if (message.attachments && message.attachments.length > 0) {
      message.attachments.forEach(attachment => {
        const filePath = path.join(process.cwd(), attachment.filePath.replace('/uploads/', 'uploads/'));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    // Delete the message
    await Message.findByIdAndDelete(messageId);
    
    // Notify users in the chat
    const chat = await Chat.findById(message.chat);
    if (chat) {
      chat.users.forEach(userId => {
        io.to(`user-${userId}`).emit('message_deleted', {
          messageId,
          chatId: message.chat
        });
      });
    }
    
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting message", error: error.message });
  }
};

// Clear all messages in a chat
export const clearChatHistory = async (req, res) => {
  const { chatId } = req.params;
  
  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }
  
  try {
    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // Check if the user is part of this chat
    if (!chat.users.includes(req.user.userId)) {
      return res.status(403).json({ message: "Not authorized to clear this chat history" });
    }
    
    // Find all messages with attachments in this chat to delete files
    const messagesWithAttachments = await Message.find({
      chat: chatId,
      attachments: { $exists: true, $not: { $size: 0 } }
    });
    
    // Delete attached files
    messagesWithAttachments.forEach(message => {
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach(attachment => {
          const filePath = path.join(process.cwd(), attachment.filePath.replace('/uploads/', 'uploads/'));
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    });
    
    // Delete all messages in the chat
    await Message.deleteMany({ chat: chatId });
    
    // Update the latestMessage field in the chat to null
    await Chat.findByIdAndUpdate(chatId, { latestMessage: null });
    
    // Notify all users in the chat
    chat.users.forEach(userId => {
      io.to(`user-${userId}`).emit('chat_cleared', { chatId });
    });
    
    res.status(200).json({ message: "Chat history cleared successfully" });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    res.status(500).json({ message: "Error clearing chat history", error: error.message });
  }
};
