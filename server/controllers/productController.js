import ProductPattern from '../models/ProductPattern.js';

// Get all product patterns
export const getAllProductPatterns = async (req, res) => {
  try {
    const productPatterns = await ProductPattern.find().sort({ createdAt: -1 });
    res.status(200).json(productPatterns);
  } catch (error) {
    console.error('Error fetching product patterns:', error);
    res.status(500).json({ error: 'Failed to fetch product patterns' });
  }
};

// Get a single product pattern by ID
export const getProductPatternById = async (req, res) => {
  try {
    const { id } = req.params;
    const productPattern = await ProductPattern.findOne({ id });
    
    if (!productPattern) {
      return res.status(404).json({ error: 'Product pattern not found' });
    }
    
    res.status(200).json(productPattern);
  } catch (error) {
    console.error('Error fetching product pattern:', error);
    res.status(500).json({ error: 'Failed to fetch product pattern' });
  }
};

// Create a new product pattern
export const createProductPattern = async (req, res) => {
  try {
    const productData = req.body;
    
    // Ensure we have a unique ID
    if (!productData.id) {
      productData.id = 'PROD_' + Date.now();
    }
    
    // Create new product pattern
    const newProductPattern = new ProductPattern(productData);
    const savedProductPattern = await newProductPattern.save();
    
    res.status(201).json(savedProductPattern);
  } catch (error) {
    console.error('Error creating product pattern:', error);
    res.status(500).json({ error: 'Failed to create product pattern' });
  }
};

// Update a product pattern
export const updateProductPattern = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Find and update the product pattern
    const updatedProductPattern = await ProductPattern.findOneAndUpdate(
      { id },
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!updatedProductPattern) {
      return res.status(404).json({ error: 'Product pattern not found' });
    }
    
    res.status(200).json(updatedProductPattern);
  } catch (error) {
    console.error('Error updating product pattern:', error);
    res.status(500).json({ error: 'Failed to update product pattern' });
  }
};

// Delete a product pattern
export const deleteProductPattern = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedProductPattern = await ProductPattern.findOneAndDelete({ id });
    
    if (!deletedProductPattern) {
      return res.status(404).json({ error: 'Product pattern not found' });
    }
    
    res.status(200).json({ message: 'Product pattern deleted successfully' });
  } catch (error) {
    console.error('Error deleting product pattern:', error);
    res.status(500).json({ error: 'Failed to delete product pattern' });
  }
}; 