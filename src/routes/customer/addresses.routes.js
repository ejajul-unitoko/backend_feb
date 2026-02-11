import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import AddressController from '../../controllers/AddressController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', AddressController.getCustomerAddresses);

router.post('/', AddressController.addCustomerAddress);

router.put('/:id', AddressController.updateCustomerAddress);

router.delete('/:id', AddressController.deleteCustomerAddress);

router.patch('/:id/default', AddressController.setDefaultCustomerAddress);

export default router;
