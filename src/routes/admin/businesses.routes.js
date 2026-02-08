import express from 'express';
import AdminBusinessController from '../../controllers/admin/AdminBusinessController.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Business listing and search (requires businesses:read)
router.get('/businesses', requirePermission('businesses:read'), AdminBusinessController.getAllBusinesses);
router.get('/businesses/search', requirePermission('businesses:read'), AdminBusinessController.searchBusinesses);
router.get('/businesses/:id', requirePermission('businesses:read'), AdminBusinessController.getBusinessById);
router.get('/markets/:marketId/businesses', requirePermission('businesses:read'), AdminBusinessController.getBusinessesByMarket);

// KYC verification (requires businesses:verify)
router.post('/businesses/:id/verify', requirePermission('businesses:verify'), AdminBusinessController.verifyBusiness);

// Business status management (requires businesses:update)
router.patch('/businesses/:id/suspend', requirePermission('businesses:update'), AdminBusinessController.suspendBusiness);
router.patch('/businesses/:id/activate', requirePermission('businesses:update'), AdminBusinessController.activateBusiness);

export default router;
