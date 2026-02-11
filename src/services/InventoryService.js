import pool from '../config/database.js';
import BranchProductRepository from '../repositories/BranchProductRepository.js';
import InventoryLogRepository from '../repositories/InventoryLogRepository.js';

class InventoryService {
    /**
     * Update stock for a branch product with audit log
     * @param {string} branchProductId
     * @param {number} change (+5 to add, -2 to remove)
     * @param {string} reason
     * @param {string} userId - User performing the action
     */
    async updateStock(branchProductId, change, reason, userId) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Lock row and get current state
            const product = await client.query(
                `SELECT * FROM branch_products WHERE id = $1 FOR UPDATE`,
                [branchProductId]
            );

            if (product.rows.length === 0) {
                throw new Error('Branch product not found');
            }

            const currentStock = product.rows[0].stock_quantity;
            const newStock = currentStock + change;

            if (newStock < 0) {
                throw new Error(`Insufficient stock. Current: ${currentStock}, Requested reduction: ${Math.abs(change)}`);
            }

            // Update stock
            const updatedProduct = await BranchProductRepository.updateStock(branchProductId, change, client);

            // Log entry
            await InventoryLogRepository.create({
                branch_product_id: branchProductId,
                change,
                reason,
                performed_by: userId
            }, client);

            await client.query('COMMIT');
            return updatedProduct;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get inventory history
     */
    async getInventoryLogs(branchProductId) {
        return await InventoryLogRepository.findByBranchProductId(branchProductId);
    }
}

export default new InventoryService();
