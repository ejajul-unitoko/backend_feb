import pool from '../config/database.js';

const checkExtensions = async () => {
    try {
        const client = await pool.connect();

        console.log('--- Installed Extensions ---');
        const resExt = await client.query('SELECT * FROM pg_extension');
        resExt.rows.forEach(row => console.log(row.extname));

        console.log('\n--- Types named "earth" ---');
        const resType = await client.query("SELECT t.*, n.nspname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE typname = 'earth'");
        resType.rows.forEach(row => console.log(row));

        console.log('\n--- Functions named "ll_to_earth" ---');
        const resFunc = await client.query("SELECT proname FROM pg_proc WHERE proname = 'll_to_earth'");
        resFunc.rows.forEach(row => console.log(row.proname));

        console.log('\n--- Search Path ---');
        const resPath = await client.query('SHOW search_path');
        console.log(resPath.rows[0]);

        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
};

checkExtensions();
