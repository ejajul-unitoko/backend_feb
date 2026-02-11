import pool from '../config/database.js';

class BusinessRepository {
    /**
     * Find all businesses with optional filters
     * @param {Object} filters - { kyc_status, status, owner_user_id }
     * @returns {Promise<Array>} - Array of business objects
     */
    async findAll(filters = {}) {
        let query = 'SELECT * FROM businesses WHERE 1=1';
        const values = [];
        let paramIndex = 1;

        if (filters.kyc_status) {
            query += ` AND kyc_status = $${paramIndex}`;
            values.push(filters.kyc_status);
            paramIndex++;
        }

        if (filters.status) {
            query += ` AND status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        if (filters.owner_user_id) {
            query += ` AND owner_user_id = $${paramIndex}`;
            values.push(filters.owner_user_id);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Find a single business by ID
     * @param {string} id - Business UUID
     * @returns {Promise<Object|null>} - Business object or null
     */
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM businesses WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Find business by owner user ID
     * Edge Case 2: Check if user already owns a business
     * @param {string} userId - Owner user UUID
     * @returns {Promise<Object|null>} - Business object or null
     */
    async findByOwnerId(userId) {
        const result = await pool.query(
            'SELECT * FROM businesses WHERE owner_user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Create a new business
     * @param {Object} data - Business data
     * @returns {Promise<Object>} - Created business
     */
    async create(data) {
        const {
            owner_user_id,
            legal_name,
            display_name,
            business_type,
            pan,
            gstin,
            registered_address,
            registered_address_id,
            logo_media_id
        } = data;

        const result = await pool.query(
            `INSERT INTO businesses (
                owner_user_id, legal_name, display_name, business_type,
                pan, gstin, registered_address, registered_address_id, logo_media_id,
                kyc_status, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                owner_user_id,
                legal_name,
                display_name,
                business_type,
                pan,
                gstin || null,
                registered_address,
                registered_address_id || null,
                logo_media_id || null,
                'pending', // Default KYC status
                'active'   // Default status
            ]
        );

        return result.rows[0];
    }

    /**
     * Update a business
     * @param {string} id - Business UUID
     * @param {Object} data - Fields to update
     * @returns {Promise<Object|null>} - Updated business or null
     */
    async update(id, data) {
        const allowedFields = [
            'legal_name', 'display_name', 'business_type',
            'pan', 'gstin', 'registered_address', 'registered_address_id', 'logo_media_id'
        ];
        const updates = {};

        // Filter only allowed fields
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates[field] = data[field];
            }
        }

        const keys = Object.keys(updates);
        if (keys.length === 0) return null;

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...Object.values(updates)];

        const result = await pool.query(
            `UPDATE businesses
             SET ${setClause}, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            values
        );

        return result.rows[0] || null;
    }

    /**
     * Update KYC status (admin only)
     * Edge Case 4: Business rejected with remarks
     * @param {string} id - Business UUID
     * @param {string} status - 'approved' or 'rejected'
     * @param {string} remarks - Admin remarks (required for rejection)
     * @returns {Promise<Object|null>} - Updated business or null
     */
    async updateKycStatus(id, status, remarks = null) {
        const result = await pool.query(
            `UPDATE businesses
             SET kyc_status = $2, kyc_remarks = $3, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [id, status, remarks]
        );

        return result.rows[0] || null;
    }

    /**
     * Update business status (admin only)
     * @param {string} id - Business UUID
     * @param {string} status - 'active' or 'suspended'
     * @returns {Promise<Object|null>} - Updated business or null
     */
    async updateStatus(id, status) {
        const result = await pool.query(
            `UPDATE businesses
             SET status = $2, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [id, status]
        );

        return result.rows[0] || null;
    }

    /**
     * Delete a business (hard delete)
     * @param {string} id - Business UUID
     * @returns {Promise<Object|null>} - Deleted business or null
     */
    async delete(id) {
        const result = await pool.query(
            'DELETE FROM businesses WHERE id = $1 RETURNING *',
            [id]
        );

        return result.rows[0] || null;
    }

    /**
     * Search businesses by name
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} - Array of matching businesses
     */
    /**
     * Search businesses by name
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} - Array of matching businesses
     */
    async search(query, filters = {}) {
        let sql = `
            SELECT *
            FROM businesses
            WHERE (
                to_tsvector('english', legal_name) @@ plainto_tsquery('english', $1)
                OR to_tsvector('english', display_name) @@ plainto_tsquery('english', $1)
            )
        `;
        const values = [query];
        let paramIndex = 2;

        if (filters.kyc_status) {
            sql += ` AND kyc_status = $${paramIndex}`;
            values.push(filters.kyc_status);
            paramIndex++;
        }

        if (filters.status) {
            sql += ` AND status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        sql += ' ORDER BY created_at DESC';

        const result = await pool.query(sql, values);
        return result.rows;
    }

    // =========================================================================
    // BusinessMarket Methods (Merged)
    // =========================================================================

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

export default new BusinessRepository();
