import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const router = express.Router();

// Environment variables for fal.ai API
const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_API_BASE_URL = 'https://api.fal.ai';

// Proxy middleware for fal.ai API requests
router.post('/proxy', async (req, res) => {
  try {
    const targetUrl = req.headers['x-fal-target-url'];
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing target URL header' });
    }
    
    // Forward the request to fal.ai API
    const response = await axios({
      method: 'post',
      url: targetUrl,
      data: req.body,
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying request to fal.ai:', error);
    
    // Forward any error response
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
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
      apiKey: FAL_API_KEY
    });
  } catch (error) {
    console.error('Error providing WebSocket details:', error);
    return res.status(500).json({ error: 'Failed to provide WebSocket details' });
  }
});

// Proxy endpoint for image-to-image generation
router.post('/image-to-image', async (req, res) => {
  try {
    const { imageData, prompt, seed, strength } = req.body;
    
    console.log('Received proxy request for image-to-image with prompt:', prompt);
    console.log('Image data length:', imageData ? imageData.length : 0, 'bytes');
    
    // For large base64 strings, we'll use a URL parameter approach
    let imageUrl = imageData;
    
    // If the image data is very large, consider using an alternative approach
    if (imageData.length > 1000000) { // ~1MB limit
      console.log('Image is large, trying to use a more efficient approach');
      
      // Try using a data URI directly (fal.ai accepts this format)
      imageUrl = imageData;
      
      // You could also consider implementing image compression here
      // or uploading to a temporary storage service
    }
    
    // Set sync_mode to true to get the result directly
    const requestBody = {
      input: {
        image_url: imageUrl,
        prompt: prompt,
        seed: parseInt(seed, 10),
        strength: parseFloat(strength),
        sync_mode: false // Switch to async mode for more reliable processing
      }
    };
    
    console.log('Submitting request to fal.ai with parameters:', {
      prompt,
      seed: parseInt(seed, 10),
      strength: parseFloat(strength),
      sync_mode: false,
      imageUrlType: typeof imageUrl === 'string' ? 'string(' + imageUrl.substring(0, 30) + '...)' : typeof imageUrl
    });
    
    // Initial request to submit the job to the queue
    const submitResponse = await fetch('https://queue.fal.run/fal-ai/fast-lightning-sdxl/image-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${process.env.FAL_KEY}`
      },
      body: JSON.stringify(requestBody),
      timeout: 60000 // 60 second timeout for the initial request
    });
    
    if (!submitResponse.ok) {
      let errorData;
      try {
        errorData = await submitResponse.json();
      } catch (e) {
        errorData = { error: await submitResponse.text() };
      }
      
      console.error('Fal.ai API error during submission:', submitResponse.status, errorData);
      return res.status(submitResponse.status).json({
        error: `Fal.ai API error: ${submitResponse.status}`,
        details: errorData
      });
    }
    
    // Check if we got a direct result (sync_mode=true)
    const contentType = submitResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await submitResponse.json();
      
      // If we have images in the response, it's the final result
      if (responseData.images && responseData.images.length > 0) {
        console.log('Received direct result from fal.ai (sync mode was successful)');
        return res.json(responseData);
      }
      
      // Otherwise, it's a queue response
      const requestId = responseData.request_id;
      
      if (!requestId) {
        return res.status(500).json({ error: 'Failed to get request ID from fal.ai' });
      }
      
      console.log(`Job submitted to fal.ai queue with request ID: ${requestId}`);
      
      // Function to poll for result
      const pollForResult = async (id, maxAttempts = 30, delay = 3000) => {
        console.log(`Starting to poll for result with request ID: ${id} (max ${maxAttempts} attempts, ${delay}ms delay)`);
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            // Wait for specified delay
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Check status of the request
            console.log(`Polling attempt ${attempt + 1}/${maxAttempts} for request ${id}`);
            const statusResponse = await fetch(`https://queue.fal.run/fal-ai/fast-lightning-sdxl/image-to-image/requests/${id}/status`, {
              method: 'GET',
              headers: {
                'Authorization': `Key ${process.env.FAL_KEY}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!statusResponse.ok) {
              const statusCode = statusResponse.status;
              let errorText = '';
              try {
                const errorData = await statusResponse.json();
                errorText = JSON.stringify(errorData);
              } catch (e) {
                errorText = await statusResponse.text();
              }
              console.warn(`Error checking status (attempt ${attempt + 1}/${maxAttempts}): ${statusCode} - ${errorText}`);
              
              // If we got a 404, the request might have been deleted or expired
              if (statusCode === 404) {
                throw new Error(`Request ${id} not found - it may have expired or been deleted`);
              }
              
              continue;
            }
            
            const statusData = await statusResponse.json();
            console.log(`Status check (attempt ${attempt + 1}/${maxAttempts}): ${statusData.status}`, statusData);
            
            // If completed, get the result
            if (statusData.status === 'COMPLETED') {
              console.log(`Request ${id} completed! Fetching result...`);
              const resultResponse = await fetch(`https://queue.fal.run/fal-ai/fast-lightning-sdxl/image-to-image/requests/${id}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Key ${process.env.FAL_KEY}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!resultResponse.ok) {
                const resultError = await resultResponse.text();
                throw new Error(`Failed to get result: ${resultResponse.status} - ${resultError}`);
              }
              
              const resultData = await resultResponse.json();
              console.log(`Successfully retrieved result for request ${id}`);
              return resultData;
            }
            
            // If error, stop polling
            if (statusData.status === 'FAILED') {
              console.error(`Job ${id} failed:`, statusData.error || {});
              throw new Error(`Job failed: ${JSON.stringify(statusData.error || {})}`);
            }
            
            // Otherwise continue polling
          } catch (error) {
            console.error(`Error in polling attempt ${attempt + 1}/${maxAttempts} for request ${id}:`, error);
            if (attempt === maxAttempts - 1) throw error;
          }
        }
        
        throw new Error(`Timed out after ${maxAttempts} attempts`);
      };
      
      // Poll for the final result
      const finalResult = await pollForResult(requestId);
      console.log('Successfully received final result from fal.ai API');
      
      return res.json(finalResult);
    } else {
      return res.status(500).json({ error: 'Unexpected response format from fal.ai API' });
    }
  } catch (error) {
    console.error('Error in fal.ai proxy:', error);
    return res.status(500).json({ error: `Error processing request: ${error.message}` });
  }
});

export default router; 