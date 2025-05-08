import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { fal } from "@fal-ai/client";
import fs from 'fs';
import path from 'path';
import https from 'https';
import ProductPattern from '../models/ProductPattern.js';

dotenv.config();

const router = express.Router();

// Environment variables for fal.ai API
const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_API_BASE_URL = 'https://api.fal.ai';

// Initialize fal client with the key from environment variables
fal.config({
  credentials: process.env.FAL_KEY
});

// Proxy middleware for fal.ai API requests
router.post('/proxy', async (req, res) => {
  try {
    const targetUrl = req.headers['x-fal-target-url'];
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing target URL header' });
    }
    
    // Forward the request to fal.ai API
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      return res.status(response.status).json(errorData);
    }
    
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Error proxying request to fal.ai:', error);
    return res.status(500).json({ 
      error: 'Failed to proxy request to fal.ai',
      details: error.message
    });
  }
});

// Get WebSocket details and API key (to establish connection)
router.get('/ws-details', (req, res) => {
  try {
    // In a production environment, you might want to implement
    // additional authentication before providing these details
    return res.status(200).json({
      wsUrl: 'wss://ws.fal.ai',
      apiKey: process.env.FAL_KEY
    });
  } catch (error) {
    console.error('Error providing WebSocket details:', error);
    return res.status(500).json({ error: 'Failed to provide WebSocket details' });
  }
});

// Image-to-image generation endpoint
router.post('/image-to-image', async (req, res) => {
  try {
    const { 
      imageData, 
      prompt,
      strength = 0.65,
      num_inference_steps = 40,
      guidance_scale = 12,
      seed = -1
    } = req.body;

    if (!imageData || !prompt) {
      return res.status(400).json({ error: 'Image data and prompt are required' });
    }

    // Process the image data
    let processedImageData = imageData;
    
    // Check if it's a string and not a URL
    if (typeof imageData === 'string') {
      if (!imageData.startsWith('http') && !imageData.startsWith('https')) {
        // If it's base64, ensure it has the correct prefix
        if (!imageData.startsWith('data:image/')) {
          processedImageData = `data:image/jpeg;base64,${imageData}`;
        }
      }
    } else {
      return res.status(400).json({ error: 'Invalid image data format' });
    }

    // Enhance the prompt for better results
    const enhancedPrompt = `${prompt}, exact colors only, precise count, photorealistic, highly detailed, 4k, high resolution, masterful composition, perfect lighting`;
    const negativePrompt = "blurry, distorted, low quality, low resolution, ugly, duplicate, deformed, watermark, text, signature, wrong colors, mixed colors, different colors, wrong number of objects, more objects, fewer objects";

    console.log('Starting generation with parameters:', {
      prompt: enhancedPrompt,
      strength,
      steps: num_inference_steps,
      cfg_scale: guidance_scale
    });

    // Log image data format for debugging
    console.log('Image data format:', {
      type: typeof processedImageData,
      isDataUrl: processedImageData.startsWith('data:image/'),
      length: processedImageData.length,
      preview: processedImageData.substring(0, 50) + '...' // Show just the beginning
    });
    
    // Validate the data URL format
    if (!processedImageData.startsWith('data:image/')) {
      return res.status(400).json({
        error: 'Invalid image format',
        details: 'Image data must be a valid data URL starting with data:image/',
        timestamp: new Date().toISOString()
      });
    }
    
    // Set a timeout for the API call
    const timeout = 50000; // 50 seconds
    const timeoutId = setTimeout(() => {
      console.log('API call timed out after', timeout, 'ms');
      return res.status(504).json({
        error: 'Request timed out',
        details: 'The image generation request took too long to complete',
        timestamp: new Date().toISOString()
      });
    }, timeout);
    
    try {
      // Call the image-to-image API with the data URL directly
      const result = await fal.subscribe("fal-ai/fast-lightning-sdxl/image-to-image", {
        input: {
          image_url: processedImageData,
          prompt: enhancedPrompt,
          negative_prompt: negativePrompt,
          strength: Math.min(Math.max(parseFloat(strength), 0.4), 0.9),
          steps: Math.min(Math.max(parseInt(num_inference_steps), 1), 50),
          cfg_scale: Math.min(Math.max(parseFloat(guidance_scale), 8), 20),
          seed: parseInt(seed),
          scheduler: "DPM++ 2M Karras"
        }
      });
      
      // Clear the timeout since the call completed successfully
      clearTimeout(timeoutId);

      console.log('API response:', {
        success: true,
        hasImages: !!result.data.images,
        imageCount: result.data.images?.length,
        prompt: enhancedPrompt
      });

      if (!result.data.images?.[0]?.url) {
        throw new Error('No image generated in the response');
      }

      // Get the image URL from the API response
      const imageUrl = result.data.images[0].url;
      
      // Generate a potential filename (for later use if saved)
      const timestamp = Date.now();
      const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const filename = `${sanitizedPrompt}_${timestamp}.png`;
      
      // Return the image URL and metadata for later saving
      return res.json({ 
        imageUrl: imageUrl,
        metadata: {
          prompt: prompt,
          enhancedPrompt: enhancedPrompt,
          timestamp: timestamp,
          suggestedFilename: filename,
          strength: strength,
          steps: num_inference_steps,
          guidance: guidance_scale
        }
      });
    } catch (apiError) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      
      console.error('Fal.ai API error details:', {
        status: apiError.status,
        message: apiError.message,
        body: apiError.body ? JSON.stringify(apiError.body, null, 2) : 'No body',
        validationDetails: apiError.body?.detail,
        stack: apiError.stack
      });
      
      // Return a more specific error message
      return res.status(500).json({
        error: 'Failed to generate image with the AI service',
        details: apiError.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in image-to-image generation:', {
      message: error.message,
      status: error.status,
      body: error.body ? JSON.stringify(error.body, null, 2) : 'No body',
      validationDetails: error.body?.detail,
      stack: error.stack
    });
    
    // Provide a more detailed error response
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message,
      validationErrors: error.body?.detail || [],
      timestamp: new Date().toISOString()
    });
  }
});

// Upload image and get a URL
router.post('/upload-image', async (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Upload to fal.ai's file storage
    const uploadResponse = await fetch('https://fal.ai/api/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: imageData,
        is_public: true
      })
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({ error: uploadResponse.statusText }));
      console.error('Fal.ai upload error:', uploadResponse.status, errorData);
      return res.status(uploadResponse.status).json({
        error: `Failed to upload image: ${uploadResponse.status}`,
        details: errorData
      });
    }

    const uploadResult = await uploadResponse.json();
    return res.json({ imageUrl: uploadResult.url });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message
    });
  }
});

// New endpoint to save a generated image
router.post('/save-generated-image', async (req, res) => {
  try {
    const { imageUrl, metadata, productData } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'No image URL provided' });
    }
    
    // Create the patterns directory if it doesn't exist
    const patternDir = path.join(process.cwd(), 'uploads', 'patterns');
    if (!fs.existsSync(patternDir)) {
      fs.mkdirSync(patternDir, { recursive: true });
    }
    
    // Generate a filename
    let filename;
    if (metadata && metadata.suggestedFilename) {
      filename = metadata.suggestedFilename;
    } else {
      const timestamp = Date.now();
      const productName = productData?.name ? productData.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) : 'product';
      filename = `${productName}_${timestamp}.png`;
    }
    
    const filePath = path.join(patternDir, filename);
    const serverImagePath = `/uploads/patterns/${filename}`;
    
    console.log(`Saving generated image to ${filePath}`);
    
    // Download and save the image
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(filePath);
      
      https.get(imageUrl, (response) => {
        response.pipe(fileStream);
        
        fileStream.on('finish', async () => {
          fileStream.close();
          console.log('Image saved successfully');
          
          // If product data was provided, save it to the database
          if (productData) {
            try {
              // Generate a unique code if one is provided
              let uniqueCode = productData.code;
              if (uniqueCode) {
                uniqueCode = `${uniqueCode}-${Date.now().toString().slice(-6)}`;
              }
              
              // Prepare product data
              const productToSave = {
                ...productData,
                code: uniqueCode, // Use the generated unique code
                imageUrl: serverImagePath, // Use the local server path for the image
                id: productData.id || `PROD_${Date.now()}`,
                createdAt: new Date(),
                type: productData.type || 'pattern',
                material: productData.material || 'cotton',
                qualityGrade: productData.qualityGrade || 'premium'
              };
              
              console.log('Saving product to database:', productToSave);
              
              // Create new product pattern
              const newProductPattern = new ProductPattern(productToSave);
              const savedProductPattern = await newProductPattern.save();
              
              console.log('Product saved successfully:', savedProductPattern);
            } catch (productError) {
              console.error('Error saving product to database:', productError);
              // Continue with the response even if product saving fails
            }
          }
          
          res.json({ 
            success: true, 
            message: 'Image saved successfully',
            localImagePath: serverImagePath
          });
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file if there's an error
        console.error('Error downloading image:', err);
        res.status(500).json({ error: 'Failed to download and save image' });
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error saving generated image:', error);
    return res.status(500).json({ 
      error: 'Failed to save image',
      details: error.message
    });
  }
});

export default router; 