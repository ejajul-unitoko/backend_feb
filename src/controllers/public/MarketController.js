import MarketService from '../../services/public/MarketService.js';

class MarketController {
    /**
     * Get all public markets
     * GET /api/public/markets?city=Delhi
     */
    async getPublicMarkets(req, res, next) {
        try {
            const { city } = req.query;
            const filters = {};

            if (city) {
                filters.city = city;
            }

            const markets = await MarketService.getPublicMarkets(filters);

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
     * Search markets by name
     * GET /api/public/markets/search?q=chandni
     */
    async searchMarkets(req, res, next) {
        try {
            const { q, city } = req.query;

            if (!q || q.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
            }

            const filters = {};
            if (city) {
                filters.city = city;
            }

            const markets = await MarketService.searchMarkets(q, filters);

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
     * GET /api/public/markets/:slug
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
