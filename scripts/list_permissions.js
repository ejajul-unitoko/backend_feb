import pool from '../src/config/database.js';

async function list() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT scope, slug FROM permissions ORDER BY scope, slug');

        if (res.rows.length === 0) {
            console.log('No permissions found in the database.');
        } else {
            console.log('Current Permissions List:');
            console.log('-------------------------');
            res.rows.forEach(p => console.log(`[${p.scope}] ${p.slug}`));
            console.log('-------------------------');
            console.log(`Total: ${res.rows.length} permissions`);
        }
    } catch (err) {
        console.error('Error fetching permissions:', err);
    } finally {
        client.release();
        process.exit();
    }
}

list();
