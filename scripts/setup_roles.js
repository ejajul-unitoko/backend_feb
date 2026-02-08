import pool from '../src/config/database.js';
import RbacRepository from '../src/repositories/RbacRepository.js';

const SCOPE = 'uta';

async function setupRoles() {
    const client = await pool.connect();
    try {
        console.log('Starting Role & Permission Setup...');

        // 1. Define New Permissions for Granular Access
        const newPermissions = [
            { slug: 'customers:read', description: 'View customer details' }, // UTC
            { slug: 'riders:read', description: 'View rider details' },       // UTD
            { slug: 'businesses:read', description: 'View business details' } // UTB
        ];

        console.log('Ensuring granular permissions exist...');
        for (const p of newPermissions) {
            await client.query(
                `INSERT INTO permissions (scope, slug, description)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (scope, slug) DO NOTHING`,
                [SCOPE, p.slug, p.description]
            );
        }

        // 2. Ensure Roles Exist
        console.log('Ensuring roles exist...');

        // Super Admin
        let superAdminRole = await RbacRepository.findRoleByName('super_admin', SCOPE);
        if (!superAdminRole) {
            // super_admin usually exists via migration/seed, but just in case
            const res = await client.query(
                "INSERT INTO roles (name, scope, description) VALUES ($1, $2, $3) RETURNING *",
                ['super_admin', SCOPE, 'Super Administrator']
            );
            superAdminRole = res.rows[0];
        }

        // Staff Admin
        let staffAdminRole = await RbacRepository.findRoleByName('staff_admin', SCOPE);
        const res = await client.query(
            "INSERT INTO roles (name, scope, description) VALUES ($1, $2, $3) RETURNING *",
            ['staff_admin', SCOPE, 'Staff Administrator']
        );
        staffAdminRole = res.rows[0];

        // 3. Assign Permissions

        // -> Super Admin gets EVERYTHING in UTA scope
        console.log('Updating Super Admin permissions...');
        const allPermissionsRes = await client.query('SELECT id, slug FROM permissions WHERE scope = $1', [SCOPE]);
        const allPermissions = allPermissionsRes.rows;

        for (const perm of allPermissions) {
            await client.query(
                `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [superAdminRole.id, perm.id]
            );
        }
        console.log(`Super Admin now has ${allPermissions.length} permissions.`);

        // -> Staff Admin gets ONLY specific permissions
        //    (customers:read, riders:read, businesses:read)
        //    AND definitely NOT users:manage (which implies CRUD on admins too)
        console.log('Updating Staff Admin permissions...');
        const staffSlugs = ['customers:read', 'riders:read', 'businesses:read'];
        const staffPermissions = allPermissions.filter(p => staffSlugs.includes(p.slug));

        // Clear existing to ensure strict compliance? Or just add? 
        // Safer to clear and re-add to ensure they definitely don't have prohibited ones if run multiple times.
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [staffAdminRole.id]);

        for (const perm of staffPermissions) {
            await client.query(
                `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [staffAdminRole.id, perm.id]
            );
        }
        console.log(`Staff Admin now has ${staffPermissions.length} permissions: ${staffSlugs.join(', ')}`);

        console.log('✅ Setup Complete!');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        process.exit();
    }
}

setupRoles();
