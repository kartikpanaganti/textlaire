import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Fallback MongoDB URI if environment variable is not set
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/textlaire';

console.log('Attempting to connect to MongoDB...');

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@textlaire.com' });
    
    if (adminExists) {
      console.log('Admin user already exists. Resetting password...');
      
      // Update the existing admin user with the specified credentials
      adminExists.name = 'System Administrator';
      adminExists.password = 'admin123'; // Will be hashed by the pre-save hook
      adminExists.secretKey = 'admin';
      
      await adminExists.save();
      
      console.log('Admin user reset successfully');
      console.log('=== ADMIN CREDENTIALS ===');
      console.log('Email: admin@textlaire.com');
      console.log('Password: admin123');
      console.log('Secret Key: admin');
      console.log('=========================');
      
      process.exit(0);
    }
    
    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@textlaire.com',
      password: 'admin123', // Will be hashed by the pre-save hook
      role: 'admin',
      secretKey: 'admin'
    });
    
    await adminUser.save();
    
    console.log('Admin user created successfully');
    console.log('=== ADMIN CREDENTIALS ===');
    console.log('Email: admin@textlaire.com');
    console.log('Password: admin123');
    console.log('Secret Key: admin');
    console.log('=========================');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating/resetting admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
