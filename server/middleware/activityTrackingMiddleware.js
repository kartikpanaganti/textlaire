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
    // Extract data from request body with more comprehensive fallbacks
    const { 
      path, 
      title, 
      referrer, 
      timestamp, 
      viewId,
      userAgent: clientUserAgent,
      screenSize
    } = req.body;
    
    // Extract user info with better error handling
    const userId = req.user?.userId;
    const sessionId = req.user?.sessionId;
    
    // Log detailed info for debugging
    console.log(`📊 PAGE VIEW REQUEST: ${path} | Session: ${sessionId} | User: ${userId}`);
    console.log('📊 Page view details:', { path, title, timestamp, viewId });
    console.log('📊 Headers:', req.headers['user-agent'], req.headers['x-tracking-enabled']);
    
    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and session ID are required',
        debug: { userId, sessionId, auth: !!req.user }
      });
    }
    
    if (!path) {
      return res.status(400).json({
        success: false,
        message: 'Path is required'
      });
    }
    
    // Create page view record with enhanced data
    const pageView = new PageView({
      userId,
      sessionId,
      path,
      title,
      referrer,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      userAgent: clientUserAgent || req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      viewId: viewId || `pv_${Math.random().toString(36).substring(2, 15)}`,
      screenSize,
      tracked: true
    });
    
    // Save page view to database
    const savedPageView = await pageView.save();
    console.log(`📊 Page view saved with ID: ${savedPageView._id}`);
    
    // Update session with page view count and last active time
    const updatedSession = await UserSession.findOneAndUpdate(
      { sessionId, userId },
      { 
        $inc: { pageViews: 1 },
        $set: { lastActiveTime: new Date() },
        $push: { 
          activityLog: {
            action: 'Page View',
            timestamp: new Date(),
            details: title || 'Page viewed',
            path,
            viewId: savedPageView.viewId || viewId
          }
        }
      },
      { new: true }
    );
    
    // Verify the update worked
    if (!updatedSession) {
      console.warn(`📊 Session ${sessionId} not found or not updated`);
    } else {
      console.log(`📊 Updated session ${sessionId} page views: ${updatedSession.pageViews}`);
    }
    
    // Get the current page view count for this session
    const pageViewCount = await PageView.countDocuments({ sessionId });
    console.log(`📊 Total page views for session ${sessionId}: ${pageViewCount}`);
    
    // Return detailed response with current counts
    res.status(200).json({
      success: true,
      message: 'Page view recorded successfully',
      sessionId,
      viewId: savedPageView.viewId || viewId,
      pageViewCount,
      timestamp: new Date().toISOString(),
      sessionPageViews: updatedSession?.pageViews || pageViewCount
    });
  } catch (error) {
    console.error('Error recording page view:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export default {
  trackApiActivity,
  recordPageView
};
