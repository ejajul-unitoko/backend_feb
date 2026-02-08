import pool from '../src/config/database.js';
import UserRepository from '../src/repositories/UserRepository.js';
import RbacRepository from '../src/repositories/RbacRepository.js';
import bcrypt from 'bcrypt';

const EMAIL = 'intern@unitoko.com';
const SCOPE = 'uta'; // Admin scope
const ROLE_NAME = 'staff_admin';
const DEFAULT_PASSWORD = '12345678';

async function setupIntern() {
    const client = await pool.connect();
    try {
        console.log(`Setting up ${EMAIL} as ${ROLE_NAME}...`);

        // 1. Ensure User Exists
        let user = await UserRepository.findByEmail(EMAIL, SCOPE);
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

        if (!user) {
            console.log('User not found. Creating user...');
            user = await UserRepository.create({
                email: EMAIL,
                scope: SCOPE,
                name: 'Intern User',
                status: 'active',
                phone: null,
                password_hash: passwordHash
            });
            console.log('User created:', user.id);
        } else {
            console.log('User found:', user.id);
            // Update password just in case
            await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, user.id]);
            console.log('Password updated.');
        }

        // 2. Find Staff Admin Role
        const role = await RbacRepository.findRoleByName(ROLE_NAME, SCOPE);
        if (!role) {
            throw new Error(`Role '${ROLE_NAME}' not found! Run setup_roles.js first.`);
        }
        console.log('Role found:', role.id);

        // 3. Assign Role to User
        await RbacRepository.assignRoleToUser(user.id, role.id);
        console.log(`Assigned '${ROLE_NAME}' role to user.`);

        // 4. Auto-Approve Admin Access Request
        await client.query(
            `INSERT INTO admin_access_requests (email, status, scope, approved_at)
             VALUES ($1, 'approved', $2, now())
             ON CONFLICT (email) DO UPDATE SET status = 'approved', approved_at = now()`,
            [EMAIL, SCOPE]
        );
        console.log('Admin access request auto-approved.');

        console.log(`SUCCESS: ${EMAIL} is now set up as ${ROLE_NAME} with password '${DEFAULT_PASSWORD}'`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        process.exit();
    }
}

setupIntern();
