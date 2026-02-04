import pool from '../config/database.js';

class UserRepository {
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );
        return result.rows[0];
    }

    async findByEmail(email, scope) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND scope = $2 AND deleted_at IS NULL',
            [email, scope]
        );
        return result.rows[0];
    }

    async findByPhone(phone, scope) {
        const result = await pool.query(
            'SELECT * FROM users WHERE phone = $1 AND scope = $2 AND deleted_at IS NULL',
            [phone, scope]
        );
        return result.rows[0];
    }

    async create(data) {
        const { name, email, phone, password_hash, status, scope } = data;
        const result = await pool.query(
            `INSERT INTO users (name, email, phone, password_hash, status, scope)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [name, email, phone, password_hash, status || 'active', scope || 'public']
        );
        return result.rows[0];
    }

    async update(id, data) {
        // Dynamic query builder
        const keys = Object.keys(data);
        if (keys.length === 0) return null;

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...Object.values(data)];

        const result = await pool.query(
            `UPDATE users 
             SET ${setClause}, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async findAll(filters = {}) {
        let query = `
            SELECT u.*, 
                   COALESCE(json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '[]') as roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.deleted_at IS NULL
        `;
        const values = [];
        let paramIndex = 1;

        if (filters.scope) {
            query += ` AND u.scope = $${paramIndex}`;
            values.push(filters.scope);
            paramIndex++;
        }

        query += ' GROUP BY u.id ORDER BY u.created_at DESC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    async delete(id) {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }
}

export default new UserRepository();
