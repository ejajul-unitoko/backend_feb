import pool from '../config/database.js';

class InventoryLogRepository {
    async create(data, client = pool) {
        const { branch_product_id, change, reason, performed_by } = data;

        const result = await client.query(
            `INSERT INTO inventory_logs (
                branch_product_id, change, reason, performed_by
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [branch_product_id, change, reason, performed_by]
        );
        return result.rows[0];
    }

    async findByBranchProductId(branchProductId, limit = 50) {
        const result = await pool.query(
            `SELECT il.*, u.name as performed_by_name
             FROM inventory_logs il
             LEFT JOIN users u ON il.performed_by = u.id
             WHERE il.branch_product_id = $1
             ORDER BY il.created_at DESC
             LIMIT $2`,
            [branchProductId, limit]
        );
        return result.rows;
    }
}

export default new InventoryLogRepository();
