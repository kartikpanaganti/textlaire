// Add the fal.ai proxy endpoint
router.post('/fal-proxy/image-to-image', async (req, res) => {
  try {
    const { imageData, prompt, seed, strength } = req.body;
    
    // Make request to fal.ai API
    const response = await fetch('https://queue.fal.run/fal-ai/fast-lightning-sdxl/image-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${process.env.FAL_KEY}`
      },
      body: JSON.stringify({
        input: {
          image_url: imageData,
          prompt: prompt,
          seed: seed,
          strength: strength
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Fal.ai API error:', response.status, errorData);
      return res.status(response.status).json({
        error: `Fal.ai API error: ${response.status}`,
        details: errorData
      });
    }
    
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Error in fal.ai proxy:', error);
    return res.status(500).json({ error: 'Error processing request' });
  }
}); 