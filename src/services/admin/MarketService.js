import MarketRepository from '../../repositories/public/MarketRepository.js';
import { slugify, generateUniqueSlug } from '../../utils/slugify.js';

class AdminMarketService {
    /**
     * Get all markets (admin view)
     * Returns all markets regardless of status or visibility
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} - Array of all markets
     */
    async getAllMarkets(filters = {}) {
        return await MarketRepository.findAll(filters);
    }

    /**
     * Get a single market by ID (admin)
     * @param {string} id - Market UUID
     * @returns {Promise<Object|null>} - Market object or null
     */
    async getMarketById(id) {
        return await MarketRepository.findById(id);
    }

    /**
     * Create a new market (admin only)
     * @param {Object} data - Market data
     * @param {string} adminUserId - ID of admin creating the market
     * @returns {Promise<Object>} - Created market
     */
    async createMarket(data, adminUserId) {
        const { name, description, latitude, longitude } = data;

        // Validation
        if (!name || name.trim().length === 0) {
            throw new Error('Market name is required');
        }

        // Generate unique slug
        const baseSlug = slugify(name);
        const uniqueSlug = await generateUniqueSlug(
            baseSlug,
            async (slug) => await MarketRepository.slugExists(slug)
        );

        // Validate coordinates if provided
        if (latitude !== undefined && latitude !== null) {
            const lat = parseFloat(latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                throw new Error('Invalid latitude. Must be between -90 and 90');
            }
        }

        if (longitude !== undefined && longitude !== null) {
            const lon = parseFloat(longitude);
            if (isNaN(lon) || lon < -180 || lon > 180) {
                throw new Error('Invalid longitude. Must be between -180 and 180');
            }
        }

        // Create market
        const marketData = {
            name: name.trim(),
            slug: uniqueSlug,
            description: description?.trim() || null,
            latitude: latitude || null,
            longitude: longitude || null,
            city: 'Delhi',  // V1 constraint
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
     * @param {string} id - Market UUID
     * @param {Object} data - Fields to update
     * @returns {Promise<Object>} - Updated market
     */
    async updateMarket(id, data) {
        const market = await MarketRepository.findById(id);
        if (!market) {
            throw new Error('Market not found');
        }

        const updateData = {};

        // Handle name update (regenerate slug if name changes)
        if (data.name && data.name.trim() !== market.name) {
            updateData.name = data.name.trim();

            // Generate new unique slug
            const baseSlug = slugify(data.name);
            updateData.slug = await generateUniqueSlug(
                baseSlug,
                async (slug) => {
                    // Exclude current market from uniqueness check
                    const existing = await MarketRepository.findBySlug(slug);
                    return existing && existing.id !== id;
                }
            );
        }

        // Handle other fields
        if (data.description !== undefined) {
            updateData.description = data.description?.trim() || null;
        }

        if (data.latitude !== undefined) {
            if (data.latitude !== null) {
                const lat = parseFloat(data.latitude);
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    throw new Error('Invalid latitude. Must be between -90 and 90');
                }
                updateData.latitude = lat;
            } else {
                updateData.latitude = null;
            }
        }

        if (data.longitude !== undefined) {
            if (data.longitude !== null) {
                const lon = parseFloat(data.longitude);
                if (isNaN(lon) || lon < -180 || lon > 180) {
                    throw new Error('Invalid longitude. Must be between -180 and 180');
                }
                updateData.longitude = lon;
            } else {
                updateData.longitude = null;
            }
        }

        if (data.is_public !== undefined) {
            updateData.is_public = Boolean(data.is_public);
        }

        const updated = await MarketRepository.update(id, updateData);
        if (!updated) {
            throw new Error('Failed to update market');
        }

        return updated;
    }

    /**
     * Toggle market status (active/inactive)
     * @param {string} id - Market UUID
     * @returns {Promise<Object>} - Updated market
     */
    async toggleMarketStatus(id) {
        const market = await MarketRepository.findById(id);
        if (!market) {
            throw new Error('Market not found');
        }

        const newStatus = market.status === 'active' ? 'inactive' : 'active';
        const updated = await MarketRepository.updateStatus(id, newStatus);

        if (!updated) {
            throw new Error('Failed to update market status');
        }

        return updated;
    }

    /**
     * Delete a market (admin only)
     * @param {string} id - Market UUID
     * @returns {Promise<Object>} - Deleted market
     */
    async deleteMarket(id) {
        const market = await MarketRepository.findById(id);
        if (!market) {
            throw new Error('Market not found');
        }

        const deleted = await MarketRepository.delete(id);
        if (!deleted) {
            throw new Error('Failed to delete market');
        }

        return deleted;
    }
}

export default new AdminMarketService();
