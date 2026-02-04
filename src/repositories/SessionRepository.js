import pool from '../config/database.js';

class SessionRepository {
    async create(data) {
        const { 
            user_id, 
            app_type, 
            refresh_token_hash, 
            device_id, 
            ip_address, 
            user_agent, 
            expires_at 
        } = data;

        const result = await pool.query(
            `INSERT INTO sessions 
            (user_id, app_type, refresh_token_hash, device_id, ip_address, user_agent, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [user_id, app_type, refresh_token_hash, device_id, ip_address, user_agent, expires_at]
        );
        return result.rows[0];
    }

    async findByRefreshHash(hash) {
        const result = await pool.query(
            `SELECT * FROM sessions 
             WHERE refresh_token_hash = $1 
             AND revoked_at IS NULL 
             AND expires_at > now()`,
            [hash]
        );
        return result.rows[0];
    }

    async revoke(sessionId) {
        const result = await pool.query(
            `UPDATE sessions 
             SET revoked_at = now(), updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [sessionId]
        );
        return result.rows[0];
    }

    async revokeAllForUser(userId) {
        await pool.query(
            `UPDATE sessions 
             SET revoked_at = now(), updated_at = now()
             WHERE user_id = $1 AND revoked_at IS NULL`,
            [userId]
        );
    }
}

export default new SessionRepository();
