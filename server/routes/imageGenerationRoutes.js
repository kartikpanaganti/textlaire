import express from 'express';
import {
  saveGeneratedImage,
  getAllImages,
  getImageById,
  deleteImage
} from '../controllers/imageGenerationController.js';

const router = express.Router();

// POST /api/image-generation/save
router.post('/save', saveGeneratedImage);

// GET /api/image-generation
router.get('/', getAllImages);

// GET /api/image-generation/:id
router.get('/:id', getImageById);

// DELETE /api/image-generation/:id
router.delete('/:id', deleteImage);

export default router; 