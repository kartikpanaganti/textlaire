import fetch from 'node-fetch';
import { config } from '../config/index.js';

/**
 * Proxy a request to the fal.ai API
 * @param {Object} requestData - The request data to send to fal.ai
 * @param {string} targetUrl - The fal.ai API endpoint URL
 * @returns {Promise<Object>} - The response from fal.ai
 */
export const proxyFalRequest = async (requestData, targetUrl) => {
  // Validate the target URL against allowed URLs
  const isAllowed = config.allowedUrls.some(allowedUrl => targetUrl.startsWith(allowedUrl));
  
  if (!isAllowed) {
    throw new Error(`URL not allowed: ${targetUrl}. Allowed URLs: ${config.allowedUrls.join(', ')}`);
  }
  
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${config.falApiKey}`
    },
    body: JSON.stringify(requestData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fal.ai API error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
};

/**
 * Get WebSocket connection details for realtime API
 * @returns {Object} - The WebSocket URL and API key
 */
export const getWebSocketDetails = () => {
  if (!config.falApiKey) {
    throw new Error('FAL_KEY not found in environment variables');
  }
  
  return {
    wsUrl: config.wsUrl,
    apiKey: config.falApiKey
  };
}; 