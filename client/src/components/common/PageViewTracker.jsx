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

      // Send page view data to server
      await axios.post('/api/auth/track/pageview', {
        path,
        title,
        referrer
      }, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      console.log('Page view tracked successfully');
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default PageViewTracker;
