import express from 'express';
import CustomerController from '../../controllers/CustomerController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// UTC: Get own profile
router.get('/profile', authenticate, CustomerController.getOwnProfile);

// UTC: Update own profile
router.patch('/profile', authenticate, CustomerController.updateOwnProfile);

export default router;
