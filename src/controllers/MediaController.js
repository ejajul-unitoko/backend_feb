import pool from '../config/database.js';

class MediaController {
    async uploadAvatar(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const userId = req.user.userId;
            const file = req.file;
            
            // Construct Public URL (For now, local static file)
            // In prod, this would be an S3 URL.
            // Ensure express serves 'uploads' folder statically.
            const url = `http://localhost:4000/uploads/${file.filename}`;

            // Save to DB
            const result = await pool.query(
                `INSERT INTO media_assets (user_id, url, filename, mimetype, size)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [userId, url, file.filename, file.mimetype, file.size]
            );

            res.json({ 
                message: 'Upload successful', 
                url, 
                asset: result.rows[0] 
            });

        } catch (err) { next(err); }
    }
}

export default new MediaController();
