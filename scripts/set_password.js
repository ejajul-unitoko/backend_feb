import pool from '../src/config/database.js';
import bcrypt from 'bcrypt';

const EMAIL = 'ejajul@unitoko.com'; // Note: User corrected email in previous prompt (ejajul@unitoko -> ejajul@unitoko.com or similar? Let's check previous context. Previous prompt said 'ejajul@unitoko.com' but promotion script used 'ejajul@unitoko'. I should check which one exists or handle both/update.)
// User said: "feed these password for the super admin ejajul@unitoko.com"
// My promotion script used: const EMAIL = 'ejajul@unitoko';
// I should check if 'ejajul@unitoko.com' or 'ejajul@unitoko' is the correct one.
// The user previously said "ejajul@unitoko" in Step 129.
// But now says "ejajul@unitoko.com".
// I will check both or just update the one that exists.

const NEW_PASSWORD = '12345678';

async function setPassword() {
    const client = await pool.connect();
    try {
        console.log(`Setting password for ${EMAIL}...`);

        // Check which user exists
        let res = await client.query("SELECT * FROM users WHERE email = $1", [EMAIL]);
        let user = res.rows[0];

        if (!user) {
            console.log(`User ${EMAIL} not found. Checking 'ejajul@unitoko'...`);
            res = await client.query("SELECT * FROM users WHERE email = 'ejajul@unitoko'");
            user = res.rows[0];
            if (user) {
                console.log(`Found user as 'ejajul@unitoko'. Updating this user.`);
            } else {
                throw new Error('User not found!');
            }
        }

        const hash = await bcrypt.hash(NEW_PASSWORD, 10);

        await client.query(
            "UPDATE users SET password_hash = $1 WHERE id = $2",
            [hash, user.id]
        );

        console.log('Password updated successfully.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        process.exit();
    }
}

setPassword();
