import express from 'express';
import fetch from 'node-fetch';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Product from '../models/ProductPattern.js';

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

    // Check if the URL is allowed
    const URL_ALLOW_LIST = [
      "https://rest.alpha.fal.ai",
      "wss://realtime.fal.ai",
      "https://realtime.fal.ai"
    ];
    
    // Check if URL starts with any of the allowed URLs
    const isAllowed = URL_ALLOW_LIST.some(allowedUrl => targetUrl.startsWith(allowedUrl));
    
    if (!isAllowed) {
      console.log('URL not in allow list:', targetUrl);
      return res.status(403).json({ error: 'URL not allowed', allowedUrls: URL_ALLOW_LIST });
    }

    console.log('Making request to:', targetUrl);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${process.env.FAL_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Fal.ai API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Fal.ai API error',
        details: errorText,
        status: response.status
      });
    }

    const data = await response.json();
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
    if (!process.env.FAL_KEY) {
      console.error('FAL_KEY not found in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    res.json({ 
      wsUrl: 'wss://realtime.fal.ai/handler',
      apiKey: process.env.FAL_KEY
    });
    console.log('Successfully sent WebSocket configuration');
  } catch (error) {
    console.error('WebSocket proxy error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
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
      // Image was sent as base64 data
      // Extract the base64 data and save it as a file
      const base64Data = req.body.imageData.split(';base64,').pop();
      const fileName = `${Date.now()}-${uuidv4()}.jpg`;
      const filePath = path.join(process.cwd(), 'uploads/patterns', fileName);
      
      // Ensure directory exists
      const uploadDir = path.join(process.cwd(), 'uploads/patterns');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
      imageUrl = `/uploads/patterns/${fileName}`;
      
      // Remove the base64 data from the request body to avoid storing it in DB
      delete req.body.imageData;
    } else {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    // Create a new product pattern in MongoDB
    const productData = {
      ...req.body,
      imageUrl,
      createdAt: new Date()
    };
    
    // Ensure an ID exists
    if (!productData.id) {
      productData.id = uuidv4();
    }
    
    const newProduct = new Product(productData);
    await newProduct.save();
    
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
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get a specific pattern
router.get('/patterns/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching pattern:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete a pattern
router.delete('/patterns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the product to get the image path
    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    
    // Delete the image file if it exists
    if (product.imageUrl) {
      const filePath = path.join(process.cwd(), product.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete the product from the database
    await Product.deleteOne({ id });
    
    res.json({ success: true, message: 'Pattern deleted successfully' });
  } catch (error) {
    console.error('Error deleting pattern:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router; 