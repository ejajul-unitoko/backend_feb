import express from 'express';
import AdminMarketController from '../../controllers/admin/AdminMarketController.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all markets (admin view)
router.get('/', requirePermission('markets:read'), AdminMarketController.getAllMarkets);

// Get single market by ID
router.get('/:id', requirePermission('markets:read'), AdminMarketController.getMarketById);

// Create new market
router.post('/', requirePermission('markets:create'), AdminMarketController.createMarket);

// Update market
router.put('/:id', requirePermission('markets:update'), AdminMarketController.updateMarket);

// Toggle market status
router.patch('/:id/status', requirePermission('markets:update'), AdminMarketController.toggleMarketStatus);

// Delete market
router.delete('/:id', requirePermission('markets:update'), AdminMarketController.deleteMarket);

export default router;
