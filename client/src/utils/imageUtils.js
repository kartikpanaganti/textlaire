// Image utility functions for consistent image handling across the application

// Default placeholder images for different sizes
export const NO_IMAGE_PLACEHOLDER = 'https://via.placeholder.com/200x200?text=No+Image';
export const NO_IMAGE_PLACEHOLDER_MEDIUM = 'https://via.placeholder.com/300x300?text=No+Image';
export const NO_IMAGE_PLACEHOLDER_LARGE = 'https://via.placeholder.com/400x400?text=No+Image';

/**
 * Get the full image URL based on the image path
 * @param {string} imagePath - The image path or URL
 * @param {string} defaultImage - Default image to use if imagePath is not provided
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imagePath, defaultImage = NO_IMAGE_PLACEHOLDER) => {
  if (!imagePath) return defaultImage;
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Special handling for uploaded files
  if (imagePath.includes('/uploads/') || imagePath.startsWith('uploads/')) {
    // Make sure we have the full server URL for uploads
    const serverURL = import.meta.env.VITE_API_URL || window.location.origin;
    
    // Clean up the path to ensure proper formatting
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${serverURL}${cleanPath}`;
  }
  
  // If it's a relative API path, prepend the API URL
  const baseURL = import.meta.env.VITE_API_URL || window.location.origin;
  return `${baseURL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

/**
 * Handle image loading errors
 * @param {Event} event - The error event
 * @param {string} size - The size of the placeholder to use (small, medium, large)
 */
export const handleImageError = (event, size = 'small') => {
  switch (size) {
    case 'large':
      event.target.src = NO_IMAGE_PLACEHOLDER_LARGE;
      break;
    case 'medium':
      event.target.src = NO_IMAGE_PLACEHOLDER_MEDIUM;
      break;
    default:
      event.target.src = NO_IMAGE_PLACEHOLDER;
  }
};
