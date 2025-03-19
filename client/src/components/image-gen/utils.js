// Utility functions for the image generator

/**
 * Generates a random seed for stable diffusion image generation
 * Returns a random integer between 1 and 1,000,000,000
 */
export const randomSeed = () => {
  return Math.floor(Math.random() * 1000000000) + 1;
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (price, currency = '$') => {
  if (!price) return currency + '0.00';
  return currency + parseFloat(price).toFixed(2);
};

/**
 * Get a color class based on status
 */
export const getStatusColorClass = (status) => {
  switch(status) {
    case 'active':
    case 'published':
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'review':
      return 'bg-yellow-100 text-yellow-800';
    case 'inactive':
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 25) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format date to localized string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

/**
 * Get a human-readable file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate a random filename with timestamp
 */
export const generateFileName = (prefix = 'image', extension = 'png') => {
  const timestamp = new Date().getTime();
  return `${prefix}_${timestamp}.${extension}`;
};

/**
 * Apply image filters based on filter values
 */
export const applyImageFilters = (canvas, filters) => {
  const ctx = canvas.getContext('2d');
  
  // Reset filters
  ctx.filter = 'none';
  
  // Apply new filters if provided
  if (filters) {
    const { brightness, contrast, saturation } = filters;
    const filterString = [];
    
    if (brightness !== undefined && brightness !== 100) {
      filterString.push(`brightness(${brightness}%)`);
    }
    
    if (contrast !== undefined && contrast !== 100) {
      filterString.push(`contrast(${contrast}%)`);
    }
    
    if (saturation !== undefined && saturation !== 100) {
      filterString.push(`saturate(${saturation}%)`);
    }
    
    if (filterString.length > 0) {
      ctx.filter = filterString.join(' ');
    }
  }
  
  return ctx;
}; 