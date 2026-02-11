import pool from '../config/database.js';

class AccessLogRepository {
    async create(data) {
        const {
            accessed_by_user_id, customer_user_id, branch_id, purpose
        } = data;

        const result = await pool.query(
            `INSERT INTO customer_data_access_logs 
             (accessed_by_user_id, customer_user_id, branch_id, purpose)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [accessed_by_user_id, customer_user_id, branch_id, purpose]
        );
        return result.rows[0];
    }

    async findByCustomerId(customerId) {
        const result = await pool.query(
            `SELECT l.*, u.name as accessed_by_name
             FROM customer_data_access_logs l
             LEFT JOIN users u ON l.accessed_by_user_id = u.id
             WHERE l.customer_user_id = $1
             ORDER BY l.created_at DESC`,
            [customerId]
        );
        return result.rows;
    }
}

export default new AccessLogRepository();
