/**
 * Centralized API configuration.
 * This ensures consistent API access regardless of how the application is accessed (localhost, IP, etc.)
 */

// Base URL for API requests - uses relative URLs to leverage the Vite proxy
const API_URL = '/api';

// Default request headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export { API_URL, DEFAULT_HEADERS };
