import CustomerService from '../services/CustomerService.js';

class CustomerController {
    /**
     * UTC: Get own profile
     */
    async getOwnProfile(req, res, next) {
        try {
            const profile = await CustomerService.getProfile(req.user.userId);
            res.json(profile);
        } catch (err) { next(err); }
    }

    /**
     * UTC: Update own profile
     */
    async updateOwnProfile(req, res, next) {
        try {
            const profile = await CustomerService.updateProfile(req.user.userId, req.body);
            res.json(profile);
        } catch (err) { next(err); }
    }

    /**
     * UTB: Get customer profile for an order
     * Requires branch_id context from the order
     */
    async getCustomerForOrder(req, res, next) {
        try {
            const { customerId } = req.params;
            const { branchId, orderId } = req.query; // Context for logging

            if (!branchId) return res.status(400).json({ error: 'branchId is required for audit' });

            const requester = {
                userId: req.user.userId,
                branchId,
                purpose: `order_fulfillment:${orderId || 'unknown'}`
            };

            const profile = await CustomerService.getProfile(customerId, requester);

            // Limit fields for UTB visibility (Privacy by design)
            const sanitized = {
                name: profile.name,
                phone: profile.phone,
                avatar_url: profile.avatar_url
            };

            res.json(sanitized);
        } catch (err) { next(err); }
    }

    /**
     * UTA: List all customers
     */
    async listCustomers(req, res, next) {
        try {
            const customers = await CustomerService.getAllCustomers(req.query);
            res.json(customers);
        } catch (err) { next(err); }
    }

    /**
     * UTA: Get access logs
     */
    async getAccessLogs(req, res, next) {
        try {
            const { customerId } = req.params;
            const logs = await CustomerService.getAccessLogs(customerId);
            res.json(logs);
        } catch (err) { next(err); }
    }
}

export default new CustomerController();
