import express from 'express';
import AdminUserController from '../../controllers/admin/AdminUserController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// List users (with ?type=utc filter)
router.get('/', AdminUserController.listUsers);

// Update user details
router.put('/:userId', AdminUserController.updateUser);

// Soft delete user
router.delete('/:userId', AdminUserController.deleteUser);

export default router;
