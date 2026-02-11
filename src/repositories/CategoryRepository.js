import pool from '../config/database.js';

class CategoryRepository {
    async findAll(filters = {}) {
        let query = 'SELECT * FROM categories WHERE 1=1';
        const values = [];
        let paramIndex = 1;

        if (filters.status) {
            query += ` AND status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        if (filters.parent_id) {
            query += ` AND parent_id = $${paramIndex}`;
            values.push(filters.parent_id);
            paramIndex++;
        }

        query += ' ORDER BY name ASC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM categories WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    async findBySlug(slug) {
        const result = await pool.query(
            'SELECT * FROM categories WHERE slug = $1',
            [slug]
        );
        return result.rows[0];
    }

    async create(data) {
        const { name, slug, parent_id, status } = data;
        const result = await pool.query(
            `INSERT INTO categories (name, slug, parent_id, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name, slug, parent_id || null, status || 'active']
        );
        return result.rows[0];
    }

    async update(id, data) {
        const keys = Object.keys(data);
        if (keys.length === 0) return null;

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...Object.values(data)];

        const result = await pool.query(
            `UPDATE categories
             SET ${setClause}
             WHERE id = $1
             RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async delete(id) {
        const result = await pool.query(
            'DELETE FROM categories WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }
}

export default new CategoryRepository();
