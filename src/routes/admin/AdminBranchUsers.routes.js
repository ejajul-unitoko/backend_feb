import express from 'express';
import BranchUserController from '../../controllers/BranchUserController.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Branch user listing (requires valid permission, e.g., 'users:read' or specific 'branch-users:read')
// Using 'users:read' as a safe default for now, can be refined.
router.get('/branches/:branchId/users', requirePermission('users:read'), BranchUserController.getBranchUsers);

// Branch user actions (requires 'users:update' or specific)
router.patch('/branch-users/:id/revoke', requirePermission('users:update'), BranchUserController.revokeUser);
router.patch('/branch-users/:id/activate', requirePermission('users:update'), BranchUserController.activateUser);
router.delete('/branch-users/:id', requirePermission('users:delete'), BranchUserController.deleteUser);

export default router;
