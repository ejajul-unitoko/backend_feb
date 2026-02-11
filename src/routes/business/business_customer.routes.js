import express from 'express';
import CustomerController from '../../controllers/CustomerController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// UTB: Get customer details for an order (PII access)
router.get('/orders/:orderId/customer/:customerId', authenticate, CustomerController.getCustomerForOrder);

export default router;
