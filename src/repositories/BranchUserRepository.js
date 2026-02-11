import pool from '../config/database.js';

class BranchUserRepository {
    /**
     * Find all branch users with optional filters
     * @param {Object} filters - { branch_id, user_id, role, status }
     * @returns {Promise<Array>} - Array of branch user objects
     */
    async findAll(filters = {}) {
        let query = 'SELECT * FROM branch_users WHERE 1=1';
        const values = [];
        let paramIndex = 1;

        if (filters.branch_id) {
            query += ` AND branch_id = $${paramIndex}`;
            values.push(filters.branch_id);
            paramIndex++;
        }

        if (filters.user_id) {
            query += ` AND user_id = $${paramIndex}`;
            values.push(filters.user_id);
            paramIndex++;
        }

        if (filters.role) {
            query += ` AND role = $${paramIndex}`;
            values.push(filters.role);
            paramIndex++;
        }

        if (filters.status) {
            query += ` AND status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Find a single branch user by ID
     * @param {string} id - Branch user UUID
     * @returns {Promise<Object|null>} - Branch user object or null
     */
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM branch_users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Find all users for a branch
     * @param {string} branchId - Branch UUID
     * @returns {Promise<Array>} - Array of branch user objects with user details
     */
    async findByBranchId(branchId) {
        const result = await pool.query(
            `SELECT bu.*, u.email, u.name, u.phone
             FROM branch_users bu
             INNER JOIN users u ON bu.user_id = u.id
             WHERE bu.branch_id = $1
             ORDER BY bu.created_at DESC`,
            [branchId]
        );
        return result.rows;
    }

    /**
     * Find all branches for a user
     * Edge Case 5: Manager gets only assigned branches
     * @param {string} userId - User UUID
     * @returns {Promise<Array>} - Array of branch user objects with branch details
     */
    async findByUserId(userId) {
        const result = await pool.query(
            `SELECT bu.*, b.name as branch_name, b.address, b.business_id
             FROM branch_users bu
             INNER JOIN branches b ON bu.branch_id = b.id
             WHERE bu.user_id = $1 AND bu.status = 'active'
             ORDER BY bu.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Create a branch user assignment
     * Edge Case 3: Assign user to branch (may be pending if email is wrong)
     * @param {Object} data - Branch user data
     * @returns {Promise<Object>} - Created branch user
     */
    async create(data) {
        const {
            branch_id,
            user_id,
            role,
            status
        } = data;

        const result = await pool.query(
            `INSERT INTO branch_users (
                branch_id, user_id, role, status
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                branch_id,
                user_id,
                role,
                status || 'active'
            ]
        );

        return result.rows[0];
    }

    /**
     * Update user role
     * @param {string} id - Branch user UUID
     * @param {string} role - New role
     * @returns {Promise<Object|null>} - Updated branch user or null
     */
    async updateRole(id, role) {
        const result = await pool.query(
            `UPDATE branch_users
             SET role = $2, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [id, role]
        );

        return result.rows[0] || null;
    }

    /**
     * Update user status
     * @param {string} id - Branch user UUID
     * @param {string} status - 'active' or 'revoked'
     * @returns {Promise<Object|null>} - Updated branch user or null
     */
    async updateStatus(id, status) {
        const result = await pool.query(
            `UPDATE branch_users
             SET status = $2, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [id, status]
        );

        return result.rows[0] || null;
    }

    /**
     * Delete a branch user (hard delete)
     * @param {string} id - Branch user UUID
     * @returns {Promise<Object|null>} - Deleted branch user or null
     */
    async delete(id) {
        const result = await pool.query(
            'DELETE FROM branch_users WHERE id = $1 RETURNING *',
            [id]
        );

        return result.rows[0] || null;
    }

    /**
     * Check if user is assigned to branch
     * @param {string} branchId - Branch UUID
     * @param {string} userId - User UUID
     * @returns {Promise<Object|null>} - Branch user object or null
     */
    async findByBranchAndUser(branchId, userId) {
        const result = await pool.query(
            'SELECT * FROM branch_users WHERE branch_id = $1 AND user_id = $2',
            [branchId, userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Get all active branch assignments for a user
     * @param {string} userId - User UUID
     * @returns {Promise<Array>} - Array of active branch assignments
     */
    async getActiveBranchesByUserId(userId) {
        const result = await pool.query(
            `SELECT bu.*, b.*
             FROM branch_users bu
             INNER JOIN branches b ON bu.branch_id = b.id
             WHERE bu.user_id = $1 AND bu.status = 'active' AND b.status = 'active'
             ORDER BY b.is_primary DESC, b.created_at ASC`,
            [userId]
        );
        return result.rows;
    }
}

export default new BranchUserRepository();
