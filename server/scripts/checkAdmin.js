import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// MongoDB connection string - use environment variable or fallback to localhost
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/textlaire";

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

// Define User schema for this script
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  secretKey: String,
  isLoggedIn: Boolean
});

// Add comparePassword method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
};

// Create User model
const User = mongoose.model("User", userSchema);

// Check admin account
const checkAdmin = async () => {
  try {
    // Find admin user
    const adminEmail = "admin@textlaire.com";
    const adminUser = await User.findOne({ email: adminEmail });
    
    console.log("\n=== ADMIN ACCOUNT CHECK ===");
    
    if (adminUser) {
      console.log("Admin account found:");
      console.log("- Email:", adminUser.email);
      console.log("- Role:", adminUser.role);
      console.log("- Secret Key:", adminUser.secretKey ? "Set" : "Not set");
      
      // Test password
      const testPassword = "admin123";
      const passwordMatch = await adminUser.comparePassword(testPassword);
      console.log("- Password 'admin123' matches:", passwordMatch);
      
      // Check if password is hashed properly
      console.log("- Password hash:", adminUser.password.substring(0, 20) + "...");
      
      // Fix admin account if needed
      if (!adminUser.secretKey || !passwordMatch) {
        console.log("\nFixing admin account...");
        
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = !passwordMatch ? await bcrypt.hash("admin123", salt) : adminUser.password;
        
        // Update admin user
        adminUser.password = hashedPassword;
        adminUser.secretKey = adminUser.secretKey || "admin-secret-key";
        
        await adminUser.save();
        console.log("Admin account updated successfully!");
        console.log("- New password:", !passwordMatch ? "admin123" : "unchanged");
        console.log("- New secret key:", adminUser.secretKey);
      }
    } else {
      console.log("Admin account not found. Creating new admin account...");
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      
      // Create admin user
      const newAdmin = new User({
        name: 'System Administrator',
        email: 'admin@textlaire.com',
        password: hashedPassword,
        role: 'admin',
        secretKey: 'admin-secret-key',
        isLoggedIn: false
      });
      
      await newAdmin.save();
      console.log("Admin account created successfully!");
    }
    
    console.log("\n=== ADMIN CREDENTIALS ===");
    console.log("Email: admin@textlaire.com");
    console.log("Password: admin123");
    console.log("Secret Key: admin-secret-key");
    console.log("=========================\n");
    
  } catch (error) {
    console.error("Error checking admin account:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

// Run the script
checkAdmin();
