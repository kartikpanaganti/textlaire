import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * NetworkIdentifier component
 * 
 * This component detects and identifies network information for the current session.
 * It provides data such as connection type, network identifier, and estimated ISP.
 * The information is sent to the server to enhance session tracking.
 */
const NetworkIdentifier = ({ onNetworkIdentified = () => {} }) => {
  const [networkInfo, setNetworkInfo] = useState({
    connectionType: 'unknown',
    networkIdentifier: '',
    isp: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  useEffect(() => {
    const identifyNetwork = async () => {
      try {
        // Get connection information if supported by browser
        const connection = navigator.connection || 
                           navigator.mozConnection || 
                           navigator.webkitConnection;

        let connectionInfo = {
          connectionType: 'unknown',
          effectiveType: 'unknown',
          downlink: 0,
          rtt: 0
        };

        if (connection) {
          connectionInfo = {
            connectionType: connection.type || 'unknown',
            effectiveType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 0,
            rtt: connection.rtt || 0
          };
        }

        // Try to get public IP and ISP information using a third-party service
        // This is a fallback if you don't have your own API
        // Note: In production, you should use your own API or a service with appropriate privacy policies
        let ipInfo = { ip: 'unknown', isp: 'unknown', networkId: '' };
        
        try {
          // Use the client's IP address already known to the server
          // to avoid multiple external API calls
          const response = await axios.get('/api/network/info');
          if (response.data && response.data.success) {
            ipInfo = response.data.networkInfo;
          }
        } catch (error) {
          console.log('Could not fetch network info from server:', error);
          // Fallback: Don't attempt to get IP info from external services
          // as this could raise privacy concerns
        }

        // Generate a network identifier using available information
        const networkIdentifier = generateNetworkIdentifier(connectionInfo, ipInfo);

        const updatedNetworkInfo = {
          ...connectionInfo,
          isp: ipInfo.isp,
          networkIdentifier
        };

        setNetworkInfo(updatedNetworkInfo);
        onNetworkIdentified(updatedNetworkInfo);

      } catch (error) {
        console.error('Error identifying network:', error);
      }
    };

    identifyNetwork();

    // Set up a listener for connection changes if supported
    const connection = navigator.connection || 
                       navigator.mozConnection || 
                       navigator.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', identifyNetwork);
      return () => connection.removeEventListener('change', identifyNetwork);
    }
  }, [onNetworkIdentified]);

  // Generate a pseudonymous network identifier based on available information
  const generateNetworkIdentifier = (connectionInfo, ipInfo) => {
    try {
      // Using a combination of connection info and partial IP info
      // without exposing the full IP address
      const ipParts = ipInfo.ip.split('.').slice(0, 2).join('.');
      const connType = connectionInfo.connectionType || 'unknown';
      const connSpeed = connectionInfo.effectiveType || 'unknown';
      
      // Create a hash-like identifier
      const networkHash = btoa(`${ipParts}-${connType}-${connSpeed}-${ipInfo.isp}`)
        .replace(/[+/=]/g, '') // Remove non-alphanumeric chars
        .substring(0, 16); // Limit length
      
      return networkHash;
    } catch (error) {
      console.error('Error generating network identifier:', error);
      return 'unknown';
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default NetworkIdentifier;
