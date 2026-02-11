import express from 'express';
import BranchUserController from '../../controllers/BranchUserController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Branch user management routes
router.get('/branches/:branchId/users', BranchUserController.getBranchUsers);
router.post('/branches/:branchId/users', BranchUserController.assignUser);
router.put('/branch-users/:id/role', BranchUserController.updateUserRole);
router.patch('/branch-users/:id/activate', BranchUserController.activateUser);
router.patch('/branch-users/:id/revoke', BranchUserController.revokeUser);
router.delete('/branch-users/:id', BranchUserController.deleteUser);

export default router;
