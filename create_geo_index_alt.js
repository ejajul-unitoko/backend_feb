import pool from './src/config/database.js';

const createGeoIndexAlternative = async () => {
    const client = await pool.connect();
    try {
        console.log('Attempting alternative geospatial index creation...\n');
        
        // First, verify ll_to_earth works
        console.log('1. Testing ll_to_earth function...');
        const testResult = await client.query(`
            SELECT ll_to_earth(28.6139, 77.2090)::text as result;
        `);
        console.log(`   ✓ Function works, returns: ${testResult.rows[0].result.substring(0, 30)}...`);
        
        // Try creating index in a single statement without transaction
        console.log('\n2. Creating index...');
        try {
            await client.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branches_location 
                ON branches USING gist(ll_to_earth(latitude, longitude))
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
            `);
            console.log('   ✓ Geospatial index created successfully!');
        } catch (indexErr) {
            console.log('   ✗ CONCURRENTLY failed:', indexErr.message);
            console.log('\n3. Trying without CONCURRENTLY...');
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_branches_location 
                ON branches USING gist(ll_to_earth(latitude, longitude))
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
            `);
            console.log('   ✓ Geospatial index created successfully!');
        }
        
    } catch (err) {
        console.error('\n✗ Final error:', err.message);
        console.error('\nThis suggests a PostgreSQL configuration issue.');
        console.error('The geospatial index is optional - your migrations are complete without it.');
    } finally {
        client.release();
        process.exit();
    }
};

createGeoIndexAlternative();
