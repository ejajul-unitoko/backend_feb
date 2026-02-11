import BusinessService from '../services/BusinessService.js';

class BusinessController {
    // =========================================================================
    // User / Business Owner Methods
    // =========================================================================

    /**
     * GET /utb/business - Get my business
     */
    async getMyBusiness(req, res, next) {
        try {
            const userId = req.user.userId;
            const business = await BusinessService.getMyBusiness(userId);

            if (!business) {
                return res.json({
                    success: true,
                    exists: false,
                    data: null
                });
            }

            res.json({
                success: true,
                exists: true,
                data: business
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /utb/business - Register new business
     */
    async registerBusiness(req, res, next) {
        try {
            const userId = req.user.userId;
            const business = await BusinessService.registerBusiness(req.body, userId);

            res.status(201).json({
                success: true,
                message: 'Business registered successfully. KYC verification pending.',
                data: business
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * PUT /utb/business/:id - Update business details
     */
    async updateBusiness(req, res, next) {
        try {
            const userId = req.user.userId;
            const businessId = req.params.id;

            const business = await BusinessService.updateBusiness(businessId, req.body, userId);

            res.json({
                success: true,
                message: 'Business updated successfully',
                data: business
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /utb/business/:id/status - Get KYC status
     */
    async getBusinessStatus(req, res, next) {
        try {
            const userId = req.user.userId;
            const businessId = req.params.id;

            const status = await BusinessService.getBusinessStatus(businessId, userId);

            res.json({
                success: true,
                data: status
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /utb/business/:id/markets - Get linked markets
     */
    async getBusinessMarkets(req, res, next) {
        try {
            const userId = req.user.userId;
            const businessId = req.params.id;

            const markets = await BusinessService.getBusinessMarkets(businessId, userId);

            res.json({
                success: true,
                count: markets.length,
                data: markets
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * PUT /utb/business/:id/markets - Update linked markets
     */
    async updateBusinessMarkets(req, res, next) {
        try {
            const userId = req.user.userId;
            const businessId = req.params.id;
            const { market_ids } = req.body;

            const markets = await BusinessService.updateBusinessMarkets(businessId, market_ids, userId);

            res.json({
                success: true,
                message: 'Markets updated successfully',
                count: markets.length,
                data: markets
            });
        } catch (err) {
            next(err);
        }
    }

    // =========================================================================
    // Admin Methods
    // =========================================================================

    /**
     * GET /uta/businesses - Get all businesses
     */
    async getAllBusinesses(req, res, next) {
        try {
            const { kyc_status, status } = req.query;
            const filters = {};

            if (kyc_status) filters.kyc_status = kyc_status;
            if (status) filters.status = status;

            const businesses = await BusinessService.getAllBusinesses(filters);

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
     * GET /uta/businesses/:id - Get business details
     */
    async getBusinessById(req, res, next) {
        try {
            const businessId = req.params.id;
            const business = await BusinessService.getBusinessById(businessId);

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

            const business = await BusinessService.verifyBusiness(
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

            const business = await BusinessService.suspendBusiness(businessId, reason);

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
            const business = await BusinessService.activateBusiness(businessId);

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

            const businesses = await BusinessService.searchBusinesses(q, filters);

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

            const businesses = await BusinessService.getBusinessesByMarket(marketId, filters);

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

export default new BusinessController();
