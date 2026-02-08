import MarketRepository from '../../repositories/public/MarketRepository.js';

class PublicMarketService {
    /**
     * Get all public markets (for UTC/UTB)
     * Only returns active and public markets
     * @param {Object} filters - Optional filters (city)
     * @returns {Promise<Array>} - Array of public, active markets
     */
    async getPublicMarkets(filters = {}) {
        return await MarketRepository.findAll({
            ...filters,
            status: 'active',
            is_public: true
        });
    }

    /**
     * Search markets by name (public)
     * Only searches active and public markets
     * @param {string} query - Search query
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} - Array of matching markets
     */
    async searchMarkets(query, filters = {}) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        return await MarketRepository.search(query, {
            ...filters,
            status: 'active',
            is_public: true
        });
    }

    /**
     * Get a market by slug (public)
     * Only returns if market is active and public
     * @param {string} slug - Market slug
     * @returns {Promise<Object|null>} - Market object or null
     */
    async getMarketBySlug(slug) {
        const market = await MarketRepository.findBySlug(slug);

        // Only return if market is active and public
        if (market && market.status === 'active' && market.is_public) {
            return market;
        }

        return null;
    }
}

export default new PublicMarketService();
