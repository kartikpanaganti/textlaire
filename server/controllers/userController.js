import User from '../models/User.js';
import UserSession from '../models/UserSession.js';

// Search users by name or email for chat functionality
export const searchUsers = async (req, res) => {
  try {
    const searchTerm = req.query.search || '';
    
    if (!searchTerm.trim()) {
      return res.status(200).json([]);
    }

    // Create a regex search pattern (case insensitive)
    const searchPattern = new RegExp(searchTerm, 'i');
    
    // Find users that match the search term (excluding the requesting user)
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.userId } },  // Exclude the current user
        { $or: [
          { name: searchPattern },
          { email: searchPattern }
        ]}
      ]
    }).select('-password -secretKey -loginHistory -currentSession');
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: Admin privileges required' 
      });
    }

    const users = await User.find().select('-password');
    
    // Format lastLogin time in AM/PM format
    const formattedUsers = users.map(user => {
      // Create a new object with all the original properties
      const formattedUser = user.toObject();
      
      // Format the lastLogin in AM/PM format if it exists
      if (formattedUser.lastLogin) {
        const loginDate = new Date(formattedUser.lastLogin);
        formattedUser.formattedLastLogin = loginDate.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric', 
          minute: 'numeric',
          hour12: true 
        });
      } else {
        formattedUser.formattedLastLogin = 'Never';
      }
      
      return formattedUser;
    });
    
    res.status(200).json({
      success: true,
      count: formattedUsers.length,
      users: formattedUsers
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    // Check if user is admin or the user is requesting their own data
    if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Format lastLogin time in AM/PM format
    const formattedUser = user.toObject();
    
    if (formattedUser.lastLogin) {
      const loginDate = new Date(formattedUser.lastLogin);
      formattedUser.formattedLastLogin = loginDate.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric', 
        minute: 'numeric',
        hour12: true 
      });
    } else {
      formattedUser.formattedLastLogin = 'Never';
    }
    
    res.status(200).json({
      success: true,
      user: formattedUser
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Create new user (admin only)
export const createUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: Admin privileges required' 
      });
    }

    const { name, email, password, role, secretKey } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Check if secretKey is provided for admin role
    if (role === 'admin' && !secretKey) {
      return res.status(400).json({
        success: false,
        message: 'Secret key is required for admin users'
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: role || 'employee', // Default to employee if not specified
      secretKey: role === 'admin' ? secretKey : undefined // Only set secretKey for admin users
    });

    await newUser.save();

    // Return user without password
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password;

    res.status(201).json({ 
      success: true,
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, secretKey } = req.body;

    // Check if user is admin or the user is updating their own data
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    // If not admin and trying to change role, deny
    if (req.user.role !== 'admin' && role && role !== req.user.role) {
      return res.status(403).json({ 
        success: false,
        message: 'Cannot change role: Admin privileges required' 
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if changing role to admin and secretKey is not provided
    if (role === 'admin' && user.role !== 'admin' && !secretKey) {
      return res.status(400).json({
        success: false,
        message: 'Secret key is required when changing role to admin'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password; // Will be hashed by pre-save hook
    
    // Handle role and secretKey updates
    if (role && req.user.role === 'admin') {
      // If changing to admin role, require secretKey
      if (role === 'admin') {
        if (secretKey) {
          user.secretKey = secretKey;
        } else if (!user.secretKey) {
          // Only require secretKey if user doesn't already have one
          return res.status(400).json({
            success: false,
            message: 'Secret key is required for admin users'
          });
        }
      }
      user.role = role;
    }

    // Update secretKey if provided (admin only)
    if (secretKey && req.user.role === 'admin' && user.role === 'admin') {
      user.secretKey = secretKey;
    }

    await user.save();

    // Return user without password
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(200).json({ 
      success: true,
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: Admin privileges required' 
      });
    }

    const { id } = req.params;

    // Prevent deleting self
    if (req.user.userId === id) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete your own account' 
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Allow admins to delete other admins, but not themselves
    // This check is already handled above with the 'Cannot delete your own account' check

    // Delete user's sessions
    await UserSession.deleteMany({ userId: id });

    // Delete user
    await User.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Reset user credentials (password and/or secret key)
export const resetUserCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, newSecretKey } = req.body;

    // Check if user is admin or the user is resetting their own credentials
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update password if provided
    if (newPassword) {
      user.password = newPassword; // Will be hashed by pre-save hook
    }

    // Update secret key if provided and user is admin
    if (newSecretKey && user.role === 'admin') {
      // Only admins can update secret keys
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can update secret keys'
        });
      }
      user.secretKey = newSecretKey;
    }

    await user.save();

    res.status(200).json({ 
      success: true,
      message: 'User credentials updated successfully'
    });
  } catch (error) {
    console.error('Reset credentials error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};
