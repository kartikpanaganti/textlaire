import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import RawMaterial from '../models/RawMaterial.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'materials');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `material-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Get all raw materials
router.get('/', async (req, res) => {
  try {
    const materials = await RawMaterial.find().sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single raw material
router.get('/:id', async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Raw material not found' });
    }
    res.json(material);
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new raw material
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const materialData = req.body;
    
    // Convert numeric fields
    if (materialData.stock) materialData.stock = Number(materialData.stock);
    if (materialData.unitPrice) materialData.unitPrice = Number(materialData.unitPrice);
    if (materialData.reorderLevel) materialData.reorderLevel = Number(materialData.reorderLevel);
    
    // Add image path if uploaded
    if (req.file) {
      materialData.image = `/uploads/materials/${req.file.filename}`;
    }
    
    const material = new RawMaterial(materialData);
    const savedMaterial = await material.save();
    res.status(201).json(savedMaterial);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update a raw material
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const materialData = req.body;
    
    // Convert numeric fields
    if (materialData.stock) materialData.stock = Number(materialData.stock);
    if (materialData.unitPrice) materialData.unitPrice = Number(materialData.unitPrice);
    if (materialData.reorderLevel) materialData.reorderLevel = Number(materialData.reorderLevel);
    
    // Add image path if uploaded
    if (req.file) {
      materialData.image = `/uploads/materials/${req.file.filename}`;
    }
    
    const updatedMaterial = await RawMaterial.findByIdAndUpdate(
      req.params.id,
      materialData,
      { new: true, runValidators: true }
    );
    
    if (!updatedMaterial) {
      return res.status(404).json({ message: 'Raw material not found' });
    }
    
    res.json(updatedMaterial);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a raw material
router.delete('/:id', async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: 'Raw material not found' });
    }
    
    // Delete associated image if exists
    if (material.image) {
      const imagePath = path.join(process.cwd(), material.image.substring(1));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await RawMaterial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Raw material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update stock quantity
router.patch('/:id', async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ message: 'Valid stock value is required' });
    }
    
    const material = await RawMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: 'Raw material not found' });
    }
    
    material.stock = stock;
    material.lastRestocked = Date.now();
    
    const updatedMaterial = await material.save();
    res.json(updatedMaterial);
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get low stock materials
router.get('/status/low-stock', async (req, res) => {
  try {
    const materials = await RawMaterial.find({
      $expr: { $lt: ['$stock', '$reorderLevel'] }
    });
    res.json(materials);
  } catch (error) {
    console.error('Error fetching low stock materials:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;