/**
 * This file provides a central configuration for base URLs used in the application.
 * It helps ensure that file paths and resources are accessible across different devices.
 */

export const getBaseUrl = () => {
  // Use environment variable if available, otherwise fall back to a reasonable default
  return process.env.BASE_URL || (
    process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com'  // Replace with actual production domain when known
    : `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 5000}`
  );
};
