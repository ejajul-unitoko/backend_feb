import pool from '../src/config/database.js';
import UserRepository from '../src/repositories/UserRepository.js';
import RbacRepository from '../src/repositories/RbacRepository.js';

const EMAIL = 'intern@unitoko.com';
const SCOPE = 'uta';

async function setupIntern() {
    const client = await pool.connect();
    try {
        console.log(`Setting up ${EMAIL} in ${SCOPE}...`);

        // 1. Ensure User Exists
        let user = await UserRepository.findByEmail(EMAIL, SCOPE);
        if (!user) {
            console.log('User not found. Creating user...');
            user = await UserRepository.create({
                email: EMAIL,
                scope: SCOPE,
                name: 'Unitoko Intern',
                status: 'active',
                phone: null,
                password_hash: null 
            });
            console.log('User created:', user.id);
        } else {
            console.log('User found:', user.id);
        }

        // 2. Ensure 'staff' roles exists (or use 'sales' if staff missing)
        // Check if 'staff' role exists
        let role = await RbacRepository.findRoleByName('staff', SCOPE);
        if (!role) {
             console.log("'staff' role not found. Creating it...");
             const res = await client.query(
                `INSERT INTO roles (name, scope, description) VALUES ('staff', 'uta', 'General staff access') RETURNING *`
             );
             role = res.rows[0];
        }

        // 3. Assign Role
        await RbacRepository.assignRoleToUser(user.id, role.id);
        console.log(`Assigned 'staff' role to user.`);
        
        // 4. Ensure 'users:manage' permission for staff so they can list/delete (but restricted by logic)
        // Let's give them 'users:manage' if not present
        // First find permission id
        const pRes = await client.query("SELECT id FROM permissions WHERE slug = 'users:manage' AND scope = 'uta'");
        if (pRes.rows[0]) {
             await client.query(
                `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [role.id, pRes.rows[0].id]
             );
             console.log("Granted 'users:manage' to staff role.");
        }

        // 5. Approve Access
        await client.query(
            `INSERT INTO admin_access_requests (email, status, scope, approved_at)
             VALUES ($1, 'approved', $2, now())
             ON CONFLICT (email) DO UPDATE SET status = 'approved', approved_at = now()`,
            [EMAIL, SCOPE]
        );

        console.log('DONE: Intern setup complete.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        process.exit();
    }
}

setupIntern();
