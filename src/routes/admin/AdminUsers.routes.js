import express from 'express';
import UserController from '../../controllers/UserController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// List users (with ?type=utc filter)
router.get('/', UserController.listUsers);

// Update user details
router.put('/:userId', UserController.updateUser);

// Soft delete user
router.delete('/:userId', UserController.deleteUser);

export default router;
