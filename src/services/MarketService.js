import MarketRepository from '../repositories/MarketRepository.js';
import { slugify, generateUniqueSlug } from '../utils/slugify.js';

class MarketService {
    /**
     * Get all markets (admin view)
     */
    async getAllMarkets(filters = {}) {
        return await MarketRepository.findAll(filters);
    }

    /**
     * Get a single market by ID (admin)
     */
    async getMarketById(id) {
        return await MarketRepository.findById(id);
    }

    /**
     * Create a new market (admin only)
     */
    async createMarket(data, adminUserId) {
        const { name, description, latitude, longitude } = data;

        if (!name || name.trim().length === 0) throw new Error('Market name is required');

        const baseSlug = slugify(name);
        const uniqueSlug = await generateUniqueSlug(
            baseSlug,
            async (slug) => await MarketRepository.slugExists(slug)
        );

        if (latitude !== undefined && latitude !== null) {
            const lat = parseFloat(latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) throw new Error('Invalid latitude. Must be between -90 and 90');
        }

        if (longitude !== undefined && longitude !== null) {
            const lon = parseFloat(longitude);
            if (isNaN(lon) || lon < -180 || lon > 180) throw new Error('Invalid longitude. Must be between -180 and 180');
        }

        const marketData = {
            name: name.trim(),
            slug: uniqueSlug,
            description: description?.trim() || null,
            latitude: latitude || null,
            longitude: longitude || null,
            city: 'Delhi',
            state: 'Delhi',
            country: 'India',
            status: 'active',
            is_public: true,
            created_by: adminUserId
        };

        return await MarketRepository.create(marketData);
    }

    /**
     * Update a market (admin only)
     */
    async updateMarket(id, data) {
        const market = await MarketRepository.findById(id);
        if (!market) throw new Error('Market not found');

        const updateData = {};

        if (data.name && data.name.trim() !== market.name) {
            updateData.name = data.name.trim();
            const baseSlug = slugify(data.name);
            updateData.slug = await generateUniqueSlug(
                baseSlug,
                async (slug) => {
                    const existing = await MarketRepository.findBySlug(slug);
                    return existing && existing.id !== id;
                }
            );
        }

        if (data.description !== undefined) updateData.description = data.description?.trim() || null;

        if (data.latitude !== undefined) {
            if (data.latitude !== null) {
                const lat = parseFloat(data.latitude);
                if (isNaN(lat) || lat < -90 || lat > 90) throw new Error('Invalid latitude. Must be between -90 and 90');
                updateData.latitude = lat;
            } else {
                updateData.latitude = null;
            }
        }

        if (data.longitude !== undefined) {
            if (data.longitude !== null) {
                const lon = parseFloat(data.longitude);
                if (isNaN(lon) || lon < -180 || lon > 180) throw new Error('Invalid longitude. Must be between -180 and 180');
                updateData.longitude = lon;
            } else {
                updateData.longitude = null;
            }
        }

        if (data.is_public !== undefined) updateData.is_public = Boolean(data.is_public);

        const updated = await MarketRepository.update(id, updateData);
        if (!updated) throw new Error('Failed to update market');

        return updated;
    }

    /**
     * Toggle market status (active/inactive)
     */
    async toggleMarketStatus(id) {
        const market = await MarketRepository.findById(id);
        if (!market) throw new Error('Market not found');

        const newStatus = market.status === 'active' ? 'inactive' : 'active';
        const updated = await MarketRepository.updateStatus(id, newStatus);

        if (!updated) throw new Error('Failed to update market status');

        return updated;
    }

    /**
     * Delete a market (admin only)
     */
    async deleteMarket(id) {
        const market = await MarketRepository.findById(id);
        if (!market) throw new Error('Market not found');

        const deleted = await MarketRepository.delete(id);
        if (!deleted) throw new Error('Failed to delete market');

        return deleted;
    }

    // =========================================================================
    // Public Methods
    // =========================================================================

    /**
     * Get all public active markets
     */
    async getPublicMarkets() {
        return await MarketRepository.findAll({ is_public: true, status: 'active' });
    }

    /**
     * Search public active markets
     */
    async searchMarkets(query) {
        return await MarketRepository.search(query, { is_public: true, status: 'active' });
    }

    /**
     * Get market by slug (public)
     */
    async getMarketBySlug(slug) {
        const market = await MarketRepository.findBySlug(slug);
        if (!market) return null;

        // Ensure it's public and active if accessed via public route? 
        // Usually yes, but let controller decide or filter here.
        // Let's return it and let controller check status if strictness needed.
        // Or better: filter here.
        if (!market.is_public || market.status !== 'active') return null;

        return market;
    }
}

export default new MarketService();
