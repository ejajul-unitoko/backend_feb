import pool from '../config/database.js';

class RiderAccessLogRepository {
    async create(data) {
        const { accessed_by_user_id, rider_user_id, branch_id, purpose } = data;
        const result = await pool.query(
            `INSERT INTO rider_data_access_logs 
             (accessed_by_user_id, rider_user_id, branch_id, purpose)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [accessed_by_user_id, rider_user_id, branch_id, purpose]
        );
        return result.rows[0];
    }

    async findByRiderId(riderId) {
        const result = await pool.query(
            `SELECT l.*, u.name as accessed_by_name
             FROM rider_data_access_logs l
             LEFT JOIN users u ON l.accessed_by_user_id = u.id
             WHERE l.rider_user_id = $1
             ORDER BY l.created_at DESC`,
            [riderId]
        );
        return result.rows;
    }
}

export default new RiderAccessLogRepository();
