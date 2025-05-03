import express from 'express';
import { getNetworkInfo, updateSessionNetworkInfo } from '../controllers/networkController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Network information routes
router.get('/info', getNetworkInfo);
router.post('/update-session', authMiddleware, updateSessionNetworkInfo);

export default router;
