import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// The admin email and new password
const adminEmail = 'kartik@admin.com';
const newPassword = 'ADMIN@123';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find the admin user
      const adminUser = await User.findOne({ email: adminEmail });
      
      if (!adminUser) {
        console.error(`Admin user with email ${adminEmail} not found`);
        process.exit(1);
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update the password
      adminUser.password = hashedPassword;
      await adminUser.save();
      
      console.log(`Password for ${adminEmail} has been reset successfully`);
      console.log('You can now log in with the new password');
    } catch (error) {
      console.error('Error updating admin password:', error);
    } finally {
      mongoose.disconnect();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
