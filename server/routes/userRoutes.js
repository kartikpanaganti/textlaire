import express from 'express';
import { 
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserCredentials,
  searchUsers,
  updateUserPermissions
} from '../controllers/userController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
// Search users route - available to all authenticated users
router.get('/search', authMiddleware, searchUsers);

// Admin routes
router.get('/', authMiddleware, getAllUsers);
router.get('/:id', authMiddleware, getUserById);
router.post('/', authMiddleware, createUser);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deleteUser);
router.post('/:id/reset-credentials', authMiddleware, resetUserCredentials);

// New route for updating user page permissions (admin only)
router.put('/:id/permissions', authMiddleware, updateUserPermissions);

export default router;
