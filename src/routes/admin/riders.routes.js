import express from 'express';
import RiderController from '../../controllers/RiderController.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requirePermission('users:manage')); // Assuming same permission as user management

router.get('/', RiderController.listRiders);
router.get('/:id/logs', RiderController.getAccessLogs);
router.patch('/:id', RiderController.updateRiderAdmin);
router.post('/:id/verify', RiderController.verifyRider);

export default router;
