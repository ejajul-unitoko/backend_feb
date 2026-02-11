import express from 'express';
import CategoryController from '../../controllers/CategoryController.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

// All category routes require admin access
// router.use(authenticate, requirePermission('super_admin')); // OLD

router.get('/', authenticate, requirePermission('categories:read'), CategoryController.getAllCategories);
router.get('/:id', authenticate, requirePermission('categories:read'), CategoryController.getCategoryById);
router.post('/', authenticate, requirePermission('categories:manage'), CategoryController.createCategory);
router.put('/:id', authenticate, requirePermission('categories:manage'), CategoryController.updateCategory);
router.delete('/:id', authenticate, requirePermission('categories:manage'), CategoryController.deleteCategory);

export default router;
