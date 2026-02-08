import express from 'express';
import BranchController from '../../controllers/business/BranchController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Branch management routes
router.get('/branches', BranchController.getMyBranches);
router.get('/branches/:id', BranchController.getBranchById);
router.post('/branches', BranchController.createBranch);
router.put('/branches/:id', BranchController.updateBranch);
router.delete('/branches/:id', BranchController.deleteBranch);
router.patch('/branches/:id/toggle-status', BranchController.toggleBranchStatus);

export default router;
