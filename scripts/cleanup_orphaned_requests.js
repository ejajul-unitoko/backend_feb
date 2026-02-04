import pool from '../src/config/database.js';

async function cleanup() {
    const client = await pool.connect();
    try {
        console.log('Cleaning up orphaned admin_access_requests...');

        // Delete requests where email does not exist in users table
        const res = await client.query(
            `DELETE FROM admin_access_requests 
             WHERE email NOT IN (SELECT email FROM users WHERE deleted_at IS NULL)`
        );

        console.log(`Deleted ${res.rowCount} orphaned access requests.`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        process.exit();
    }
}

cleanup();
