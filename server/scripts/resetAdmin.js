import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import User from "../models/User.js";

// Load environment variables from the script's directory
dotenv.config({ path: path.join(process.cwd(), 'scripts', '.env.reset') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use the same environment variable as in server.js
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Reset admin account
const resetAdmin = async () => {
  try {
    // Connect to database
    const conn = await connectDB();
    
    console.log("Resetting admin account...");
    
    // Find admin user by email
    const adminEmail = "admin@textlaire.com";
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log("Admin user found, updating credentials...");
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      
      // Update admin user
      adminUser.password = hashedPassword;
      adminUser.secretKey = "admin-secret-key"; // Reset to the default secret key
      
      await adminUser.save();
      console.log("Admin user updated successfully!");
    } else {
      console.log("Admin user not found, creating new admin account...");
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      
      // Create admin user
      adminUser = new User({
        name: 'System Administrator',
        email: 'admin@textlaire.com',
        password: hashedPassword,
        role: 'admin',
        secretKey: 'admin-secret-key' // Admin's secret key for additional security
      });
      
      await adminUser.save();
      console.log("Admin user created successfully!");
    }
    
    // Display admin credentials
    console.log("\n=== ADMIN CREDENTIALS ===");
    console.log("Email: admin@textlaire.com");
    console.log("Password: admin123");
    console.log("Secret Key: admin-secret-key");
    console.log("=========================\n");
    
    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
resetAdmin();
