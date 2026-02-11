import express from 'express';
import ProductController from '../../controllers/ProductController.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

// Admin Product Management (Global Catalog)
// router.use(authenticate, requirePermission('super_admin')); // OLD

router.get('/trash/all', authenticate, requirePermission('products:read'), ProductController.getTrash);
router.get('/', authenticate, requirePermission('products:read'), ProductController.getAllProducts);
router.get('/:id', authenticate, requirePermission('products:read'), ProductController.getProductById);
router.post('/', authenticate, requirePermission('products:manage'), ProductController.createProduct);
router.put('/:id', authenticate, requirePermission('products:manage'), ProductController.updateProduct);
router.delete('/:id', authenticate, requirePermission('products:manage'), ProductController.deleteProduct);

// Trash Actions
router.post('/:id/restore', authenticate, requirePermission('products:manage'), ProductController.restoreProduct);

// Approval Workflow
router.patch('/business-products/:id/approval', authenticate, requirePermission('products:manage'), ProductController.approveBusinessProduct);



// Master Product Details (360 view)
router.get('/:id/master', authenticate, requirePermission('products:read'), ProductController.getMasterProductDetails);

export default router;
