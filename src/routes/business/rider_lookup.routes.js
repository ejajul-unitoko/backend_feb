import express from 'express';
import RiderController from '../../controllers/RiderController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Limited visibility for businesses during order fulfillment
router.get('/:riderId', RiderController.getRiderForBusiness);

export default router;
