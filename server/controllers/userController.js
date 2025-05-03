import User from '../models/User.js';
import UserSession from '../models/UserSession.js';

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

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: role || 'employee' // Default to employee if not specified
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
    const { name, email, password, role } = req.body;

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

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password; // Will be hashed by pre-save hook
    if (role && req.user.role === 'admin') user.role = role;

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

    // Prevent deleting admin users (only super admin should be able to delete other admins)
    if (user.role === 'admin') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete admin users' 
      });
    }

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
