import BusinessService from '../../services/business/BusinessService.js';

class BusinessController {
    /**
     * GET /utb/business - Get my business
     * Edge Case 2: Returns null if no business exists
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
     * Edge Case 1: Auto-creates default branch
     * Edge Case 6: Links to multiple markets
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
}

export default new BusinessController();
