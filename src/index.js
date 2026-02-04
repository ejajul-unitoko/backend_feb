import dotenv from "dotenv";
import app from "./server.js";
import pool from "./config/database.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('Database connection verified');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
