import pool from '../src/config/database.js';
import UserRepository from '../src/repositories/UserRepository.js';
import RbacRepository from '../src/repositories/RbacRepository.js';

const EMAIL = 'ejajul@unitoko';
const SCOPE = 'uta';

async function promote() {
    const client = await pool.connect();
    try {
        console.log(`Promoting ${EMAIL} to Super Admin in ${SCOPE}...`);

        // 1. Ensure User Exists
        let user = await UserRepository.findByEmail(EMAIL, SCOPE);
        if (!user) {
            console.log('User not found. Creating user...');
            user = await UserRepository.create({
                email: EMAIL,
                scope: SCOPE,
                name: 'Super Admin',
                status: 'active',
                phone: null, // Optional
                password_hash: null // Using OTP for now
            });
            console.log('User created:', user.id);
        } else {
            console.log('User found:', user.id);
        }

        // 2. Find Super Admin Role
        const role = await RbacRepository.findRoleByName('super_admin', SCOPE);
        if (!role) {
            throw new Error('super_admin role not found in database!');
        }
        console.log('Role found:', role.id);

        // 3. Assign Role to User
        await RbacRepository.assignRoleToUser(user.id, role.id);
        console.log(`Assigned 'super_admin' role to user.`);

        // 4. Assign ALL Permissions to Super Admin Role (Crucial Step)
        console.log('Granting all permissions to super_admin role...');
        
        // Fetch all permissions for this scope
        const resPerms = await client.query('SELECT id, slug FROM permissions WHERE scope = $1', [SCOPE]);
        const allPermissions = resPerms.rows;
        
        if (allPermissions.length === 0) {
            console.warn('No permissions found for scope uta!');
        } else {
            let addedCount = 0;
            for (const perm of allPermissions) {
                // Insert into role_permissions safely
                const res = await client.query(
                    `INSERT INTO role_permissions (role_id, permission_id) 
                     VALUES ($1, $2) 
                     ON CONFLICT DO NOTHING`,
                    [role.id, perm.id]
                );
                if (res.rowCount > 0) addedCount++;
            }
            console.log(`Granted ${addedCount} new permissions to super_admin role.`);
        }

        // 5. Auto-Approve Admin Access Request (if exists)
        await client.query(
            `INSERT INTO admin_access_requests (email, status, scope, approved_at)
             VALUES ($1, 'approved', $2, now())
             ON CONFLICT (email) DO UPDATE SET status = 'approved', approved_at = now()`,
            [EMAIL, SCOPE]
        );
        console.log('Admin access request auto-approved.');

        console.log('SUCCESS: User is now a Super Admin with 100% permissions.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        process.exit();
    }
}

promote();
