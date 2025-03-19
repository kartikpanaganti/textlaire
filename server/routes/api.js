import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { proxyFalRequest, getWebSocketDetails } from '../api/falService.js';
import { getAllPatterns, getPatternById, savePattern, deletePattern, saveImageFromBase64 } from '../api/patternService.js';
import { submitBulkAttendance } from '../api/attendanceService.js';

const router = express.Router();

// Configure multer storage for pattern images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/patterns');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}.jpg`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Proxy route for fal.ai API
router.post('/proxy', async (req, res) => {
  try {
    console.log('Received proxy request with headers:', req.headers);
    const targetUrl = req.headers['x-fal-target-url'];
    console.log('Target URL:', targetUrl);
    
    if (!targetUrl) {
      console.log('Target URL missing in request');
      return res.status(404).json({ error: 'Target URL is required' });
    }

    const data = await proxyFalRequest(req.body, targetUrl);
    console.log('Successfully proxied request');
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// WebSocket proxy route for fal.ai realtime API
router.get('/ws-proxy', (req, res) => {
  try {
    console.log('Received WebSocket proxy request');
    const wsDetails = getWebSocketDetails();
    res.json(wsDetails);
    console.log('Successfully sent WebSocket configuration');
  } catch (error) {
    console.error('WebSocket proxy error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Submit bulk attendance route
router.post('/attendance/bulk', async (req, res) => {
  try {
    const result = await submitBulkAttendance(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error processing attendance data:', error);
    res.status(400).json({ error: error.message });
  }
});

// Save a generated pattern
router.post('/patterns', upload.single('image'), async (req, res) => {
  try {
    let imageUrl = null;
    
    // Check if an image file was uploaded or base64 data was sent
    if (req.file) {
      // Image was uploaded as a file
      imageUrl = `/uploads/patterns/${req.file.filename}`;
    } else if (req.body.imageData && req.body.imageData.startsWith('data:image')) {
      // Image was sent as base64 data - use the service to save it
      imageUrl = await saveImageFromBase64(req.body.imageData);
      
      // Remove the base64 data from the request body to avoid storing it in DB
      delete req.body.imageData;
    } else {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    // Use the service to save the pattern data
    const newProduct = await savePattern(req.body, imageUrl);
    
    // Return the saved product
    res.status(201).json({
      success: true,
      product: {
        ...newProduct.toObject(),
        imageData: imageUrl // Send the URL instead of base64 data
      }
    });
  } catch (error) {
    console.error('Error saving pattern:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get all patterns
router.get('/patterns', async (req, res) => {
  try {
    const products = await getAllPatterns();
    res.json(products);
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get a specific pattern
router.get('/patterns/:id', async (req, res) => {
  try {
    const product = await getPatternById(req.params.id);
    res.json(product);
  } catch (error) {
    if (error.message === 'Pattern not found') {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    console.error('Error fetching pattern:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete a pattern
router.delete('/patterns/:id', async (req, res) => {
  try {
    const result = await deletePattern(req.params.id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Pattern not found') {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    console.error('Error deleting pattern:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router; 