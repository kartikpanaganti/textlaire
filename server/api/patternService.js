import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Product from '../models/ProductPattern.js';

/**
 * Get all patterns
 * @returns {Promise<Array>} - Array of patterns
 */
export const getAllPatterns = async () => {
  try {
    return await Product.find().sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    throw error;
  }
};

/**
 * Get a pattern by ID
 * @param {string} id - Pattern ID
 * @returns {Promise<Object>} - Pattern object
 */
export const getPatternById = async (id) => {
  try {
    const pattern = await Product.findOne({ id });
    if (!pattern) {
      throw new Error('Pattern not found');
    }
    return pattern;
  } catch (error) {
    console.error(`Error fetching pattern with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Save a pattern
 * @param {Object} data - Pattern data
 * @param {string} imageUrl - URL of the saved image
 * @returns {Promise<Object>} - Saved pattern
 */
export const savePattern = async (data, imageUrl) => {
  try {
    const patternData = {
      ...data,
      imageUrl,
      id: data.id || uuidv4(),
      createdAt: new Date()
    };
    
    const newPattern = new Product(patternData);
    await newPattern.save();
    
    return newPattern;
  } catch (error) {
    console.error('Error saving pattern:', error);
    throw error;
  }
};

/**
 * Delete a pattern
 * @param {string} id - Pattern ID
 * @returns {Promise<Object>} - Result of the operation
 */
export const deletePattern = async (id) => {
  try {
    // Get the pattern to find the image path
    const pattern = await Product.findOne({ id });
    if (!pattern) {
      throw new Error('Pattern not found');
    }
    
    // Delete the image file if it exists
    if (pattern.imageUrl) {
      const filePath = path.join(process.cwd(), pattern.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete from database
    await Product.deleteOne({ id });
    
    return {
      success: true,
      message: 'Pattern deleted successfully'
    };
  } catch (error) {
    console.error(`Error deleting pattern with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Save image from base64 data
 * @param {string} base64Data - Base64 encoded image data
 * @returns {Promise<string>} - URL of the saved image
 */
export const saveImageFromBase64 = async (base64Data) => {
  try {
    // Extract the base64 data (remove data:image/jpeg;base64, prefix)
    const imageData = base64Data.split(';base64,').pop();
    const fileName = `${Date.now()}-${uuidv4()}.jpg`;
    const uploadDir = path.join(process.cwd(), 'uploads/patterns');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    
    // Write file
    fs.writeFileSync(filePath, imageData, { encoding: 'base64' });
    
    return `/uploads/patterns/${fileName}`;
  } catch (error) {
    console.error('Error saving image from base64:', error);
    throw error;
  }
}; 