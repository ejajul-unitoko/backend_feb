import express from 'express';
import BusinessController from '../../controllers/business/BusinessController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Business management routes
router.get('/business', BusinessController.getMyBusiness);
router.post('/business', BusinessController.registerBusiness);
router.put('/business/:id', BusinessController.updateBusiness);
router.get('/business/:id/status', BusinessController.getBusinessStatus);
router.get('/business/:id/markets', BusinessController.getBusinessMarkets);
router.put('/business/:id/markets', BusinessController.updateBusinessMarkets);

export default router;
