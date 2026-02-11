import pool from '../config/database.js';

class ProductRepository {
    async findAll(filters = {}) {
        let query = 'SELECT * FROM products WHERE deleted_at IS NULL';
        const values = [];
        let paramIndex = 1;

        if (filters.category_id) {
            query += ` AND category_id = $${paramIndex}`;
            values.push(filters.category_id);
            paramIndex++;
        }

        if (filters.status) {
            query += ` AND status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        if (filters.created_by) {
            query += ` AND created_by = $${paramIndex}`;
            values.push(filters.created_by);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );
        return result.rows[0];
    }

    async create(data) {
        const {
            name, description, category_id, unit,
            is_perishable, cover_media_id, status, created_by,
            source_type, platform_status, origin_business_id
        } = data;

        // Generate slug from name + random suffix for uniqueness if needed
        // For now relying on caller or simple generation
        const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

        const result = await pool.query(
            `INSERT INTO products (
                name, description, category_id, unit,
                is_perishable, cover_media_id, status, created_by,
                source_type, platform_status, origin_business_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                name, description, category_id, unit,
                is_perishable || false, cover_media_id, status || 'active', created_by,
                source_type || 'admin', platform_status || 'approved', origin_business_id || null
            ]
        );
        return result.rows[0];
    }

    async update(id, data) {
        const keys = Object.keys(data);
        if (keys.length === 0) return null;

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...Object.values(data)];

        const result = await pool.query(
            `UPDATE products
             SET ${setClause}, updated_at = now()
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async softDelete(id) {
        const result = await pool.query(
            `UPDATE products
             SET deleted_at = now(), status = 'inactive'
             WHERE id = $1
             RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    async restore(id) {
        const result = await pool.query(
            `UPDATE products
             SET deleted_at = NULL, status = 'active'
             WHERE id = $1
             RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    async findAllDeleted(filters = {}) {
        let query = 'SELECT * FROM products WHERE deleted_at IS NOT NULL';
        const values = [];
        let paramIndex = 1;

        if (filters.category_id) {
            query += ` AND category_id = $${paramIndex}`;
            values.push(filters.category_id);
            paramIndex++;
        }

        query += ' ORDER BY deleted_at DESC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    async search(query, filters = {}) {
        let sql = `
            SELECT *
            FROM products
            WHERE deleted_at IS NULL
            AND (
                to_tsvector('english', name) @@ plainto_tsquery('english', $1)
                OR description ILIKE '%' || $1 || '%'
            )
        `;
        const values = [query];
        let paramIndex = 2;

        if (filters.status) {
            sql += ` AND status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        if (filters.category_id) {
            sql += ` AND category_id = $${paramIndex}`;
            values.push(filters.category_id);
            paramIndex++;
        }

        sql += ' ORDER BY created_at DESC';

        const result = await pool.query(sql, values);
        return result.rows;
    }
}

export default new ProductRepository();
