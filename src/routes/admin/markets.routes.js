import express from 'express';
import MarketController from '../../controllers/MarketController.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all markets (admin view)
router.get('/', requirePermission('markets:read'), MarketController.getAllMarkets);

// Get single market by ID
router.get('/:id', requirePermission('markets:read'), MarketController.getMarketById);

// Create new market
router.post('/', requirePermission('markets:create'), MarketController.createMarket);

// Update market
router.put('/:id', requirePermission('markets:update'), MarketController.updateMarket);

// Toggle market status
router.patch('/:id/status', requirePermission('markets:update'), MarketController.toggleMarketStatus);

// Delete market
router.delete('/:id', requirePermission('markets:update'), MarketController.deleteMarket);

export default router;
