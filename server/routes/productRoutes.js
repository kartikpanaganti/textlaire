import express from 'express';
import {
  getAllProductPatterns,
  getProductPatternById,
  createProductPattern,
  updateProductPattern,
  deleteProductPattern
} from '../controllers/productController.js';

const router = express.Router();

// Product pattern routes
router.get('/patterns', getAllProductPatterns);
router.get('/patterns/:id', getProductPatternById);
router.post('/patterns', createProductPattern);
router.put('/patterns/:id', updateProductPattern);
router.delete('/patterns/:id', deleteProductPattern);

export default router; 