import pool from '../config/database.js';

class AddressRepository {
    /**
     * Create a new address
     * @param {Object} data - Address data
     * @returns {Promise<Object>} - Created address
     */
    async create(data) {
        const {
            user_id,
            purpose,
            address_line_1,
            address_line_2,
            landmark,
            city,
            district,
            state,
            country,
            pincode,
            latitude,
            longitude,
            is_default
        } = data;

        const result = await pool.query(
            `INSERT INTO addresses (
                user_id, purpose, address_line_1, address_line_2, landmark,
                city, district, state, country, pincode,
                latitude, longitude, is_default
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
            [
                user_id,
                purpose,
                address_line_1,
                address_line_2 || null,
                landmark || null,
                city || 'Delhi',
                district || null,
                state || 'Delhi',
                country || 'India',
                pincode,
                latitude || null,
                longitude || null,
                is_default || false
            ]
        );

        return result.rows[0];
    }

    /**
     * Find address by ID
     * @param {string} id - Address UUID
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM addresses WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Update address
     * @param {string} id - Address UUID
     * @param {Object} data - Fields to update
     * @returns {Promise<Object|null>}
     */
    async update(id, data) {
        const allowedFields = [
            'address_line_1', 'address_line_2', 'landmark',
            'city', 'district', 'state', 'country', 'pincode',
            'latitude', 'longitude', 'is_default'
        ];

        const updates = {};
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
            `UPDATE addresses
             SET ${setClause}, updated_at = now()
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING *`,
            values
        );

        return result.rows[0] || null;
    }

    /**
     * Soft delete address
     * @param {string} id - Address UUID
     * @returns {Promise<Object|null>}
     */
    async delete(id) {
        const result = await pool.query(
            `UPDATE addresses
             SET deleted_at = now()
             WHERE id = $1
             RETURNING *`,
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Find addresses by User ID and Purpose
     * @param {string} userId - User UUID
     * @param {string} purpose - Address purpose
     * @returns {Promise<Array>}
     */
    async findByUserAndPurpose(userId, purpose) {
        const result = await pool.query(
            `SELECT * FROM addresses 
             WHERE user_id = $1 AND purpose = $2 AND deleted_at IS NULL
             ORDER BY is_default DESC, created_at DESC`,
            [userId, purpose]
        );
        return result.rows;
    }
}

export default new AddressRepository();
