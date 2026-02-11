import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import AddressController from '../../controllers/AddressController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', AddressController.getRiderAddresses);

router.post('/', AddressController.addRiderAddress);

router.put('/:id', AddressController.updateRiderAddress);

router.delete('/:id', AddressController.deleteRiderAddress);

export default router;
