import axios from 'axios';

// Get network info for the current user's session
export const getNetworkInfo = async (req, res) => {
  try {
    console.log('Headers:', JSON.stringify(req.headers));
    
    // Extract IP address from request
    let ipAddress = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.ip || 
                    req.connection.remoteAddress || '';
    
    console.log('Original IP Address:', ipAddress);
    
    // If the IP contains a comma (multiple IPs), take the first one
    if (ipAddress && ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
    }
    
    // Replace IPv6 localhost with a more readable format
    if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
      ipAddress = '127.0.0.1';
    } else if (ipAddress.startsWith('::ffff:')) {
      // Convert IPv6-mapped IPv4 address to just the IPv4 part
      ipAddress = ipAddress.substring(7);
    }
    
    // Check if we have a real IP in the X-Forwarded-For header that might be the actual client IP
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '';
    if (clientIp && clientIp !== ipAddress && !clientIp.includes('127.0.0.1') && !clientIp.includes('::1')) {
      ipAddress = clientIp.split(',')[0].trim();
    }
    
    console.log('Processed IP Address:', ipAddress);

    // For true localhost, provide mock data, but treat LAN IPs (like 192.168.*.*) as real networks
    const isLocalhost = ipAddress === '127.0.0.1' || ipAddress === 'localhost';
    const isLocalNetwork = /^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))/.test(ipAddress);
    
    if (isLocalhost && !isLocalNetwork) {
      return res.status(200).json({
        success: true,
        networkInfo: {
          ip: '127.0.0.1',
          isp: 'Local Development',
          networkId: 'local-development'
        }
      });
    }

    // For production, we would use an IP geolocation service
    // but for privacy reasons, we'll use simplified info for now
    const networkId = generateNetworkId(ipAddress);
    
    res.status(200).json({
      success: true,
      networkInfo: {
        ip: maskIP(ipAddress),
        isp: detectISP(req.headers['user-agent'] || ''),
        networkId
      }
    });
  } catch (error) {
    console.error('Get network info error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update session with network information
export const updateSessionNetworkInfo = async (req, res) => {
  try {
    const { sessionId, networkInfo } = req.body;
    
    if (!sessionId || !networkInfo) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and network information required'
      });
    }
    
    // Import User Session model dynamically to avoid circular dependencies
    const UserSession = (await import('../models/UserSession.js')).default;
    
    // Find and update the session
    const session = await UserSession.findOneAndUpdate(
      { sessionId },
      { 
        'connectionInfo.connectionType': networkInfo.connectionType || 'unknown',
        'connectionInfo.networkIdentifier': networkInfo.networkIdentifier || '',
        'connectionInfo.isp': networkInfo.isp || 'unknown'
      },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Network information updated successfully'
    });
  } catch (error) {
    console.error('Update session network info error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Utility functions
function maskIP(ip) {
  // Return only first two octets to protect privacy
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  return 'unknown';
}

function detectISP(userAgent) {
  // Simple ISP detection based on user agent
  // In a real application, you would use a proper IP-to-ISP database
  if (userAgent.includes('CorporateProxy')) {
    return 'Corporate Network';
  } else if (userAgent.includes('Mobile')) {
    return 'Mobile Carrier';
  }
  return 'Unknown ISP';
}

function generateNetworkId(ip) {
  // Generate a pseudonymous network ID based on IP
  // This is just a simple example - in production you would use a more robust method
  const parts = ip.split('.');
  if (parts.length === 4) {
    // Use only first two octets for privacy
    return Buffer.from(`net-${parts[0]}-${parts[1]}`).toString('base64').substring(0, 12);
  }
  return 'unknown';
}
