import React, { useEffect, useContext } from 'react';
import { 
  isMobile, 
  isTablet, 
  isDesktop, 
  browserName, 
  osName, 
  osVersion,
  mobileVendor, 
  mobileModel,
  deviceDetect,
  isIOS,
  isAndroid,
  isMobileSafari,
  isMobileOnly,
  getUA
} from 'react-device-detect';
import { UserContext } from '../../context/UserProvider';

/**
 * DeviceDetector component that sends device information to the server
 * This is a silent component that doesn't render anything visible
 */
const DeviceDetector = () => {
  const { isAuthenticated, user } = useContext(UserContext);

  useEffect(() => {
    // Only send device info if user is authenticated
    if (isAuthenticated && user?.token) {
      // Send immediately on mount
      sendDeviceInfoToServer();
      
      // Also set up a window resize listener to detect orientation changes
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isAuthenticated, user]);
  
  // Debounced resize handler for orientation changes
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Update device info when orientation changes
      sendDeviceInfoToServer();
    }, 1000);
  };
  
  // Get detailed OS information including version
  const getDetailedOsInfo = () => {
    const fullOsInfo = `${osName}${osVersion ? ' ' + osVersion : ''}`;
    
    // Enhance OS detection with more specific details
    if (isAndroid) {
      // Extract Android version from user agent
      const androidMatch = navigator.userAgent.match(/Android\s([0-9.]+)/);
      const androidVersion = androidMatch ? androidMatch[1] : '';
      return `Android ${androidVersion}`;
    }
    
    if (isIOS) {
      // Extract iOS version from user agent
      const iosMatch = navigator.userAgent.match(/OS\s([0-9_]+)/);
      const iosVersion = iosMatch ? iosMatch[1].replace(/_/g, '.') : '';
      return `iOS ${iosVersion}`;
    }
    
    return fullOsInfo;
  };
  
  // Get detailed browser information including version
  const getDetailedBrowserInfo = () => {
    // Extract browser version from user agent
    let browserInfo = browserName;
    
    // Chrome version
    if (browserName === 'Chrome') {
      const chromeMatch = navigator.userAgent.match(/Chrome\/([0-9.]+)/);
      if (chromeMatch) {
        browserInfo += ` ${chromeMatch[1]}`;
      }
    }
    
    // Safari version
    if (browserName === 'Safari') {
      const safariMatch = navigator.userAgent.match(/Version\/([0-9.]+)/);
      if (safariMatch) {
        browserInfo += ` ${safariMatch[1]}`;
      }
    }
    
    // Firefox version
    if (browserName === 'Firefox') {
      const firefoxMatch = navigator.userAgent.match(/Firefox\/([0-9.]+)/);
      if (firefoxMatch) {
        browserInfo += ` ${firefoxMatch[1]}`;
      }
    }
    
    return browserInfo;
  };

  const sendDeviceInfoToServer = async () => {
    try {
      // Get detailed device information
      const deviceInfo = deviceDetect(navigator.userAgent);
      
      // Direct user agent checks for more reliable detection
      const userAgent = navigator.userAgent || '';
      const containsAndroid = userAgent.toLowerCase().includes('android');
      const containsIOS = /iphone|ipad|ipod/i.test(userAgent);
      const containsMobile = /mobile|phone/i.test(userAgent);
      
      // Get detailed OS information
      const detailedOsInfo = getDetailedOsInfo();
      
      // Get detailed browser information
      const detailedBrowserInfo = getDetailedBrowserInfo();
      
      // Enhanced mobile detection
      // Use multiple indicators to determine if it's truly a mobile device
      const definitelyMobile = 
        isMobileOnly || 
        isIOS || 
        isAndroid || 
        isMobileSafari || 
        containsAndroid || 
        containsIOS || 
        (containsMobile && !(/chrome/i.test(userAgent) && window.innerWidth > 1024));
      
      // Screen size check (most mobile devices are under 1024px width)
      const hasMobileScreenSize = window.innerWidth < 768;
      
      // Determine device type with higher accuracy
      let deviceType = 'unknown';
      
      // Priority order for detection:
      if (containsAndroid || containsIOS) {
        // Direct OS detection takes highest priority
        deviceType = 'mobile';
        console.log('Detected mobile OS in user agent:', { containsAndroid, containsIOS });
      } else if (definitelyMobile) {
        deviceType = 'mobile';
      } else if (isTablet || (window.innerWidth >= 768 && window.innerWidth <= 1024)) {
        deviceType = 'tablet';
      } else if (isDesktop && window.innerWidth > 1024) {
        deviceType = 'desktop';
      } else if (isMobile || hasMobileScreenSize) {
        // Fallback to general mobile check
        deviceType = 'mobile';
      } else {
        // If all else fails, use screen orientation as a hint
        deviceType = window.innerHeight > window.innerWidth ? 'mobile' : 'desktop';
      }
      
      // Get more detailed device model information
      const deviceModel = mobileModel || deviceInfo.device?.model || '';
      const deviceBrand = mobileVendor || deviceInfo.device?.brand || '';
      
      console.log('Client detected device info:', {
        deviceType,
        osInfo: detailedOsInfo,
        browserInfo: detailedBrowserInfo,
        model: deviceModel,
        brand: deviceBrand,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      });

      // Send device info to server with API calls
      const response = await fetch('/api/auth/update-device-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'X-Client-Device-Type': deviceType // Also send as header for future requests
        },
        body: JSON.stringify({
          deviceType,
          browser: detailedBrowserInfo,
          os: detailedOsInfo,
          vendor: deviceBrand,
          model: deviceModel,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          userAgent: navigator.userAgent,
          isAndroid: containsAndroid || isAndroid,
          isIOS: containsIOS || isIOS,
          isMobile,
          isTablet,
          isDesktop,
          orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
          deviceInfo: deviceInfo // Send the full detection result
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update device info');
      }
      
      console.log('Device info sent successfully');
    } catch (error) {
      console.error('Error sending device info:', error);
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default DeviceDetector;
