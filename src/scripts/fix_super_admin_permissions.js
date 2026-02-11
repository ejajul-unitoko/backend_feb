import pool from '../config/database.js';

async function fixSuperAdminPermissions() {
    try {
        console.log('Fixing Super Admin Permissions...');

        // 1. Get super_admin role ID
        const roleRes = await pool.query("SELECT id FROM roles WHERE name = 'super_admin'");
        if (roleRes.rows.length === 0) {
            console.error('super_admin role not found!');
            return;
        }
        const superAdminRoleId = roleRes.rows[0].id;
        console.log(`Found super_admin role ID: ${superAdminRoleId}`);

        // 2. Define all required permissions
        const permissions = [
            'businesses:read', 'businesses:create', 'businesses:update', 'businesses:delete', 'businesses:verify', // Business management
            'users:read', 'users:create', 'users:update', 'users:delete', // User management
            'roles:read', 'roles:create', 'roles:update', 'roles:delete' // Role management
        ];

        // 3. Ensure permissions exist and assign to super_admin
        for (const permName of permissions) {
            // Check/Create Permission
            let permRes = await pool.query("SELECT id FROM permissions WHERE slug = $1", [permName]);
            let permId;

            if (permRes.rows.length === 0) {
                console.log(`Creating permission: ${permName}`);
                const newPerm = await pool.query(
                    "INSERT INTO permissions (slug, description, scope) VALUES ($1, $2, $3) RETURNING id",
                    [permName, `Permission to ${permName.replace(':', ' ')}`, 'uta']
                );
                permId = newPerm.rows[0].id;
            } else {
                permId = permRes.rows[0].id;
            }

            // Assign to Role
            const assignRes = await pool.query(
                "SELECT * FROM role_permissions WHERE role_id = $1 AND permission_id = $2",
                [superAdminRoleId, permId]
            );

            if (assignRes.rows.length === 0) {
                console.log(`Assigning ${permName} to super_admin`);
                await pool.query(
                    "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
                    [superAdminRoleId, permId]
                );
            } else {
                console.log(`Permission ${permName} already assigned to super_admin`);
            }
        }

        console.log('Super Admin permissions fixed successfully!');
    } catch (err) {
        console.error('Error fixing permissions:', err);
    } finally {
        await pool.end();
    }
}

fixSuperAdminPermissions();
