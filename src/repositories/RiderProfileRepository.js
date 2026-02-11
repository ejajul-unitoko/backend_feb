import pool from '../config/database.js';

class RiderProfileRepository {
    async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM rider_profiles WHERE user_id = $1',
            [userId]
        );
        return result.rows[0];
    }

    async create(data) {
        const {
            user_id, avatar_media_id, vehicle_type, vehicle_number,
            driving_license_number, license_expiry, dl_media_id
        } = data;

        const result = await pool.query(
            `INSERT INTO rider_profiles 
             (user_id, avatar_media_id, vehicle_type, vehicle_number, driving_license_number, license_expiry, dl_media_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [user_id, avatar_media_id, vehicle_type, vehicle_number, driving_license_number, license_expiry, dl_media_id]
        );
        return result.rows[0];
    }

    async update(userId, data) {
        // Filter out updated_at if passed, we handle it explicitly
        const keys = Object.keys(data).filter(key => key !== 'updated_at');
        if (keys.length === 0) return this.findByUserId(userId);

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [userId, ...keys.map(key => data[key])];

        const result = await pool.query(
            `UPDATE rider_profiles 
             SET ${setClause}, updated_at = now()
             WHERE user_id = $1
             RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async updateLocation(userId, latitude, longitude) {
        const result = await pool.query(
            `UPDATE rider_profiles 
             SET last_latitude = $1, last_longitude = $2, last_location_at = now(), updated_at = now()
             WHERE user_id = $3
             RETURNING *`,
            [latitude, longitude, userId]
        );
        return result.rows[0];
    }

    async findAll(filters = {}) {
        let query = `
            SELECT rp.*, u.name, u.email, u.phone, u.status as user_status
            FROM rider_profiles rp
            JOIN users u ON rp.user_id = u.id
            WHERE u.deleted_at IS NULL
        `;
        const values = [];
        let paramIndex = 1;

        if (filters.vehicle_type) {
            query += ` AND rp.vehicle_type = $${paramIndex++}`;
            values.push(filters.vehicle_type);
        }
        if (filters.kyc_status) {
            query += ` AND rp.kyc_status = $${paramIndex++}`;
            values.push(filters.kyc_status);
        }
        if (filters.work_status) {
            query += ` AND rp.work_status = $${paramIndex++}`;
            values.push(filters.work_status);
        }

        query += ' ORDER BY rp.created_at DESC';

        const result = await pool.query(query, values);
        return result.rows;
    }
}

export default new RiderProfileRepository();
