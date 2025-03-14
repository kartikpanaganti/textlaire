import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

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

export default router; 