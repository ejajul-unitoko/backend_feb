import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting migrations...');

        // 1. Create migrations table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Get list of already applied migrations
        const { rows } = await client.query('SELECT name FROM migrations');
        const appliedMigrations = rows.map(row => row.name);

        // 3. Read migration files
        const migrationsDir = path.join(__dirname, '../../migrations');
        if (!fs.existsSync(migrationsDir)) {
            fs.mkdirSync(migrationsDir);
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        // 4. Run new migrations
        let count = 0;
        for (const file of files) {
            if (!appliedMigrations.includes(file)) {
                console.log(`Applying migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                
                await client.query('BEGIN');
                try {
                    await client.query(sql);
                    await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                    await client.query('COMMIT');
                    count++;
                } catch (err) {
                    await client.query('ROLLBACK');
                    console.error(`Error in migration ${file}:`, err.message);
                    throw err;
                }
            }
        }

        console.log(`Migrations complete. ${count} new migrations applied.`);
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        client.release();
        process.exit();
    }
};

migrate();
