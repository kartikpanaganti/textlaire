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

      console.log('Tracking page view:', { path, title });
      
      // Store page view in localStorage for analytics
      try {
        const pageViews = JSON.parse(localStorage.getItem('textlaire_page_views') || '[]');
        pageViews.push({
          path,
          title,
          timestamp: new Date().toISOString()
        });
        
        // Keep only the last 20 page views to prevent storage issues
        if (pageViews.length > 20) {
          pageViews.shift();
        }
        
        localStorage.setItem('textlaire_page_views', JSON.stringify(pageViews));
      } catch (storageError) {
        console.warn('Could not store page view in localStorage:', storageError);
      }

      // Only try to send to server if explicitly enabled
      // This is a fallback mechanism to avoid 500 errors
      const shouldSendToServer = localStorage.getItem('textlaire_enable_tracking') === 'true';
      
      if (!shouldSendToServer) {
        console.log('Page view tracking disabled, skipping server update');
        return;
      }

      // Send page view data to server with timeout to prevent long-running requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      try {
        const response = await axios.post('/api/auth/track/pageview', {
          path,
          title,
          referrer
        }, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Page view tracked successfully');
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError' || fetchError.code === 'ECONNABORTED') {
          console.warn('Page view tracking request timed out');
        } else {
          console.error('Error sending page view to server:', fetchError.message);
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
