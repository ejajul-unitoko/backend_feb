import express from 'express';
import ProductController from '../../controllers/ProductController.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

// Business Owner / Manager Access
// TODO: Add stricter permission checks (e.g., 'manage_inventory') if we differentiate roles further
router.use(authenticate);

// List products in a branch
router.get('/branches/:branchId/products', ProductController.getBranchProducts);

// List My Business Products (Ownership Level)
router.get('/my-products', ProductController.getMyBusinessProducts);

// Create New Business Product (Private)
router.post('/my-products', ProductController.createMyProduct);

// Add global product to branch (Selling setup)
router.post('/branches/:branchId/products', ProductController.addProductToBranch);

// Update Price (Branch Product)
router.put('/branch-products/:id/price', ProductController.updateBranchProductPrice);

// Update Stock (Branch Product) - Inventory Management
router.put('/branch-products/:id/stock', ProductController.updateStock);

// View Inventory Logs
router.get('/branch-products/:id/logs', ProductController.getInventoryLogs);

export default router;
