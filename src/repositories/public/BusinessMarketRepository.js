import pool from '../../config/database.js';

class BusinessMarketRepository {
    /**
     * Add markets to a business
     * Edge Case 6: Business operates in multiple markets
     * @param {string} businessId - Business UUID
     * @param {Array<string>} marketIds - Array of market UUIDs
     * @returns {Promise<Array>} - Array of created relationships
     */
    async addMarkets(businessId, marketIds) {
        if (!marketIds || marketIds.length === 0) {
            return [];
        }

        // Build bulk insert query
        const values = [];
        const placeholders = [];

        marketIds.forEach((marketId, index) => {
            const offset = index * 2;
            placeholders.push(`($${offset + 1}, $${offset + 2})`);
            values.push(businessId, marketId);
        });

        const query = `
            INSERT INTO business_markets (business_id, market_id)
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (business_id, market_id) DO NOTHING
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Remove markets from a business
     * @param {string} businessId - Business UUID
     * @param {Array<string>} marketIds - Array of market UUIDs
     * @returns {Promise<number>} - Number of relationships deleted
     */
    async removeMarkets(businessId, marketIds) {
        if (!marketIds || marketIds.length === 0) {
            return 0;
        }

        const placeholders = marketIds.map((_, index) => `$${index + 2}`).join(', ');
        const query = `
            DELETE FROM business_markets
            WHERE business_id = $1 AND market_id IN (${placeholders})
        `;

        const result = await pool.query(query, [businessId, ...marketIds]);
        return result.rowCount;
    }

    /**
     * Get all markets for a business
     * @param {string} businessId - Business UUID
     * @returns {Promise<Array>} - Array of market objects
     */
    async getMarketsByBusinessId(businessId) {
        const result = await pool.query(
            `SELECT m.* 
             FROM markets m
             INNER JOIN business_markets bm ON m.id = bm.market_id
             WHERE bm.business_id = $1
             ORDER BY m.name ASC`,
            [businessId]
        );
        return result.rows;
    }

    /**
     * Get all businesses in a market
     * @param {string} marketId - Market UUID
     * @param {Object} filters - Optional filters (kyc_status, status)
     * @returns {Promise<Array>} - Array of business objects
     */
    async getBusinessesByMarketId(marketId, filters = {}) {
        let query = `
            SELECT b.* 
            FROM businesses b
            INNER JOIN business_markets bm ON b.id = bm.business_id
            WHERE bm.market_id = $1
        `;
        const values = [marketId];
        let paramIndex = 2;

        // Only show approved businesses to customers
        if (filters.kyc_status) {
            query += ` AND b.kyc_status = $${paramIndex}`;
            values.push(filters.kyc_status);
            paramIndex++;
        }

        if (filters.status) {
            query += ` AND b.status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        query += ' ORDER BY b.display_name ASC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Remove all markets from a business
     * @param {string} businessId - Business UUID
     * @returns {Promise<number>} - Number of relationships deleted
     */
    async removeAllMarkets(businessId) {
        const result = await pool.query(
            'DELETE FROM business_markets WHERE business_id = $1',
            [businessId]
        );
        return result.rowCount;
    }

    /**
     * Check if business is linked to a market
     * @param {string} businessId - Business UUID
     * @param {string} marketId - Market UUID
     * @returns {Promise<boolean>} - True if linked
     */
    async isLinked(businessId, marketId) {
        const result = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM business_markets WHERE business_id = $1 AND market_id = $2)',
            [businessId, marketId]
        );
        return result.rows[0].exists;
    }
}

export default new BusinessMarketRepository();
