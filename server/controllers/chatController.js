import Chat from "../models/Chat.js";
import User from "../models/User.js";
import { io } from "../server.js";

// Create or access a one-on-one chat
export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "UserId not provided" });
  }

  try {
    // Find if a chat already exists between these two users
    let existingChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user.userId } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    }).populate("users", "-password").populate("latestMessage");

    existingChat = await User.populate(existingChat, {
      path: "latestMessage.sender",
      select: "name email",
    });

    if (existingChat.length > 0) {
      return res.status(200).json(existingChat[0]);
    } else {
      // Create a new chat
      const newChatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.user.userId, userId],
      };

      const createdChat = await Chat.create(newChatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );

      // Notify both users about new chat
      io.to(`user-${req.user.userId}`).to(`user-${userId}`).emit('new_chat', fullChat);
      
      res.status(200).json(fullChat);
    }
  } catch (error) {
    res.status(500).json({ message: "Error accessing the chat", error: error.message });
  }
};

// Get all chats for a user
export const fetchChats = async (req, res) => {
  try {
    // Extract user ID, handling both formats (req.user._id or req.user.userId)
    const userId = req.user.userId || req.user._id;
    
    console.log(`Fetching chats for user ID: ${userId}`);
    
    // Find all chats that include this user
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: userId } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    console.log(`Found ${chats.length} chats for user ${userId}`);
    
    const results = await User.populate(chats, {
      path: "latestMessage.sender",
      select: "name email",
    });

    // Return the results
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chats", error: error.message });
  }
};

// Create a group chat
export const createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  let users = req.body.users;

  // Parse the users if they are sent as a string
  if (typeof users === "string") {
    try {
      users = JSON.parse(users);
    } catch (error) {
      return res.status(400).json({ message: "Invalid users format" });
    }
  }

  // A group chat needs at least 2 other users besides the creator
  if (users.length < 2) {
    return res.status(400).json({ message: "A group chat requires at least 3 users" });
  }

  try {
    // Get the current user ID (handling both formats)
    const currentUserId = req.user.userId || req.user._id;
    console.log(`Creating group chat as user: ${currentUserId}`);
    
    // Check if current user is already included in the users array
    const userAlreadyIncluded = users.some(userId => 
      userId.toString() === currentUserId.toString());
    
    // Only add current user if they're not already included
    if (!userAlreadyIncluded) {
      console.log('Adding current user to the group');
      users.push(currentUserId);
    }
    
    // Log the final users list for debugging
    console.log(`Final group members: ${users.join(', ')}`);
    
    const groupChatData = {
      chatName: req.body.name,
      isGroupChat: true,
      users: users,
      groupAdmin: currentUserId,
    };

    const createdGroupChat = await Chat.create(groupChatData);
    const fullGroupChat = await Chat.findOne({ _id: createdGroupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");
    
    console.log(`Group chat created: ${fullGroupChat._id} with ${fullGroupChat.users.length} users`);

    // Notify all users about the new group chat
    users.forEach(userId => {
      io.to(`user-${userId}`).emit('new_chat', fullGroupChat);
    });

    res.status(200).json(fullGroupChat);
  } catch (error) {
    console.error('Error creating group chat:', error);
    res.status(500).json({ message: "Error creating group chat", error: error.message });
  }
};

// Rename a group chat
export const renameGroupChat = async (req, res) => {
  const { chatId, chatName } = req.body;

  if (!chatId || !chatName) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Notify all users about the name change
    updatedChat.users.forEach(user => {
      io.to(`user-${user._id}`).emit('chat_updated', updatedChat);
    });

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: "Error renaming group chat", error: error.message });
  }
};

// Add user to a group chat
export const addToGroupChat = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    // Check if the chat is a group chat
    const chat = await Chat.findById(chatId);
    if (!chat.isGroupChat) {
      return res.status(400).json({ message: "This operation is only allowed for group chats" });
    }

    // Check if the requester is the admin
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the group admin can add users" });
    }

    // Add user to group
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Notify all users including the new user
    updatedChat.users.forEach(user => {
      io.to(`user-${user._id}`).emit('chat_updated', updatedChat);
    });

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: "Error adding user to group", error: error.message });
  }
};

// Remove user from group chat
export const removeFromGroupChat = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    // Check if the chat is a group chat
    const chat = await Chat.findById(chatId);
    if (!chat.isGroupChat) {
      return res.status(400).json({ message: "This operation is only allowed for group chats" });
    }

    // Check if the requester is the admin or the user is removing themselves
    if (chat.groupAdmin.toString() !== req.user._id.toString() && 
        userId !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "Only the group admin can remove other users" 
      });
    }

    // Remove user from group
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Notify remaining users and the removed user
    updatedChat.users.forEach(user => {
      io.to(`user-${user._id}`).emit('chat_updated', updatedChat);
    });
    io.to(`user-${userId}`).emit('removed_from_chat', {
      chatId,
      message: "You have been removed from the group"
    });

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: "Error removing user from group", error: error.message });
  }
};
