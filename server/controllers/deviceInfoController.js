import UserSession from '../models/UserSession.js';

/**
 * Update device information for a user's session
 * This endpoint receives device information from the client-side detector
 */
export const updateDeviceInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessionId = req.user.sessionId;
    
    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and session ID are required'
      });
    }
    
    // Extract device information from request body
    const {
      deviceType,
      browser,
      os,
      vendor,
      model,
      screenWidth,
      screenHeight,
      userAgent,
      isAndroid,
      isIOS,
      orientation
    } = req.body;
    
    console.log('Received client device info:', {
      deviceType,
      browser,
      os,
      model: model || 'Unknown',
      vendor: vendor || 'Unknown',
      screenSize: `${screenWidth}x${screenHeight}`
    });
    
    // Set a custom header for future requests from this client
    // This will help server-side detection be more accurate
    res.setHeader('X-Client-Device-Type', deviceType);
    
    // Format device type with more details
    let enhancedDeviceType = deviceType === 'mobile' ? 'Mobile' : (deviceType === 'tablet' ? 'Tablet' : 'Desktop');
    
    // Add specific OS information if available
    if (isAndroid) {
      enhancedDeviceType = 'Mobile (Android)';
    } else if (isIOS) {
      enhancedDeviceType = 'Mobile (iOS)';
    }
    
    // Find and update the user's session with the detailed device information
    const updatedSession = await UserSession.findOneAndUpdate(
      { userId, sessionId, isActive: true },
      {
        $set: {
          'deviceInfo.browser': browser || 'Unknown',
          'deviceInfo.os': os || 'Unknown',
          'deviceInfo.device': enhancedDeviceType,
          'deviceInfo.brand': vendor || undefined,
          'deviceInfo.model': model || undefined,
          'deviceInfo.orientation': orientation || undefined,
          'deviceInfo.screenResolution': screenWidth && screenHeight ? `${screenWidth}x${screenHeight}` : undefined,
          'deviceInfo.clientReportedInfo': {
            deviceType,
            browser,
            os,
            vendor,
            model,
            screenWidth,
            screenHeight,
            isAndroid,
            isIOS,
            orientation,
            detectedAt: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (!updatedSession) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or no longer active'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Device information updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating device information:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating device information',
      error: error.message
    });
  }
};

export default {
  updateDeviceInfo
};
