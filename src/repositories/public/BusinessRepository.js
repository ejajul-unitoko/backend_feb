import pool from '../../config/database.js';

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
            logo_media_id
        } = data;

        const result = await pool.query(
            `INSERT INTO businesses (
                owner_user_id, legal_name, display_name, business_type,
                pan, gstin, registered_address, logo_media_id,
                kyc_status, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                owner_user_id,
                legal_name,
                display_name,
                business_type,
                pan,
                gstin || null,
                registered_address,
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
            'pan', 'gstin', 'registered_address', 'logo_media_id'
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
}

export default new BusinessRepository();
