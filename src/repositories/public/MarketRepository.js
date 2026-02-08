import pool from '../../config/database.js';

class MarketRepository {
    /**
     * Find all markets with optional filters
     * @param {Object} filters - { city, status, is_public }
     * @returns {Promise<Array>} - Array of market objects
     */
    async findAll(filters = {}) {
        let query = 'SELECT * FROM markets WHERE 1=1';
        const values = [];
        let paramIndex = 1;

        if (filters.city) {
            query += ` AND city = $${paramIndex}`;
            values.push(filters.city);
            paramIndex++;
        }

        if (filters.status) {
            query += ` AND status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        if (filters.is_public !== undefined) {
            query += ` AND is_public = $${paramIndex}`;
            values.push(filters.is_public);
            paramIndex++;
        }

        query += ' ORDER BY name ASC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Find a single market by ID
     * @param {string} id - Market UUID
     * @returns {Promise<Object|null>} - Market object or null
     */
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM markets WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Find a market by slug
     * @param {string} slug - Market slug
     * @returns {Promise<Object|null>} - Market object or null
     */
    async findBySlug(slug) {
        const result = await pool.query(
            'SELECT * FROM markets WHERE slug = $1',
            [slug]
        );
        return result.rows[0] || null;
    }

    /**
     * Check if a slug already exists
     * @param {string} slug - Slug to check
     * @returns {Promise<boolean>} - True if exists
     */
    async slugExists(slug) {
        const result = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM markets WHERE slug = $1)',
            [slug]
        );
        return result.rows[0].exists;
    }

    /**
     * Search markets by name using full-text search
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters (city, status, is_public)
     * @returns {Promise<Array>} - Array of matching markets
     */
    async search(query, filters = {}) {
        let sql = `
            SELECT *
            FROM markets
            WHERE to_tsvector('english', name) @@ plainto_tsquery('english', $1)
        `;
        const values = [query];
        let paramIndex = 2;

        if (filters.status) {
            sql += ` AND status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        if (filters.is_public !== undefined) {
            sql += ` AND is_public = $${paramIndex}`;
            values.push(filters.is_public);
            paramIndex++;
        }

        if (filters.city) {
            sql += ` AND city = $${paramIndex}`;
            values.push(filters.city);
            paramIndex++;
        }

        sql += ' ORDER BY name ASC';

        const result = await pool.query(sql, values);
        return result.rows;
    }

    /**
     * Create a new market
     * @param {Object} data - Market data
     * @returns {Promise<Object>} - Created market
     */
    async create(data) {
        const {
            name,
            slug,
            description,
            city,
            state,
            country,
            latitude,
            longitude,
            status,
            is_public,
            created_by
        } = data;

        const result = await pool.query(
            `INSERT INTO markets (
                name, slug, description, city, state, country,
                latitude, longitude, status, is_public, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                name,
                slug,
                description || null,
                city || 'Delhi',
                state || 'Delhi',
                country || 'India',
                latitude || null,
                longitude || null,
                status || 'active',
                is_public !== undefined ? is_public : true,
                created_by
            ]
        );

        return result.rows[0];
    }

    /**
     * Update a market
     * @param {string} id - Market UUID
     * @param {Object} data - Fields to update
     * @returns {Promise<Object|null>} - Updated market or null
     */
    async update(id, data) {
        const allowedFields = ['name', 'slug', 'description', 'latitude', 'longitude', 'is_public'];
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
            `UPDATE markets
             SET ${setClause}, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            values
        );

        return result.rows[0] || null;
    }

    /**
     * Update market status
     * @param {string} id - Market UUID
     * @param {string} status - 'active' or 'inactive'
     * @returns {Promise<Object|null>} - Updated market or null
     */
    async updateStatus(id, status) {
        const result = await pool.query(
            `UPDATE markets
             SET status = $2, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [id, status]
        );

        return result.rows[0] || null;
    }

    /**
     * Delete a market (hard delete)
     * @param {string} id - Market UUID
     * @returns {Promise<Object|null>} - Deleted market or null
     */
    async delete(id) {
        const result = await pool.query(
            'DELETE FROM markets WHERE id = $1 RETURNING *',
            [id]
        );

        return result.rows[0] || null;
    }
}

export default new MarketRepository();
