import express from 'express';
import CustomerController from '../../controllers/CustomerController.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

// UTA: List all customers
router.get('/', authenticate, requirePermission('users:manage'), CustomerController.listCustomers);

// UTA: Get access logs for a specific customer
router.get('/:customerId/logs', authenticate, requirePermission('users:manage'), CustomerController.getAccessLogs);

export default router;
