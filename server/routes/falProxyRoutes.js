import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { fal } from "@fal-ai/client";

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
    if (!imageData.startsWith('http') && !imageData.startsWith('https')) {
      // If it's base64, ensure it has the correct prefix
      if (!imageData.startsWith('data:image/')) {
        processedImageData = `data:image/jpeg;base64,${imageData}`;
      }
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

    try {
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

      console.log('API response:', {
        success: true,
        hasImages: !!result.data.images,
        imageCount: result.data.images?.length,
        prompt: enhancedPrompt
      });

      if (!result.data.images?.[0]?.url) {
        throw new Error('No image generated in the response');
      }

      return res.json({ imageUrl: result.data.images[0].url });
    } catch (error) {
      console.error('Fal.ai API error details:', {
        status: error.status,
        message: error.message,
        body: JSON.stringify(error.body, null, 2),
        validationDetails: error.body?.detail,
        stack: error.stack
      });
      throw error;
    }
  } catch (error) {
    console.error('Error in image-to-image generation:', {
      message: error.message,
      status: error.status,
      body: JSON.stringify(error.body, null, 2),
      validationDetails: error.body?.detail,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message,
      validationErrors: error.body?.detail || []
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

export default router; 