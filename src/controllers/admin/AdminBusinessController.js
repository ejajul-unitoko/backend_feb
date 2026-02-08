import AdminBusinessService from '../../services/admin/BusinessService.js';

class AdminBusinessController {
    /**
     * GET /uta/businesses - Get all businesses (admin view)
     */
    async getAllBusinesses(req, res, next) {
        try {
            const { kyc_status, status } = req.query;
            const filters = {};

            if (kyc_status) filters.kyc_status = kyc_status;
            if (status) filters.status = status;

            const businesses = await AdminBusinessService.getAllBusinesses(filters);

            res.json({
                success: true,
                count: businesses.length,
                data: businesses
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /uta/businesses/:id - Get business details (admin view)
     */
    async getBusinessById(req, res, next) {
        try {
            const businessId = req.params.id;
            const business = await AdminBusinessService.getBusinessById(businessId);

            res.json({
                success: true,
                data: business
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /uta/businesses/:id/verify - Verify business KYC
     * Edge Case 4: Rejection requires remarks
     */
    async verifyBusiness(req, res, next) {
        try {
            const businessId = req.params.id;
            const { kyc_status, kyc_remarks } = req.body;

            if (!kyc_status) {
                return res.status(400).json({
                    success: false,
                    message: 'kyc_status is required (approved or rejected)'
                });
            }

            const business = await AdminBusinessService.verifyBusiness(
                businessId,
                kyc_status,
                kyc_remarks
            );

            res.json({
                success: true,
                message: `Business KYC ${kyc_status} successfully`,
                data: business
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * PATCH /uta/businesses/:id/suspend - Suspend business
     */
    async suspendBusiness(req, res, next) {
        try {
            const businessId = req.params.id;
            const { reason } = req.body;

            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Suspension reason is required'
                });
            }

            const business = await AdminBusinessService.suspendBusiness(businessId, reason);

            res.json({
                success: true,
                message: 'Business suspended successfully',
                data: business
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * PATCH /uta/businesses/:id/activate - Activate business
     */
    async activateBusiness(req, res, next) {
        try {
            const businessId = req.params.id;
            const business = await AdminBusinessService.activateBusiness(businessId);

            res.json({
                success: true,
                message: 'Business activated successfully',
                data: business
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /uta/businesses/search - Search businesses
     */
    async searchBusinesses(req, res, next) {
        try {
            const { q, kyc_status, status } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query (q) is required'
                });
            }

            const filters = {};
            if (kyc_status) filters.kyc_status = kyc_status;
            if (status) filters.status = status;

            const businesses = await AdminBusinessService.searchBusinesses(q, filters);

            res.json({
                success: true,
                count: businesses.length,
                data: businesses
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /uta/markets/:marketId/businesses - Get businesses in a market
     */
    async getBusinessesByMarket(req, res, next) {
        try {
            const marketId = req.params.marketId;
            const { kyc_status, status } = req.query;

            const filters = {};
            if (kyc_status) filters.kyc_status = kyc_status;
            if (status) filters.status = status;

            const businesses = await AdminBusinessService.getBusinessesByMarket(marketId, filters);

            res.json({
                success: true,
                count: businesses.length,
                data: businesses
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new AdminBusinessController();
