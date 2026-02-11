import AddressService from '../services/AddressService.js';

class AddressController {
    // =========================================================================
    // Customer Endpoints
    // =========================================================================

    async getCustomerAddresses(req, res, next) {
        try {
            const addresses = await AddressService.getCustomerAddresses(req.user.id);
            res.json({ success: true, data: addresses });
        } catch (error) {
            next(error);
        }
    }

    async addCustomerAddress(req, res, next) {
        try {
            const address = await AddressService.addCustomerAddress(req.user.id, req.body);
            res.status(201).json({ success: true, data: address });
        } catch (error) {
            next(error);
        }
    }

    async updateCustomerAddress(req, res, next) {
        try {
            const address = await AddressService.updateCustomerAddress(req.user.id, req.params.id, req.body);
            res.json({ success: true, data: address });
        } catch (error) {
            next(error);
        }
    }

    async deleteCustomerAddress(req, res, next) {
        try {
            await AddressService.deleteCustomerAddress(req.user.id, req.params.id);
            res.json({ success: true, message: 'Address deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    async setDefaultCustomerAddress(req, res, next) {
        try {
            await AddressService.setCustomerDefaultAddress(req.user.id, req.params.id);
            res.json({ success: true, message: 'Default address updated' });
        } catch (error) {
            next(error);
        }
    }

    // =========================================================================
    // Rider Endpoints
    // =========================================================================

    async getRiderAddresses(req, res, next) {
        try {
            const addresses = await AddressService.getRiderAddresses(req.user.id);
            res.json({ success: true, data: addresses });
        } catch (error) {
            next(error);
        }
    }

    async addRiderAddress(req, res, next) {
        try {
            const address = await AddressService.addRiderAddress(req.user.id, req.body);
            res.status(201).json({ success: true, data: address });
        } catch (error) {
            next(error);
        }
    }

    async updateRiderAddress(req, res, next) {
        try {
            const address = await AddressService.updateRiderAddress(req.user.id, req.params.id, req.body);
            res.json({ success: true, data: address });
        } catch (error) {
            next(error);
        }
    }

    async deleteRiderAddress(req, res, next) {
        try {
            await AddressService.deleteRiderAddress(req.user.id, req.params.id);
            res.json({ success: true, message: 'Address deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    // =========================================================================
    // Admin Endpoints
    // =========================================================================

    async getAllAddresses(req, res, next) {
        try {
            const result = await AddressService.getAllAddresses(req.query);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async getAddressById(req, res, next) {
        try {
            const address = await AddressService.findById(req.params.id);
            res.json({ success: true, data: address });
        } catch (error) {
            next(error);
        }
    }

    async createAddress(req, res, next) {
        try {
            // Admin generic create
            // req.body should contain address details
            const address = await AddressService.createAddress(req.body, req.user.id);
            res.status(201).json({ success: true, data: address });
        } catch (error) {
            next(error);
        }
    }

    async updateAddress(req, res, next) {
        try {
            // Admin generic update
            const address = await AddressService.update(req.params.id, req.body);
            res.json({ success: true, data: address });
        } catch (error) {
            next(error);
        }
    }

    async deleteAddress(req, res, next) {
        try {
            // Admin generic delete
            await AddressService.delete(req.params.id);
            res.json({ success: true, message: 'Address deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

export default new AddressController();
