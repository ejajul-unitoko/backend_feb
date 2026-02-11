import pool from '../config/database.js';

class BusinessProductRepository {
    async create(data) {
        const {
            business_id, product_id, created_by_user_id,
            approval_status, status
        } = data;

        const result = await pool.query(
            `INSERT INTO business_products (
                business_id, product_id, created_by_user_id,
                approval_status, status
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                business_id, product_id, created_by_user_id,
                approval_status || 'pending', status || 'active'
            ]
        );
        return result.rows[0];
    }

    async findById(id) {
        const result = await pool.query(
            `SELECT bp.*, p.name, p.description, p.unit, p.category_id, p.cover_media_id,
                    p.source_type, p.platform_status as global_platform_status
             FROM business_products bp
             JOIN products p ON bp.product_id = p.id
             WHERE bp.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    async findByBusinessAndProduct(businessId, productId) {
        const result = await pool.query(
            `SELECT * FROM business_products 
             WHERE business_id = $1 AND product_id = $2`,
            [businessId, productId]
        );
        return result.rows[0];
    }

    async findAllByProduct(productId) {
        const result = await pool.query(
            `SELECT * FROM business_products WHERE product_id = $1`,
            [productId]
        );
        return result.rows;
    }

    async findAllByBusiness(businessId, filters = {}) {
        let query = `
            SELECT bp.*, p.name, p.description, p.unit, p.category_id, p.cover_media_id,
                   p.source_type, p.platform_status as global_platform_status
            FROM business_products bp
            JOIN products p ON bp.product_id = p.id
            WHERE bp.business_id = $1
        `;
        const values = [businessId];
        let paramIndex = 2;

        if (filters.approval_status) {
            query += ` AND bp.approval_status = $${paramIndex}`;
            values.push(filters.approval_status);
            paramIndex++;
        }

        if (filters.status) {
            query += ` AND bp.status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        query += ' ORDER BY bp.created_at DESC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    async updateStatus(id, status) {
        const result = await pool.query(
            `UPDATE business_products
             SET status = $2, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [id, status]
        );
        return result.rows[0];
    }

    async updateApprovalStatus(id, approvalStatus, rejectionReason = null) {
        const result = await pool.query(
            `UPDATE business_products
             SET approval_status = $2, rejection_reason = $3, updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [id, approvalStatus, rejectionReason]
        );
        return result.rows[0];
    }
}

export default new BusinessProductRepository();
