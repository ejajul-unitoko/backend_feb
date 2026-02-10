import pool from './src/config/database.js';

const createGeoIndex = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating geospatial index on branches table...');
        
        // Set search path explicitly
        await client.query("SET search_path TO public;");
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_branches_location ON public.branches USING gist(
                public.ll_to_earth(latitude, longitude)
            ) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
        `);
        
        console.log('✓ Geospatial index created successfully!');
        console.log('\nYou can now perform location-based queries on branches.');
    } catch (err) {
        console.error('Error creating index:', err.message);
    } finally {
        client.release();
        process.exit();
    }
};

createGeoIndex();
