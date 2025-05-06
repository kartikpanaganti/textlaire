import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    default: "employee", // Can be 'admin' or 'employee'
  },
  secretKey: {
    type: String,
    // Temporarily making this optional to restore admin access
    // Will be required again after fixing the issue
    // validate: {
    //   validator: function(v) {
    //     // If role is admin, secretKey is required
    //     return this.role !== 'admin' || (v && v.length > 0);
    //   },
    //   message: 'Secret key is required for admin users'
    // }
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

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
