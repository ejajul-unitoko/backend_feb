import pool from '../config/database.js';

class RbacRepository {
    async findRoleByName(name, scope) {
        const result = await pool.query(
            'SELECT * FROM roles WHERE name = $1 AND scope = $2',
            [name, scope]
        );
        return result.rows[0];
    }

    async assignRoleToUser(userId, roleId) {
        const result = await pool.query(
            `INSERT INTO user_roles (user_id, role_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING
             RETURNING *`,
            [userId, roleId]
        );
        return result.rows[0];
    }

    async clearUserRoles(userId) {
        await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
    }

    // Get all roles for a user within a specific scope
    async getUserRoles(userId, scope) {
        const result = await pool.query(
            `SELECT r.* 
             FROM roles r
             JOIN user_roles ur ON r.id = ur.role_id
             WHERE ur.user_id = $1 AND r.scope = $2`,
            [userId, scope]
        );
        return result.rows;
    }

    // Get all compiled permissions (slugs) for a user in a scope
    async getUserPermissions(userId, scope) {
        const result = await pool.query(
            `SELECT DISTINCT p.slug
             FROM permissions p
             JOIN role_permissions rp ON p.id = rp.permission_id
             JOIN roles r ON rp.role_id = r.id
             JOIN user_roles ur ON r.id = ur.role_id
             WHERE ur.user_id = $1 AND r.scope = $2`,
            [userId, scope]
        );
        return result.rows.map(row => row.slug);
    }
}

export default new RbacRepository();
