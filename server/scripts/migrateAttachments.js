import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js';
import { getBaseUrl } from '../config/baseUrl.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Migration function
const migrateAttachments = async () => {
  try {
    console.log("Starting attachment migration...");

    // Find all messages with attachments
    const messagesWithAttachments = await Message.find({
      attachments: { $exists: true, $not: { $size: 0 } }
    });

    console.log(`Found ${messagesWithAttachments.length} messages with attachments to migrate`);
    
    const baseUrl = getBaseUrl();
    
    // Create the new directory
    const newDir = path.join(process.cwd(), 'uploads/chat/attachment');
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }
    
    // Process each message
    for (const message of messagesWithAttachments) {
      // Track if we need to update this message
      let needsUpdate = false;
      
      // Process each attachment
      for (let i = 0; i < message.attachments.length; i++) {
        const attachment = message.attachments[i];
        
        // Only migrate attachments with old path format
        if (attachment.filePath && 
            attachment.filePath.startsWith('/uploads/chat/') && 
            !attachment.filePath.includes('/attachment/')) {
          
          const oldFilePath = path.join(
            process.cwd(), 
            attachment.filePath.replace('/uploads/', 'uploads/')
          );
          
          const fileName = path.basename(attachment.filePath);
          const newFilePath = path.join(newDir, fileName);
          
          // Copy the file if it exists
          if (fs.existsSync(oldFilePath)) {
            try {
              // Copy file to new location
              fs.copyFileSync(oldFilePath, newFilePath);
              console.log(`Copied file from ${oldFilePath} to ${newFilePath}`);
              
              // Update the paths in the attachment
              message.attachments[i].filePath = `/uploads/chat/attachment/${fileName}`;
              message.attachments[i].fileUrl = `${baseUrl}/uploads/chat/attachment/${fileName}`;
              
              needsUpdate = true;
            } catch (error) {
              console.error(`Error copying file ${oldFilePath}:`, error);
            }
          } else {
            console.warn(`File not found at ${oldFilePath}`);
          }
        }
      }
      
      // Save the message if it was updated
      if (needsUpdate) {
        await message.save();
        console.log(`Updated attachment paths for message ${message._id}`);
      }
    }
    
    console.log("Attachment migration completed successfully");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the migration
migrateAttachments(); 