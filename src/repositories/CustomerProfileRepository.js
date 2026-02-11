import pool from '../config/database.js';

class CustomerProfileRepository {
    async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM customer_profiles WHERE user_id = $1',
            [userId]
        );
        return result.rows[0];
    }

    async create(data) {
        const {
            user_id, avatar_media_id, date_of_birth, gender,
            preferred_language, notification_preferences
        } = data;

        const result = await pool.query(
            `INSERT INTO customer_profiles 
             (user_id, avatar_media_id, date_of_birth, gender, preferred_language, notification_preferences)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [user_id, avatar_media_id, date_of_birth, gender, preferred_language, notification_preferences || '{"email": true, "sms": true, "push": true}']
        );
        return result.rows[0];
    }

    async update(userId, data) {
        const keys = Object.keys(data);
        if (keys.length === 0) return this.findByUserId(userId);

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [userId, ...Object.values(data)];

        const result = await pool.query(
            `UPDATE customer_profiles 
             SET ${setClause}, updated_at = now()
             WHERE user_id = $1
             RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async incrementOrderMetrics(userId, orderAmount) {
        const result = await pool.query(
            `UPDATE customer_profiles 
             SET total_orders_count = total_orders_count + 1,
                 total_spend = total_spend + $2,
                 updated_at = now()
             WHERE user_id = $1
             RETURNING *`,
            [userId, orderAmount]
        );
        return result.rows[0];
    }
}

export default new CustomerProfileRepository();
