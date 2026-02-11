import express from 'express';
import BusinessController from '../../controllers/BusinessController.js';
import BranchController from '../../controllers/BranchController.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Business listing and search (requires businesses:read)
router.get('/businesses', requirePermission('businesses:read'), BusinessController.getAllBusinesses);
router.get('/businesses/search', requirePermission('businesses:read'), BusinessController.searchBusinesses);
router.get('/businesses/:id', requirePermission('businesses:read'), BusinessController.getBusinessById);
router.get('/markets/:marketId/businesses', requirePermission('businesses:read'), BusinessController.getBusinessesByMarket);
router.get('/businesses/:businessId/branches', requirePermission('businesses:read'), BranchController.getBranchesByBusinessId);

// KYC verification (requires businesses:verify)
router.post('/businesses/:id/verify', requirePermission('businesses:verify'), BusinessController.verifyBusiness);

// Business status management (requires businesses:update)
router.patch('/businesses/:id/suspend', requirePermission('businesses:update'), BusinessController.suspendBusiness);
router.patch('/businesses/:id/activate', requirePermission('businesses:update'), BusinessController.activateBusiness);

export default router;
