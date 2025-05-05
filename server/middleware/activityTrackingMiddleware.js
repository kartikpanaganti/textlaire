import UserSession from '../models/UserSession.js';
import APIRequest from '../models/APIRequest.js';
import PageView from '../models/PageView.js';

/**
 * Middleware to track API activity
 * Records API requests to the APIRequest collection and updates the UserSession
 */
export const trackApiActivity = async (req, res, next) => {
  const startTime = Date.now();
  
  // Store the original end method
  const originalEnd = res.end;
  
  // Override the end method to capture response data
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Get user info from the request if authenticated
    const userId = req.user?.userId;
    const sessionId = req.user?.sessionId;
    
    // Only track if we have a user and session ID
    if (userId && sessionId) {
      // Create API request record
      const apiRequest = {
        userId,
        sessionId,
        method: req.method,
        endpoint: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress
      };
      
      // Save API request to database
      try {
        // Create new APIRequest document
        new APIRequest(apiRequest).save()
          .then(() => {
            console.log(`Tracked API request: ${req.method} ${req.originalUrl}`);
          })
          .catch(err => {
            console.error('Error saving API request:', err);
          });
        
        // Update session with API call count
        UserSession.findOneAndUpdate(
          { sessionId, userId },
          { 
            $inc: { apiCalls: 1 },
            $set: { lastActiveTime: new Date() },
            $push: { 
              activityLog: {
                action: 'API Request',
                timestamp: new Date(),
                details: `${req.method} ${req.originalUrl}`,
                resource: 'API'
              }
            }
          },
          { new: true }
        )
          .then(() => {
            console.log(`Updated session ${sessionId} with API call`);
          })
          .catch(err => {
            console.error('Error updating session with API call:', err);
          });
      } catch (err) {
        console.error('Error tracking API activity:', err);
      }
    }
    
    // Call the original end method
    originalEnd.apply(res, arguments);
  };
  
  next();
};

/**
 * Middleware to record page views
 * This should be called from the client-side when a page is viewed
 */
export const recordPageView = async (req, res) => {
  try {
    const { path, title, referrer } = req.body;
    const userId = req.user?.userId;
    const sessionId = req.user?.sessionId;
    
    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and session ID are required'
      });
    }
    
    if (!path) {
      return res.status(400).json({
        success: false,
        message: 'Path is required'
      });
    }
    
    // Create page view record
    const pageView = new PageView({
      userId,
      sessionId,
      path,
      title,
      referrer,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    // Save page view to database
    await pageView.save();
    
    // Update session with page view count and last active time
    await UserSession.findOneAndUpdate(
      { sessionId, userId },
      { 
        $inc: { pageViews: 1 },
        $set: { lastActiveTime: new Date() },
        $push: { 
          activityLog: {
            action: 'Page View',
            timestamp: new Date(),
            details: title || 'Page viewed',
            path
          }
        }
      },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Page view recorded successfully'
    });
  } catch (error) {
    console.error('Error recording page view:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export default {
  trackApiActivity,
  recordPageView
};
