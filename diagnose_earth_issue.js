import pool from './src/config/database.js';

const diagnoseAndFix = async () => {
    const client = await pool.connect();
    try {
        console.log('=== Diagnosing Earth Type Issue ===\n');
        
        // 1. Check which schemas exist
        const schemasResult = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schema_name;
        `);
        console.log('Available schemas:');
        schemasResult.rows.forEach(row => console.log(`  - ${row.schema_name}`));
        
        // 2. Check extensions and their schemas
        const extResult = await client.query(`
            SELECT e.extname, n.nspname as schema
            FROM pg_extension e
            JOIN pg_namespace n ON e.extnamespace = n.oid
            WHERE e.extname IN ('cube', 'earthdistance');
        `);
        console.log('\nExtensions:');
        if (extResult.rows.length > 0) {
            extResult.rows.forEach(row => console.log(`  - ${row.extname} in schema: ${row.schema}`));
        } else {
            console.log('  ✗ No geo extensions found!');
        }
        
        // 3. Check earth type location
        const typeResult = await client.query(`
            SELECT n.nspname as schema, t.typname
            FROM pg_type t
            JOIN pg_namespace n ON t.typnamespace = n.oid
            WHERE t.typname = 'earth';
        `);
        console.log('\nEarth type:');
        if (typeResult.rows.length > 0) {
            typeResult.rows.forEach(row => console.log(`  - Found in schema: ${row.schema}`));
        } else {
            console.log('  ✗ Earth type NOT found in any schema!');
            console.log('  → This means earthdistance extension is not properly installed');
        }
        
        // 4. Check current search path
        const pathResult = await client.query('SHOW search_path;');
        console.log('\nCurrent search_path:', pathResult.rows[0].search_path);
        
        // 5. Try to reinstall extensions if earth type is missing
        if (typeResult.rows.length === 0) {
            console.log('\n=== Attempting to fix ===');
            console.log('Dropping and recreating extensions...');
            
            try {
                await client.query('DROP EXTENSION IF EXISTS earthdistance CASCADE;');
                await client.query('DROP EXTENSION IF EXISTS cube CASCADE;');
                console.log('  ✓ Dropped old extensions');
                
                await client.query('CREATE EXTENSION cube;');
                console.log('  ✓ Created cube extension');
                
                await client.query('CREATE EXTENSION earthdistance;');
                console.log('  ✓ Created earthdistance extension');
                
                // Verify earth type now exists
                const verifyResult = await client.query(`
                    SELECT typname FROM pg_type WHERE typname = 'earth';
                `);
                
                if (verifyResult.rows.length > 0) {
                    console.log('  ✓ Earth type is now available!');
                } else {
                    console.log('  ✗ Earth type still missing - this is a PostgreSQL installation issue');
                }
            } catch (err) {
                console.log('  ✗ Error during fix:', err.message);
            }
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        client.release();
        process.exit();
    }
};

diagnoseAndFix();
