import React, { useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../context/UserProvider';

/**
 * PageViewTracker component that sends page view data to the server
 * This is a silent component that doesn't render anything visible
 */
const PageViewTracker = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useContext(UserContext);

  useEffect(() => {
    // Only track page views if user is authenticated
    if (isAuthenticated && user?.token) {
      trackPageView();
    }
  }, [location.pathname, isAuthenticated, user]);

  const trackPageView = async () => {
    try {
      // Get page title and path
      const path = location.pathname;
      const title = document.title;
      const referrer = document.referrer;

      console.log('📊 TRACKING PAGE VIEW:', { path, title, timestamp: new Date().toISOString() });
      
      // Always enable tracking by default
      localStorage.setItem('textlaire_enable_tracking', 'true');
      
      // Store page view in localStorage for analytics and counting
      try {
        // Get existing page views
        const pageViews = JSON.parse(localStorage.getItem('textlaire_page_views') || '[]');
        
        // Add new page view with more detailed info
        pageViews.push({
          path,
          title,
          timestamp: new Date().toISOString(),
          userId: user?.id || user?._id,
          sessionActive: true
        });
        
        // Keep only the last 20 page views to prevent storage issues
        if (pageViews.length > 20) {
          pageViews.shift();
        }
        
        // Update local counter for UI display purposes
        const currentCount = parseInt(localStorage.getItem('textlaire_page_view_count') || '0');
        localStorage.setItem('textlaire_page_view_count', (currentCount + 1).toString());
        
        // Store updated page views
        localStorage.setItem('textlaire_page_views', JSON.stringify(pageViews));
        
        console.log(`📊 Local page view count updated: ${currentCount + 1}`);
      } catch (storageError) {
        console.warn('Could not store page view in localStorage:', storageError);
      }

      // IMPORTANT: Always try to send tracking data to server
      // Send page view data to server with timeout to prevent long-running requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        console.log('📊 Sending page view to server...');
        
        // Include more detailed information in the tracking request
        const trackingData = {
          path,
          title,
          referrer,
          timestamp: new Date().toISOString(),
          viewId: Math.random().toString(36).substring(2, 15),
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          trackingEnabled: true // Include as part of data instead of header
        };
        
        // Add debug information to request
        console.log('📊 Tracking data:', trackingData);
        console.log('📊 Auth token available:', !!user?.token);
        
        const response = await axios.post('/api/auth/track/pageview', trackingData, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.data.success) {
          console.log('📊 Page view tracked successfully:', response.data);
          
          // Update session data in localStorage if available
          if (response.data.sessionId) {
            localStorage.setItem('textlaire_current_session_id', response.data.sessionId);
          }
          
          if (response.data.pageViewCount) {
            localStorage.setItem('textlaire_server_page_view_count', response.data.pageViewCount.toString());
            console.log(`📊 Server page view count: ${response.data.pageViewCount}`);
          }
        } else {
          console.warn('📊 Page view tracking response not successful:', response.data);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError' || fetchError.code === 'ECONNABORTED') {
          console.warn('📊 Page view tracking request timed out');
        } else {
          console.error('📊 Error sending page view to server:', fetchError);
          console.error('📊 Error details:', fetchError.response?.data || fetchError.message);
        }
      }
    } catch (error) {
      console.error('Error processing page view:', error);
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default PageViewTracker;
