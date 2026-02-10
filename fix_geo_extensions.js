import pool from './src/config/database.js';

const fixGeoExtensions = async () => {
    const client = await pool.connect();
    try {
        console.log('Installing geo extensions...');
        
        // Install cube extension first
        await client.query('CREATE EXTENSION IF NOT EXISTS cube;');
        console.log('✓ cube extension installed');
        
        // Install earthdistance extension (depends on cube)
        await client.query('CREATE EXTENSION IF NOT EXISTS earthdistance;');
        console.log('✓ earthdistance extension installed');
        
        // Verify the earth type exists
        const result = await client.query(`
            SELECT typname 
            FROM pg_type 
            WHERE typname = 'earth';
        `);
        
        if (result.rows.length > 0) {
            console.log('✓ earth type is now available');
        } else {
            console.log('✗ earth type still not found');
        }
        
        console.log('\nExtensions installed successfully. You can now run migrations.');
    } catch (err) {
        console.error('Error installing extensions:', err.message);
    } finally {
        client.release();
        process.exit();
    }
};

fixGeoExtensions();
