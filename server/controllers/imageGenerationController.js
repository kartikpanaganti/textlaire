import GeneratedImage from '../models/GeneratedImage.js';

// Save a generated image
export const saveGeneratedImage = async (req, res) => {
  try {
    const { originalImage, generatedImage, prompt, seed, strength, timestamp } = req.body;
    
    if (!originalImage || !generatedImage || !prompt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    const newImage = new GeneratedImage({
      originalImage,
      generatedImage,
      prompt,
      seed: seed || 0,
      strength: strength || 0.7,
      timestamp: timestamp || new Date(),
      // If user authentication is implemented, add userId: req.user._id
    });
    
    await newImage.save();
    
    return res.status(201).json({
      success: true,
      message: 'Image saved successfully',
      image: newImage
    });
  } catch (error) {
    console.error('Error saving generated image:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to save generated image',
      error: error.message
    });
  }
};

// Get all generated images
export const getAllImages = async (req, res) => {
  try {
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // If user authentication is implemented, filter by userId: req.user._id
    const images = await GeneratedImage.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await GeneratedImage.countDocuments();
    
    return res.status(200).json({
      success: true,
      count: images.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      images
    });
  } catch (error) {
    console.error('Error fetching generated images:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch generated images',
      error: error.message
    });
  }
};

// Get a single generated image by ID
export const getImageById = async (req, res) => {
  try {
    const image = await GeneratedImage.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ 
        success: false, 
        message: 'Generated image not found' 
      });
    }
    
    return res.status(200).json({
      success: true,
      image
    });
  } catch (error) {
    console.error('Error fetching generated image:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch generated image',
      error: error.message
    });
  }
};

// Delete a generated image
export const deleteImage = async (req, res) => {
  try {
    const image = await GeneratedImage.findByIdAndDelete(req.params.id);
    
    if (!image) {
      return res.status(404).json({ 
        success: false, 
        message: 'Generated image not found' 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Generated image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting generated image:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete generated image',
      error: error.message
    });
  }
}; 