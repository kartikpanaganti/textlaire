// Simple script to fix admin login by directly updating the MongoDB database
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// MongoDB connection string - update this with your actual connection string
const uri = "mongodb://localhost:27017/textlaire";

async function resetAdmin() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find admin user
    const adminEmail = "admin@textlaire.com";
    const adminUser = await usersCollection.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log("Admin user found, updating credentials...");
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      
      // Update admin user with new password and secret key
      await usersCollection.updateOne(
        { email: adminEmail },
        { 
          $set: {
            password: hashedPassword,
            secretKey: "admin-secret-key"
          }
        }
      );
      
      console.log("Admin user updated successfully!");
    } else {
      console.log("Admin user not found, creating new admin account...");
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      
      // Create admin user
      await usersCollection.insertOne({
        name: 'System Administrator',
        email: 'admin@textlaire.com',
        password: hashedPassword,
        role: 'admin',
        secretKey: 'admin-secret-key',
        isLoggedIn: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log("Admin user created successfully!");
    }
    
    // Display admin credentials
    console.log("\n=== ADMIN CREDENTIALS ===");
    console.log("Email: admin@textlaire.com");
    console.log("Password: admin123");
    console.log("Secret Key: admin-secret-key");
    console.log("=========================\n");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

resetAdmin().catch(console.error);
