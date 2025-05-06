import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import DeviceDetector from 'device-detector-js';
import User from '../models/User.js';
import UserSession from '../models/UserSession.js';
import { io, userSockets } from '../server.js';

// Initialize the device detector
const deviceDetector = new DeviceDetector();

// Helper function to extract device info from request
const getDeviceInfo = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  console.log('User Agent:', userAgent); // Log user agent for debugging
  
  // Log all request headers for debugging IP issues
  console.log('Request headers:', req.headers);
  
  // Try to get the correct client IP address using headers
  // Order of preference: x-forwarded-for, x-real-ip, remote IP from connection
  let ipAddress = req.headers['x-forwarded-for'] || 
                 req.headers['x-real-ip'] || 
                 req.ip || 
                 req.connection.remoteAddress || '';
  
  console.log('Raw IP Address:', ipAddress);
  
  // If the IP contains a comma (multiple IPs), take the first one which is usually the client's real IP
  if (ipAddress && ipAddress.includes(',')) {
    ipAddress = ipAddress.split(',')[0].trim();
  }
  
  // Check for origin header that might have the actual client address
  const origin = req.headers['origin'] || req.headers['referer'] || '';
  console.log('Origin/Referer:', origin);
  
  // Extract network IP from origin if present (e.g., http://192.168.239.127:5173)
  let networkIpFromOrigin = null;
  if (origin) {
    try {
      const url = new URL(origin);
      if (url.hostname && !url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
        networkIpFromOrigin = url.hostname;
        console.log('Network IP from origin:', networkIpFromOrigin);
      }
    } catch (e) {
      console.error('Error parsing origin URL:', e);
    }
  }
  
  // Handle localhost and IPv6 formatted addresses
  if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1' || ipAddress === '127.0.0.1') {
    // If we have a network IP from origin, use that instead of localhost
    if (networkIpFromOrigin) {
      ipAddress = networkIpFromOrigin;
    } else {
      // Check if we have a real IP in other headers that might be more accurate
      const possibleRealIP = req.headers['x-forwarded-for'] || req.headers['x-original-forwarded-for'] || '';
      if (possibleRealIP && !possibleRealIP.includes('127.0.0.1') && !possibleRealIP.includes('::1')) {
        ipAddress = possibleRealIP.split(',')[0].trim();
      } else {
        ipAddress = 'localhost (127.0.0.1)';
      }
    }
  } else if (ipAddress.startsWith('::ffff:')) {
    // Convert IPv6-mapped IPv4 address to just the IPv4 part
    ipAddress = ipAddress.substring(7);
  }
  
  // Use device-detector-js for accurate device detection
  const device = deviceDetector.parse(userAgent);
  console.log('Device Detection Result:', device);
  
  // Direct user agent checks for mobile detection
  const containsAndroid = userAgent.includes('Android');
  const containsIOS = userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod');
  const containsMobile = userAgent.includes('Mobile') || userAgent.includes('mobile');
  
  // Log our direct checks
  console.log('Direct UA checks:', { containsAndroid, containsIOS, containsMobile });
  
  // If user agent directly indicates mobile OS, prioritize that over other detection
  const isDefinitelyMobile = containsAndroid || containsIOS || (containsMobile && !userAgent.includes('Chrome'));
  
  // Extract browser information
  let browser = 'Unknown';
  if (device.client && device.client.name) {
    browser = device.client.name;
    if (device.client.version) {
      browser += ` ${device.client.version}`;
    }
  }
  
  // Extract OS information
  let os = 'Unknown';
  if (device.os && device.os.name) {
    os = device.os.name;
    if (device.os.version) {
      os += ` ${device.os.version}`;
    }
  }
  
  // Check if connecting through a private network IP
  const isPrivateNetworkIP = ipAddress.startsWith('192.168.') || 
                            ipAddress.startsWith('10.') || 
                            /^172\.(1[6-9]|2[0-9]|3[0-1])/.test(ipAddress);
  console.log('Connecting through private network:', isPrivateNetworkIP);
  
  // Fix IP if it has duplicate Network Device tags
  if (ipAddress.includes('(Network Device)')) {
    // Remove all occurrences and add just one
    ipAddress = ipAddress.replace(/\(Network Device\)/g, '');
    ipAddress = `${ipAddress}(Network Device)`;
  }
  
  // Check if the IP already contains a Network Device tag to avoid duplication
  const hasNetworkDeviceTag = ipAddress.includes('(Network Device)');
  
  // PRIORITY MOBILE DETECTION: If direct user agent check indicates mobile, override everything
  let deviceType;
  if (isDefinitelyMobile) {
    console.log('Direct user agent check indicates mobile device, overriding other detection');
    deviceType = 'Mobile';
    
    if (isPrivateNetworkIP && ipAddress !== 'localhost (127.0.0.1)') {
      deviceType = 'Mobile (Hotspot)';
    }
  }
  // Otherwise use device-detector results
  else if (device.device && device.device.type) {
    // Map the device type from the detector to our simplified categories
    switch(device.device.type) {
      case 'smartphone':
      case 'feature phone':
      case 'phablet':
        deviceType = 'Mobile';
        break;
      case 'tablet':
        deviceType = 'Tablet';
        break;
      case 'console':
      case 'portable media player':
      case 'car browser':
        deviceType = 'Mobile Device';
        break;
      case 'tv':
      case 'smart display':
        deviceType = 'Smart TV';
        break;
      case 'desktop':
      default:
        deviceType = 'Desktop';
    }
    
    // Additional mobile detection check based on user agent
    const mobileUserAgentPatterns = [
      'Android', 'webOS', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 'IEMobile', 
      'Opera Mini', 'Mobile', 'mobile', 'CriOS', 'Silk/', 'Phone'
    ];
    
    // Override to Mobile if device type is Desktop but user agent contains mobile patterns
    if (deviceType === 'Desktop' && 
        mobileUserAgentPatterns.some(pattern => userAgent.includes(pattern))) {
      console.log('User agent contains mobile patterns, overriding device type to Mobile');
      deviceType = 'Mobile';
    }
    
    // Add network information for non-localhost IPs
    if (isPrivateNetworkIP && ipAddress !== 'localhost (127.0.0.1)') {
      if (deviceType === 'Mobile' || deviceType === 'Tablet' || deviceType === 'Mobile Device') {
        deviceType = 'Mobile (Hotspot)';
      } else if (deviceType === 'Desktop' && !hasNetworkDeviceTag) {
        // Add network indicator to the IP address for desktop devices (but only if not already there)
        ipAddress = `${ipAddress}(Network Device)`;
      }
    }
  } else {
    // Fallback detection based on user agent if device-detector-js fails
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    const isMobileUserAgent = mobileRegex.test(userAgent);
    
    if (isMobileUserAgent) {
      deviceType = 'Mobile';
      if (isPrivateNetworkIP && ipAddress !== 'localhost (127.0.0.1)') {
        deviceType = 'Mobile (Hotspot)';
      }
    } else {
      deviceType = 'Desktop';
      // Add network indicator for desktop on private networks (if not already there)
      if (isPrivateNetworkIP && ipAddress !== 'localhost (127.0.0.1)' && !hasNetworkDeviceTag) {
        ipAddress = `${ipAddress}(Network Device)`;
      }
    }
  }
  
  // If client sent explicit device information, use it as a hint
  const clientDeviceType = req.headers['x-client-device-type'];
  if (clientDeviceType) {
    console.log('Client reported device type:', clientDeviceType);
    // Override detection if the client explicitly reports being mobile or desktop
    if (clientDeviceType === 'mobile' && deviceType === 'Desktop') {
      deviceType = 'Mobile';
      if (isPrivateNetworkIP && ipAddress !== 'localhost (127.0.0.1)') {
        deviceType = 'Mobile (Hotspot)';
      }
    } else if (clientDeviceType === 'desktop' && deviceType !== 'Desktop') {
      deviceType = 'Desktop';
      if (isPrivateNetworkIP && ipAddress !== 'localhost (127.0.0.1)' && !hasNetworkDeviceTag) {
        ipAddress = `${ipAddress}(Network Device)`;
      }
    }
  }
  
  // Log final device info for debugging
  const deviceInfo = {
    ipAddress,
    browser,
    os,
    device: deviceType,
    // Add brand and model if available
    brand: device.device?.brand || undefined,
    model: device.device?.model || undefined
  };
  console.log('Device info:', deviceInfo);
  
  return deviceInfo;
};

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: role || 'employee' // Default to employee if not specified
    });

    await newUser.save();

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password, secretKey } = req.body;

    // Find user
    const user = await User.findOne({ email });
    console.log('User found:', user ? { email: user.email, role: user.role } : 'No user found');
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check password
    console.log('Comparing password...');
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check secret key for admin logins
    if (user.role === 'admin') {
      console.log('Admin login attempt with secret key:', secretKey);
      console.log('Admin user secret key in DB:', user.secretKey);
      
      // Validate secret key for admin login
      if (!secretKey) {
        return res.status(401).json({ 
          success: false,
          message: "Secret key required for admin login" 
        });
      }
      
      // Verify the secret key matches
      if (secretKey !== user.secretKey) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid secret key" 
        });
      }
    }

    // Generate session ID
    const sessionId = uuidv4();
    
    // Get user agent and IP information
    const deviceInfo = getDeviceInfo(req);
    
    // Additional client IP check for mobile devices connected via local network
    // First check if we're on a local network IP that should be preserved
    const localNetworkIpMatch = deviceInfo.ipAddress.match(/^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))/);
    if (localNetworkIpMatch) {
      console.log('Detected local network IP:', deviceInfo.ipAddress);
    }

    // Create token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role,
        sessionId
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Update user login status
    user.isLoggedIn = true;
    user.lastLogin = new Date();
    user.currentSession = {
      sessionId,
      deviceInfo,
      loginTime: new Date()
    };
    await user.save();

    // Check for existing active sessions for this user from the same device
    // Auto-close existing sessions from the same device/IP
    await UserSession.updateMany(
      { 
        userId: user._id, 
        logoutTime: { $exists: false },
        'deviceInfo.ipAddress': deviceInfo.ipAddress,
        'deviceInfo.browser': deviceInfo.browser,
        'deviceInfo.device': deviceInfo.device
      },
      { 
        $set: { 
          logoutTime: new Date(),
          forcedLogout: false,
          sessionNotes: 'Automatically closed due to new login from same device'
        } 
      }
    );
    
    // Create new session and save to DB
    const session = new UserSession({
      sessionId,
      userId: user._id,
      loginTime: new Date(),
      deviceInfo,
      isActive: true  // Explicitly mark as active
    });
    
    await session.save();
    
    // Log session creation
    console.log(`Created new active session for user ${user.email} on ${deviceInfo.device} (${deviceInfo.ipAddress})`);
    
    // Emit event for real-time session updates to admin users
    try {
      // Populate the session with user data for the event
      const populatedSession = await UserSession.findById(session._id).populate('userId', 'name email role');
      
      if (populatedSession) {
        // Format the session for display
        const formattedSession = populatedSession.toObject();
        if (formattedSession.loginTime) {
          const loginDate = new Date(formattedSession.loginTime);
          formattedSession.formattedLoginTime = loginDate.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true 
          });
        }
        
        // Get all active sessions after this new login
        const activeSessions = await UserSession.find({
          $or: [
            { logoutTime: { $exists: false } },
            { isActive: true }
          ]
        }).populate('userId', 'name email role').sort({ loginTime: -1 });
        
        // Format all sessions
        const formattedSessions = activeSessions.map(session => {
          const formatted = session.toObject();
          if (formatted.loginTime) {
            const loginDate = new Date(formatted.loginTime);
            formatted.formattedLoginTime = loginDate.toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: 'numeric', 
              minute: 'numeric',
              hour12: true 
            });
          }
          return formatted;
        });
        
        // Emit to admin channel
        io.to('admin-session-updates').emit('active_sessions_updated', {
          success: true,
          count: formattedSessions.length,
          sessions: formattedSessions,
          message: `New login: ${user.email} on ${deviceInfo.device}`,
          timestamp: new Date()
        });
        
        console.log('Emitted real-time session update for new login');
      }
    } catch (err) {
      console.error('Error emitting session update event:', err);
    }

    // Return user info and token
    res.status(200).json({
      success: true,
      token,
      sessionId, // Include sessionId for socket connection
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    const { userId, sessionId } = req.user;

    // Update user login status
    const user = await User.findById(userId);
    if (user) {
      user.isLoggedIn = false;
      user.lastLogout = new Date();
      
      // Add to login history
      if (user.currentSession && user.currentSession.sessionId === sessionId) {
        user.loginHistory.push({
          loginTime: user.currentSession.loginTime,
          logoutTime: new Date(),
          deviceInfo: user.currentSession.deviceInfo
        });
        user.currentSession = null;
      }
      
      await user.save();
    }

    // Update session - IMPORTANT: Set isActive to false to ensure it doesn't show in active sessions
    const updatedSession = await UserSession.findOneAndUpdate(
      { sessionId },
      { 
        isActive: false,
        logoutTime: new Date()
      },
      { new: true }
    ).populate('userId', 'name email role');
    
    console.log(`User ${req.user.userId} logged out. Session ${sessionId} marked as inactive.`);
    
    // Emit event for real-time session updates to admin users
    try {
      if (updatedSession) {
        // Get all potentially active sessions after this logout
        // Use the same query pattern as getActiveSessions
        const activeSessions = await UserSession.find({
          $or: [
            // Sessions explicitly marked as active
            { isActive: true },
            // Sessions without a logout time
            { logoutTime: { $exists: false } }
          ]
        }).populate('userId', 'name email role').sort({ loginTime: -1 });
        
        // Format all sessions
        const formattedSessions = activeSessions.map(session => {
          const formatted = session.toObject();
          if (formatted.loginTime) {
            const loginDate = new Date(formatted.loginTime);
            formatted.formattedLoginTime = loginDate.toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: 'numeric', 
              minute: 'numeric',
              hour12: true 
            });
          }
          
          // Add duration
          if (formatted.loginTime) {
            const loginTime = new Date(formatted.loginTime);
            const now = new Date();
            const durationMs = now - loginTime;
            const durationMinutes = Math.floor(durationMs / 60000);
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            formatted.formattedDuration = `${hours}h ${minutes}m`;
          }
          
          return formatted;
        });
        
        // Emit to admin channel for real-time updates
        io.to('admin-session-updates').emit('active_sessions_updated', {
          success: true,
          count: formattedSessions.length,
          sessions: formattedSessions,
          message: `User logged out: ${updatedSession.userId?.email || 'Unknown user'}`,
          timestamp: new Date()
        });
        
        // Also emit session history update
        io.to('admin-session-updates').emit('session_history_updated', {
          success: true,
          message: 'Session history updated due to logout',
          timestamp: new Date()
        });
        
        console.log('Emitted real-time session update for logout');
      }
    } catch (err) {
      console.error('Error emitting session update event for logout:', err);
    }

    res.status(200).json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Admin: Get active sessions
export const getActiveSessions = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: Admin privileges required' 
      });
    }

    console.log('Fetching active sessions...');

    // Get all sessions that are potentially active
    // Use a more inclusive query to find active sessions
    const dbActiveSessions = await UserSession.find({
      $or: [
        // Sessions explicitly marked as active
        { isActive: true },
        // Sessions without a logout time
        { logoutTime: { $exists: false } }
      ]
    })
      .populate('userId', 'name email role')
      .sort({ loginTime: -1 });

    console.log(`Found ${dbActiveSessions.length} potentially active sessions in database`);
    
    // For debugging purposes, log the active sessions
    dbActiveSessions.forEach(session => {
      if (session.userId) {
        console.log(`Session: ${session.sessionId}, User: ${session.userId.email}, Device: ${session.deviceInfo?.device}, IP: ${session.deviceInfo?.ipAddress}, Active: ${session.isActive}, Logout Time: ${session.logoutTime ? 'Yes' : 'No'}`);
      }
    });
    
    // Filter sessions to keep only those with valid user info
    const validSessions = dbActiveSessions.filter(session => {
      return session.userId && session.userId._id;
    });
    
    // Create a Map to store unique user-device-IP combinations
    // We'll keep only the most recent session for each unique combination
    const uniqueSessionsMap = new Map();
    
    validSessions.forEach(session => {
      // Skip sessions without userId (should never happen due to filter above)
      if (!session.userId || !session.userId._id) return;
      
      // Create a unique key based on user ID, device type, and IP address
      const userId = session.userId._id.toString();
      const deviceType = session.deviceInfo?.device || 'Unknown';
      const ipAddress = session.deviceInfo?.ipAddress || 'Unknown';
      
      // Clean up localhost and ::1 to be considered the same
      const normalizedIp = ipAddress === '::1' || ipAddress.includes('127.0.0.1') ? 'localhost' : ipAddress;
      
      // Create a composite key that uniquely identifies this user-device-IP combination
      const key = `${userId}-${deviceType}-${normalizedIp}`;
      
      // If this combination isn't in the map yet, or if this session is more recent,
      // update the map with this session
      if (!uniqueSessionsMap.has(key) || 
          new Date(session.loginTime) > new Date(uniqueSessionsMap.get(key).loginTime)) {
        uniqueSessionsMap.set(key, session);
      }
      
      // Also mark older sessions as inactive in the database
      if (uniqueSessionsMap.has(key) && 
          session._id.toString() !== uniqueSessionsMap.get(key)._id.toString() &&
          new Date(session.loginTime) < new Date(uniqueSessionsMap.get(key).loginTime)) {
        // This is an older session for the same user-device-IP combo, mark it as inactive immediately
        UserSession.updateOne(
          { _id: session._id },
          { isActive: false, logoutTime: new Date() }
        ).then(() => {
          console.log(`Marked older session ${session._id} as inactive`);
        }).catch(err => {
          console.error('Error marking older session as inactive:', err);
        });
      }
    });
    
    // Convert the map values back to an array
    const uniqueSessions = Array.from(uniqueSessionsMap.values());
    
    // Log the unique sessions count after de-duplication
    console.log(`After de-duplication: ${uniqueSessions.length} unique active sessions`);
    
    // Sort by login time (most recent first)
    uniqueSessions.sort((a, b) => new Date(b.loginTime) - new Date(a.loginTime));

    // Format dates in AM/PM format and calculate duration
    const formattedSessions = uniqueSessions.map(session => {
      // Create a new object with all the original properties
      const formattedSession = JSON.parse(JSON.stringify(session));
      
      // Format the loginTime in AM/PM format
      if (formattedSession.loginTime) {
        const loginDate = new Date(formattedSession.loginTime);
        formattedSession.formattedLoginTime = loginDate.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric', 
          minute: 'numeric',
          hour12: true 
        });
        
        // Calculate and add duration
        const now = new Date();
        const durationMs = now - loginDate;
        const durationMinutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        formattedSession.formattedDuration = `${hours}h ${minutes}m`;
      }
      
      // Prioritize client-reported device information if available
      if (formattedSession.deviceInfo && formattedSession.deviceInfo.clientReportedInfo) {
        const clientInfo = formattedSession.deviceInfo.clientReportedInfo;
        
        // Override device info with client-reported values
        if (clientInfo.deviceType === 'mobile') {
          // For mobile devices on private networks
          if (formattedSession.deviceInfo.ipAddress && 
             (formattedSession.deviceInfo.ipAddress.includes('192.168.') || 
              formattedSession.deviceInfo.ipAddress.includes('10.') ||
              /^172\.(1[6-9]|2[0-9]|3[0-1])/.test(formattedSession.deviceInfo.ipAddress))) {
            formattedSession.deviceInfo.device = 'Mobile (Hotspot)';
          } else {
            formattedSession.deviceInfo.device = 'Mobile';
          }
          
          // Add OS-specific information if available
          if (clientInfo.isAndroid) {
            formattedSession.deviceInfo.device = 'Mobile (Android)';
          } else if (clientInfo.isIOS) {
            formattedSession.deviceInfo.device = 'Mobile (iOS)';
          }
        } else if (clientInfo.deviceType === 'tablet') {
          formattedSession.deviceInfo.device = 'Tablet';
        } else if (clientInfo.deviceType === 'desktop') {
          formattedSession.deviceInfo.device = 'Desktop';
        }
        
        // Update browser and OS information if available
        if (clientInfo.browser) {
          formattedSession.deviceInfo.browser = clientInfo.browser;
        }
        
        if (clientInfo.os) {
          formattedSession.deviceInfo.os = clientInfo.os;
        }
        
        // Add model information if available
        if (clientInfo.model) {
          formattedSession.deviceInfo.model = clientInfo.model;
        }
        
        console.log(`Session ${formattedSession.sessionId} - Updated device info from client:`, {
          originalDevice: session.deviceInfo.device,
          updatedDevice: formattedSession.deviceInfo.device,
          clientReportedType: clientInfo.deviceType
        });
      }
      
      return formattedSession;
    });

    res.status(200).json({
      success: true,
      count: formattedSessions.length,
      sessions: formattedSessions
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Admin: Force logout a user session
export const forceLogout = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: Admin privileges required' 
      });
    }

    const { sessionId } = req.params;
    
    // Find session
    const session = await UserSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ 
        success: false,
        message: 'Session not found' 
      });
    }

    // Update user login status
    const user = await User.findById(session.userId);
    if (user) {
      if (user.currentSession && user.currentSession.sessionId === sessionId) {
        user.isLoggedIn = false;
        user.lastLogout = new Date();
        
        // Add to login history
        user.loginHistory.push({
          loginTime: user.currentSession.loginTime,
          logoutTime: new Date(),
          deviceInfo: user.currentSession.deviceInfo
        });
        user.currentSession = null;
        
        await user.save();
        
        // Emit force_logout event to all of the user's connected sockets
        if (userSockets.has(user._id.toString())) {
          const userSocketIds = userSockets.get(user._id.toString());
          
          // Emit force_logout event to all of the user's connected sockets
          userSocketIds.forEach(socketId => {
            console.log(`Attempting to send force logout to socket ${socketId} for user ${user._id}`);
            
            try {
              io.to(socketId).emit('force_logout', {
                message: 'Your session has been terminated by an administrator',
                sessionId
              });
              
              console.log(`Force logout notification sent to socket ${socketId} for user ${user._id}`);
            } catch (socketError) {
              console.error(`Error sending force logout to socket ${socketId}:`, socketError);
            }
          });
        } else {
          console.log(`No active sockets found for user ${user._id}`);
        }
        
        // Also try broadcasting to user-specific room
        try {
          io.to(`user-${user._id.toString()}`).emit('force_logout', {
            message: 'Your session has been terminated by an administrator',
            sessionId
          });
          console.log(`Force logout also sent to user room: user-${user._id.toString()}`);
        } catch (roomError) {
          console.error(`Error broadcasting to user room:`, roomError);
        }
      }
    }

    // Update session
    session.isActive = false;
    session.logoutTime = new Date();
    session.forcedLogout = true; // Mark as forced logout for tracking
    await session.save();
    
    // Get all potentially active sessions after this force logout
    // Use the same query pattern as getActiveSessions
    const activeSessions = await UserSession.find({
      $or: [
        // Sessions explicitly marked as active
        { isActive: true },
        // Sessions without a logout time
        { logoutTime: { $exists: false } }
      ]
    }).populate('userId', 'name email role').sort({ loginTime: -1 });
    
    // Format all sessions
    const formattedSessions = activeSessions.map(session => {
      const formatted = session.toObject();
      if (formatted.loginTime) {
        const loginDate = new Date(formatted.loginTime);
        formatted.formattedLoginTime = loginDate.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric', 
          minute: 'numeric',
          hour12: true 
        });
        
        // Calculate and add duration
        const now = new Date();
        const durationMs = now - loginDate;
        const durationMinutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        formatted.formattedDuration = `${hours}h ${minutes}m`;
      }
      
      return formatted;
    });
    
    // Emit active sessions update
    io.to('admin-session-updates').emit('active_sessions_updated', {
      success: true,
      count: formattedSessions.length,
      sessions: formattedSessions,
      message: `User force logged out: ${user?.email || 'Unknown user'}`,
      timestamp: new Date()
    });
    
    // Emit event for real-time session updates
    io.to('admin-session-updates').emit('user_logged_out', {
      userId: session.userId.toString(),
      sessionId: sessionId,
      timestamp: new Date()
    });
    
    // Try targeted broadcast to user-specific room first
    try {
      console.log(`Broadcasting targeted force logout to user-${session.userId.toString()}`);
      
      io.to(`user-${session.userId.toString()}`).emit('global_force_logout', {
        userId: session.userId.toString(),
        sessionId: sessionId,
        message: 'Your session has been terminated by an administrator'
      });
      
      console.log(`Targeted force logout sent to user-${session.userId.toString()}`);
    } catch (roomError) {
      console.error(`Error broadcasting to user room:`, roomError);
    }
    
    // Broadcast a global force logout event as backup
    try {
      console.log(`Broadcasting global force logout for user ${session.userId}`);
      
      io.emit('global_force_logout', {
        userId: session.userId.toString(),
        sessionId: sessionId,
        message: 'Your session has been terminated by an administrator'
      });
      
      console.log(`Global force logout broadcast sent`);
    } catch (broadcastError) {
      console.error(`Error broadcasting global force logout:`, broadcastError);
    }

    res.status(200).json({ 
      success: true,
      message: 'User session terminated successfully' 
    });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Admin: Get session history
export const getSessionHistory = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: Admin privileges required' 
      });
    }

    // Get query params for filtering
    const { startDate, endDate, userId, userEmail, ipAddress, deviceType, status } = req.query;
    
    // Build query
    const query = {};
    
    if (startDate && endDate) {
      query.loginTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.loginTime = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.loginTime = { $lte: new Date(endDate) };
    }
    
    // Handle userId - first check if we need to find the user by email or name
    if (userEmail) {
      // Find user by email
      const user = await User.findOne({ email: { $regex: userEmail, $options: 'i' } });
      if (user) {
        query.userId = user._id;
      } else {
        // If no user found with this email, return empty result
        return res.status(200).json({
          success: true,
          count: 0,
          sessions: []
        });
      }
    } else if (userId) {
      // Try to find user by name or ID
      try {
        // First check if it's a valid ObjectId
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
        
        if (isValidObjectId) {
          // It's a valid ObjectId, use it directly
          query.userId = userId;
        } else {
          // It's not an ObjectId, search by name
          const user = await User.findOne({ name: { $regex: userId, $options: 'i' } });
          if (user) {
            query.userId = user._id;
          } else {
            // If no user found with this name, return empty result
            return res.status(200).json({
              success: true,
              count: 0,
              sessions: []
            });
          }
        }
      } catch (err) {
        console.error('Error processing userId filter:', err);
        // Continue without this filter if there's an error
      }
    }
    
    // IP Address filter
    if (ipAddress) {
      query['deviceInfo.ipAddress'] = { $regex: ipAddress, $options: 'i' };
    }
    
    // Device type filter
    if (deviceType) {
      query['deviceInfo.device'] = { $regex: deviceType, $options: 'i' };
    }
    
    // Session status filter
    if (status) {
      if (status === 'active') {
        query.$and = [
          { isActive: true },
          { logoutTime: { $exists: false } }
        ];
      } else if (status === 'ended') {
        query.logoutTime = { $exists: true };
      } else if (status === 'forced') {
        query.forcedLogout = true;
      }
    }

    // Get session history
    const sessions = await UserSession.find(query)
      .populate('userId', 'name email role')
      .sort({ loginTime: -1 });

    // Format dates in AM/PM format and enhance device information
    const formattedSessions = sessions.map(session => {
      // Create a new object with all the original properties
      const formattedSession = JSON.parse(JSON.stringify(session));
      
      // Format the loginTime in AM/PM format
      if (formattedSession.loginTime) {
        const loginDate = new Date(formattedSession.loginTime);
        formattedSession.formattedLoginTime = loginDate.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric', 
          minute: 'numeric',
          hour12: true 
        });
      }
      
      // Format the logoutTime in AM/PM format if it exists
      if (formattedSession.logoutTime) {
        const logoutDate = new Date(formattedSession.logoutTime);
        formattedSession.formattedLogoutTime = logoutDate.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric', 
          minute: 'numeric',
          hour12: true 
        });
        
        // Calculate session duration
        if (formattedSession.loginTime) {
          const loginDate = new Date(formattedSession.loginTime);
          const durationMs = logoutDate - loginDate;
          const durationMinutes = Math.floor(durationMs / 60000);
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          formattedSession.formattedDuration = `${hours}h ${minutes}m`;
        }
      } else if (formattedSession.loginTime) {
        // For active sessions, calculate duration from login time to now
        const loginDate = new Date(formattedSession.loginTime);
        const now = new Date();
        const durationMs = now - loginDate;
        const durationMinutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        formattedSession.formattedDuration = `${hours}h ${minutes}m`;
      }
      
      // Enhance device information with client-reported data if available
      if (formattedSession.deviceInfo && formattedSession.deviceInfo.clientReportedInfo) {
        const clientInfo = formattedSession.deviceInfo.clientReportedInfo;
        
        // Override device info with client-reported values
        if (clientInfo.deviceType === 'mobile') {
          // For mobile devices on private networks
          if (formattedSession.deviceInfo.ipAddress && 
             (formattedSession.deviceInfo.ipAddress.includes('192.168.') || 
              formattedSession.deviceInfo.ipAddress.includes('10.') ||
              /^172\.(1[6-9]|2[0-9]|3[0-1])/.test(formattedSession.deviceInfo.ipAddress))) {
            formattedSession.deviceInfo.device = 'Mobile (Hotspot)';
          } else {
            formattedSession.deviceInfo.device = 'Mobile';
          }
          
          // Add OS-specific information if available
          if (clientInfo.isAndroid) {
            formattedSession.deviceInfo.device = 'Mobile (Android)';
          } else if (clientInfo.isIOS) {
            formattedSession.deviceInfo.device = 'Mobile (iOS)';
          }
        } else if (clientInfo.deviceType === 'tablet') {
          formattedSession.deviceInfo.device = 'Tablet';
        } else if (clientInfo.deviceType === 'desktop') {
          formattedSession.deviceInfo.device = 'Desktop';
        }
        
        // Update browser and OS information if available
        if (clientInfo.browser) {
          formattedSession.deviceInfo.browser = clientInfo.browser;
        }
        
        if (clientInfo.os) {
          formattedSession.deviceInfo.os = clientInfo.os;
        }
        
        // Add model information if available
        if (clientInfo.model) {
          formattedSession.deviceInfo.model = clientInfo.model;
        }
      }
      
      return formattedSession;
    });

    res.status(200).json({
      success: true,
      count: formattedSessions.length,
      sessions: formattedSessions
    });
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get user activity stats
export const getUserActivityStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: Admin privileges required' 
      });
    }

    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get active users count
    const activeUsers = await User.countDocuments({ isLoggedIn: true });
    
    // Get active sessions
    const activeSessions = await UserSession.countDocuments({ isActive: true });
    
    // Get sessions in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sessionsLast24Hours = await UserSession.countDocuments({
      loginTime: { $gte: oneDayAgo }
    });
    
    // Get sessions in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sessionsLast7Days = await UserSession.countDocuments({
      loginTime: { $gte: sevenDaysAgo }
    });

    // Get user role distribution
    const adminCount = await User.countDocuments({ role: 'admin' });
    const employeeCount = await User.countDocuments({ role: 'employee' });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        activeSessions,
        sessionsLast24Hours,
        sessionsLast7Days,
        userRoles: {
          admin: adminCount,
          employee: employeeCount
        }
      }
    });
  } catch (error) {
    console.error('Get user activity stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};
