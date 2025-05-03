import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB connection string - replace with your actual MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/textlaire';

// User schema definition (simplified version of your User model)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "employee",
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastLogout: {
    type: Date,
    default: null
  },
  loginHistory: [{
    loginTime: Date,
    logoutTime: Date,
    deviceInfo: {
      ipAddress: String,
      browser: String,
      os: String,
      device: String
    }
  }],
  currentSession: {
    sessionId: String,
    deviceInfo: {
      ipAddress: String,
      browser: String,
      os: String,
      device: String
    },
    loginTime: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Create User model
const User = mongoose.model("User", userSchema);

// Function to create admin user
const createAdminUser = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@textlaire.com' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@textlaire.com',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'admin',
      secretKey: 'admin-secret-key' // Admin's secret key for additional security
    });
    
    await adminUser.save();
    
    console.log('Admin user created successfully');
    console.log('Email: admin@textlaire.com');
    console.log('Password: admin123');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the function
createAdminUser();
