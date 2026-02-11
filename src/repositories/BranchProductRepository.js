import pool from '../config/database.js';

class BranchProductRepository {
    async findByBranchId(branchId, filters = {}) {
        let query = `
            SELECT bp.*, p.name, p.description, p.unit, p.cover_media_id,
                   bprod.approval_status as business_approval_status
            FROM branch_products bp
            JOIN business_products bprod ON bp.business_product_id = bprod.id
            JOIN products p ON bprod.product_id = p.id
            WHERE bp.branch_id = $1 AND p.deleted_at IS NULL
        `;
        const values = [branchId];
        let paramIndex = 2;

        if (filters.status) {
            query += ` AND bp.status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        if (filters.is_available !== undefined) {
            query += ` AND bp.is_available = $${paramIndex}`;
            values.push(filters.is_available);
            paramIndex++;
        }

        if (filters.category_id) {
            query += ` AND p.category_id = $${paramIndex}`;
            values.push(filters.category_id);
            paramIndex++;
        }

        query += ' ORDER BY p.name ASC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    async findById(id) {
        const result = await pool.query(
            `SELECT bp.*, p.name, p.unit, p.is_perishable
             FROM branch_products bp
             JOIN business_products bprod ON bp.business_product_id = bprod.id
             JOIN products p ON bprod.product_id = p.id
             WHERE bp.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    async findByBranchAndProduct(branchId, businessProductId) {
        const result = await pool.query(
            `SELECT * FROM branch_products
             WHERE branch_id = $1 AND business_product_id = $2`,
            [branchId, businessProductId]
        );
        return result.rows[0];
    }

    async findByBusinessProductId(businessProductId) {
        const result = await pool.query(
            `SELECT * FROM branch_products WHERE business_product_id = $1`,
            [businessProductId]
        );
        return result.rows;
    }

    async create(data) {
        const {
            branch_id, business_product_id, price, mrp,
            stock_quantity, low_stock_threshold, is_available, status
        } = data;

        const result = await pool.query(
            `INSERT INTO branch_products (
                branch_id, business_product_id, price, mrp,
                stock_quantity, low_stock_threshold, is_available, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                branch_id, business_product_id, price, mrp || null,
                stock_quantity || 0, low_stock_threshold || 5,
                is_available ?? true, status || 'active'
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
            `UPDATE branch_products
             SET ${setClause}, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async updateStock(id, change, client = pool) {
        // Atomic increment/decrement
        const result = await client.query(
            `UPDATE branch_products
             SET stock_quantity = stock_quantity + $2, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [id, change]
        );
        return result.rows[0];
    }

    async delete(id) {
        const result = await pool.query(
            'DELETE FROM branch_products WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }

    // For public catalog - get all products in a market via branches
    async findByMarketId(marketId, filters = {}) {
        let query = `
            SELECT DISTINCT ON (p.id) 
                p.*, 
                bp.id as branch_product_id, bp.price, bp.mrp, 
                bp.stock_quantity, bp.is_available, bp.branch_id
            FROM products p
            JOIN business_products bprod ON p.id = bprod.product_id
            JOIN branch_products bp ON bprod.id = bp.business_product_id
            JOIN branches b ON bp.branch_id = b.id
            JOIN business_markets bm ON b.business_id = bm.business_id
            WHERE bm.market_id = $1
            AND p.deleted_at IS NULL
            AND bp.status = 'active'
            AND bp.is_available = true
            AND bp.stock_quantity > 0
            AND b.status = 'active'
        `;
        const values = [marketId];
        let paramIndex = 2;

        if (filters.category_id) {
            query += ` AND p.category_id = $${paramIndex}`;
            values.push(filters.category_id);
            paramIndex++;
        }

        if (filters.query) {
            query += ` AND (to_tsvector('english', p.name) @@ plainto_tsquery('english', $${paramIndex}) OR p.description ILIKE '%' || $${paramIndex} || '%')`;
            values.push(filters.query);
            paramIndex++;
        }

        query += ' ORDER BY p.id, bp.price ASC'; // Show cheapest option by default if duplicated

        const result = await pool.query(query, values);
        return result.rows;
    }
}

export default new BranchProductRepository();
