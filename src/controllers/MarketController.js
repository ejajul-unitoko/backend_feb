import MarketService from '../services/MarketService.js';

class MarketController {
    /**
     * Get all markets (admin)
     */
    async getAllMarkets(req, res, next) {
        try {
            const { city, status } = req.query;
            const filters = {};

            if (city) filters.city = city;
            if (status) filters.status = status;

            const markets = await MarketService.getAllMarkets(filters);

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
     * Get a single market by ID
     */
    async getMarketById(req, res, next) {
        try {
            const { id } = req.params;
            const market = await MarketService.getMarketById(id);

            if (!market) {
                return res.status(404).json({
                    success: false,
                    error: 'Market not found'
                });
            }

            res.json({
                success: true,
                data: market
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Create a new market
     */
    async createMarket(req, res, next) {
        try {
            const { name, description, latitude, longitude } = req.body;

            if (!name || name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Market name is required'
                });
            }

            const adminUserId = req.user.userId;

            const market = await MarketService.createMarket(
                { name, description, latitude, longitude },
                adminUserId
            );

            res.status(201).json({
                success: true,
                message: 'Market created successfully',
                data: market
            });
        } catch (err) {
            if (err.message.includes('Invalid')) {
                return res.status(400).json({
                    success: false,
                    error: err.message
                });
            }
            next(err);
        }
    }

    /**
     * Update a market
     */
    async updateMarket(req, res, next) {
        try {
            const { id } = req.params;
            const { name, description, latitude, longitude, is_public } = req.body;

            const market = await MarketService.updateMarket(id, {
                name,
                description,
                latitude,
                longitude,
                is_public
            });

            res.json({
                success: true,
                message: 'Market updated successfully',
                data: market
            });
        } catch (err) {
            if (err.message === 'Market not found') {
                return res.status(404).json({
                    success: false,
                    error: err.message
                });
            }
            if (err.message.includes('Invalid')) {
                return res.status(400).json({
                    success: false,
                    error: err.message
                });
            }
            next(err);
        }
    }

    /**
     * Toggle market status
     */
    async toggleMarketStatus(req, res, next) {
        try {
            const { id } = req.params;
            const market = await MarketService.toggleMarketStatus(id);

            res.json({
                success: true,
                message: `Market ${market.status === 'active' ? 'activated' : 'deactivated'} successfully`,
                data: market
            });
        } catch (err) {
            if (err.message === 'Market not found') {
                return res.status(404).json({
                    success: false,
                    error: err.message
                });
            }
            next(err);
        }
    }

    /**
     * Delete a market
     */
    async deleteMarket(req, res, next) {
        try {
            const { id } = req.params;
            await MarketService.deleteMarket(id);

            res.json({
                success: true,
                message: 'Market deleted successfully'
            });
        } catch (err) {
            if (err.message === 'Market not found') {
                return res.status(404).json({
                    success: false,
                    error: err.message
                });
            }
            next(err);
        }
    }

    // =========================================================================
    // Public Endpoints
    // =========================================================================

    /**
     * Get public markets
     */
    async getPublicMarkets(req, res, next) {
        try {
            const markets = await MarketService.getPublicMarkets();
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
     * Search public markets
     */
    async searchMarkets(req, res, next) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query (q) is required'
                });
            }

            const markets = await MarketService.searchMarkets(q);
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
     * Get market by slug
     */
    async getMarketBySlug(req, res, next) {
        try {
            const { slug } = req.params;
            const market = await MarketService.getMarketBySlug(slug);

            if (!market) {
                return res.status(404).json({
                    success: false,
                    error: 'Market not found'
                });
            }

            res.json({
                success: true,
                data: market
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new MarketController();
