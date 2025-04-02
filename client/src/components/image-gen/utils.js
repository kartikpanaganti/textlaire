// Utility functions for the image generator

/**
 * Generate a random seed for image generation
 * @returns {Number} Random integer between 0 and 2147483647
 */
export const randomSeed = () => {
  return Math.floor(Math.random() * 2147483647);
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
 * Convert a file to base64 data URL
 * @param {File} file - File object to convert
 * @returns {Promise<string>} Base64 data URL
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

/**
 * Get file extension from file object
 * @param {File} file - File object
 * @returns {string} File extension
 */
export const getFileExtension = (file) => {
  return file.name.split('.').pop().toLowerCase();
};

/**
 * Check if file is an image
 * @param {File} file - File object to check
 * @returns {boolean} True if file is an image
 */
export const isImageFile = (file) => {
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const extension = getFileExtension(file);
  return validExtensions.includes(extension);
};

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted string
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Apply image filters to a canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} filters - Filter settings
 * @returns {HTMLCanvasElement} Canvas with filters applied
 */
export const applyFiltersToCanvas = (canvas, filters) => {
  const ctx = canvas.getContext('2d');
  
  // Apply brightness
  if (filters.brightness !== 100) {
    const brightnessFilter = `brightness(${filters.brightness}%)`;
    ctx.filter = brightnessFilter;
    
    // Draw the image onto itself with the filter applied
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
  }
  
  // Apply contrast
  if (filters.contrast !== 100) {
    const contrastFilter = `contrast(${filters.contrast}%)`;
    ctx.filter = contrastFilter;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
  }
  
  // Apply saturation
  if (filters.saturation !== 100) {
    const saturationFilter = `saturate(${filters.saturation}%)`;
    ctx.filter = saturationFilter;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
  }
  
  // Reset filter
  ctx.filter = 'none';
  
  return canvas;
};

/**
 * Convert canvas to blob
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} type - MIME type
 * @param {number} quality - Image quality (0-1)
 * @returns {Promise<Blob>} Image blob
 */
export const canvasToBlob = (canvas, type = 'image/jpeg', quality = 0.9) => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, type, quality);
  });
}; 