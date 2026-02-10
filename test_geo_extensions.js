import pool from './src/config/database.js';

const testGeoExtensions = async () => {
    const client = await pool.connect();
    try {
        console.log('Testing geo extensions...\n');
        
        // Check if extensions exist
        const extResult = await client.query(`
            SELECT extname, extversion 
            FROM pg_extension 
            WHERE extname IN ('cube', 'earthdistance');
        `);
        console.log('Installed extensions:');
        extResult.rows.forEach(row => {
            console.log(`  - ${row.extname} (v${row.extversion})`);
        });
        
        // Check if earth type exists
        const typeResult = await client.query(`
            SELECT n.nspname as schema, t.typname 
            FROM pg_type t
            JOIN pg_namespace n ON t.typnamespace = n.oid
            WHERE t.typname = 'earth';
        `);
        console.log('\nEarth type location:');
        if (typeResult.rows.length > 0) {
            typeResult.rows.forEach(row => {
                console.log(`  - Schema: ${row.schema}, Type: ${row.typname}`);
            });
        } else {
            console.log('  ✗ earth type NOT found');
        }
        
        // Check if ll_to_earth function exists
        const funcResult = await client.query(`
            SELECT n.nspname as schema, p.proname as function
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE p.proname = 'll_to_earth';
        `);
        console.log('\nll_to_earth function location:');
        if (funcResult.rows.length > 0) {
            funcResult.rows.forEach(row => {
                console.log(`  - Schema: ${row.schema}, Function: ${row.function}`);
            });
        } else {
            console.log('  ✗ ll_to_earth function NOT found');
        }
        
        // Check current search_path
        const pathResult = await client.query('SHOW search_path;');
        console.log('\nCurrent search_path:', pathResult.rows[0].search_path);
        
        // Try to use ll_to_earth
        console.log('\nTesting ll_to_earth function...');
        try {
            const testResult = await client.query(`
                SELECT ll_to_earth(28.6139, 77.2090) as result;
            `);
            console.log('  ✓ ll_to_earth works!');
        } catch (err) {
            console.log('  ✗ ll_to_earth failed:', err.message);
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        client.release();
        process.exit();
    }
};

testGeoExtensions();
