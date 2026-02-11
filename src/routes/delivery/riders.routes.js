import express from 'express';
import RiderController from '../../controllers/RiderController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/profile', RiderController.getOwnProfile);
router.patch('/profile', RiderController.updateOwnProfile);
router.patch('/status', RiderController.updateStatus);
router.post('/location', RiderController.updateLocation);

export default router;
