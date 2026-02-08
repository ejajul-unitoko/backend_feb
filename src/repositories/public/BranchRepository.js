import pool from '../../config/database.js';

class BranchRepository {
    /**
     * Find all branches with optional filters
     * @param {Object} filters - { business_id, status }
     * @returns {Promise<Array>} - Array of branch objects
     */
    async findAll(filters = {}) {
        let query = 'SELECT * FROM branches WHERE 1=1';
        const values = [];
        let paramIndex = 1;

        if (filters.business_id) {
            query += ` AND business_id = $${paramIndex}`;
            values.push(filters.business_id);
            paramIndex++;
        }

        if (filters.status) {
            query += ` AND status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        query += ' ORDER BY is_primary DESC, created_at ASC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Find a single branch by ID
     * @param {string} id - Branch UUID
     * @returns {Promise<Object|null>} - Branch object or null
     */
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM branches WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Find all branches for a business
     * @param {string} businessId - Business UUID
     * @returns {Promise<Array>} - Array of branch objects
     */
    async findByBusinessId(businessId) {
        const result = await pool.query(
            'SELECT * FROM branches WHERE business_id = $1 ORDER BY is_primary DESC, created_at ASC',
            [businessId]
        );
        return result.rows;
    }

    /**
     * Find primary branch for a business
     * Edge Case 1: Auto-created default branch
     * @param {string} businessId - Business UUID
     * @returns {Promise<Object|null>} - Primary branch or null
     */
    async findPrimaryBranch(businessId) {
        const result = await pool.query(
            'SELECT * FROM branches WHERE business_id = $1 AND is_primary = true LIMIT 1',
            [businessId]
        );
        return result.rows[0] || null;
    }

    /**
     * Create a new branch
     * @param {Object} data - Branch data
     * @returns {Promise<Object>} - Created branch
     */
    async create(data) {
        const {
            business_id,
            name,
            address,
            latitude,
            longitude,
            is_primary,
            status
        } = data;

        const result = await pool.query(
            `INSERT INTO branches (
                business_id, name, address, latitude, longitude,
                is_primary, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                business_id,
                name,
                address,
                latitude || null,
                longitude || null,
                is_primary || false,
                status || 'active'
            ]
        );

        return result.rows[0];
    }

    /**
     * Update a branch
     * @param {string} id - Branch UUID
     * @param {Object} data - Fields to update
     * @returns {Promise<Object|null>} - Updated branch or null
     */
    async update(id, data) {
        const allowedFields = ['name', 'address', 'latitude', 'longitude'];
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
            `UPDATE branches
             SET ${setClause}, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            values
        );

        return result.rows[0] || null;
    }

    /**
     * Update branch status
     * @param {string} id - Branch UUID
     * @param {string} status - 'active' or 'inactive'
     * @returns {Promise<Object|null>} - Updated branch or null
     */
    async updateStatus(id, status) {
        const result = await pool.query(
            `UPDATE branches
             SET status = $2, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [id, status]
        );

        return result.rows[0] || null;
    }

    /**
     * Delete a branch (hard delete)
     * @param {string} id - Branch UUID
     * @returns {Promise<Object|null>} - Deleted branch or null
     */
    async delete(id) {
        const result = await pool.query(
            'DELETE FROM branches WHERE id = $1 RETURNING *',
            [id]
        );

        return result.rows[0] || null;
    }

    /**
     * Count branches for a business
     * @param {string} businessId - Business UUID
     * @returns {Promise<number>} - Number of branches
     */
    async countByBusinessId(businessId) {
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM branches WHERE business_id = $1',
            [businessId]
        );
        return parseInt(result.rows[0].count);
    }
}

export default new BranchRepository();
