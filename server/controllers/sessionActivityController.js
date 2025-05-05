import UserSession from '../models/UserSession.js';
import APIRequest from '../models/APIRequest.js';
import PageView from '../models/PageView.js';

/**
 * Get activity data for a specific session
 * This endpoint returns page views, API calls, and activity log for a session
 */
export const getSessionActivity = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Find the session
    const session = await UserSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Get page views for this session
    let pageViews = 0;
    try {
      const pageViewCount = await PageView.countDocuments({ sessionId });
      pageViews = pageViewCount;
      console.log(`Found ${pageViewCount} page views for session ${sessionId}`);
    } catch (err) {
      console.error('Error counting page views:', err);
      // Fallback to session data
      pageViews = session.pageViews || 0;
      console.log(`Using fallback page views count: ${pageViews}`);
    }
    
    // Get API calls for this session
    let apiCalls = 0;
    try {
      const apiCallCount = await APIRequest.countDocuments({ sessionId });
      apiCalls = apiCallCount;
      console.log(`Found ${apiCallCount} API calls for session ${sessionId}`);
    } catch (err) {
      console.error('Error counting API calls:', err);
      // Fallback to session data
      apiCalls = session.apiCalls || 0;
      console.log(`Using fallback API calls count: ${apiCalls}`);
    }
    
    // Get activity log from session
    const activityLog = session.activityLog || [];
    
    // Return the activity data
    res.status(200).json({
      success: true,
      activity: {
        pageViews,
        apiCalls,
        activityLog,
        sessionId: session.sessionId,
        userId: session.userId,
        loginTime: session.loginTime,
        lastActiveTime: session.lastActiveTime || session.loginTime
      }
    });
  } catch (error) {
    console.error('Get session activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export default {
  getSessionActivity
};
