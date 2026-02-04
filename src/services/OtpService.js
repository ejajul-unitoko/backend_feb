import crypto from 'crypto';
import pool from '../config/database.js';
import mailer from '../utils/mailer.js';

class OtpService {
    constructor() {
        this.OTP_EXPIRY_MINUTES = 10;
        this.MAX_ATTEMPTS = 5;
    }

    _generateCode() {
        // Generate 6 digit code
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    _hash(code) {
        return crypto.createHash('sha256').update(code).digest('hex');
    }

    async generateOtp(target, purpose, scope) {
        // 1. Invalidate/Expire old OTPs (Logic: just mark them consumed or ignored)
        // We will just ignore them by checking 'consumed_at IS NULL' and strict latest.
        // Actually, safer to mark old ones consumed to prevent race conditions.
        await pool.query(
            `UPDATE otps SET consumed_at = now() 
             WHERE target = $1 AND purpose = $2 AND scope = $3 AND consumed_at IS NULL`,
            [target, purpose, scope]
        );

        // 2. Generate New
        const code = this._generateCode();
        const codeHash = this._hash(code);
        const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60000);

        await pool.query(
            `INSERT INTO otps (target, purpose, scope, code_hash, expires_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [target, purpose, scope, codeHash, expiresAt]
        );

        return code; // Return raw code to send via email (DO NOT LOG IN PROD)
    }

    async verifyOtp(target, purpose, scope, code) {
        // 1. Find latest active OTP
        const result = await pool.query(
            `SELECT * FROM otps 
             WHERE target = $1 AND purpose = $2 AND scope = $3 
             AND consumed_at IS NULL
             ORDER BY created_at DESC LIMIT 1`,
            [target, purpose, scope]
        );
        const record = result.rows[0];

        if (!record) {
            throw new Error('Invalid or expired OTP');
        }

        // 2. Check Expiry
        if (new Date() > new Date(record.expires_at)) {
            throw new Error('OTP expired');
        }

        // 3. Check Attempts
        if (record.attempt_count >= this.MAX_ATTEMPTS) {
            throw new Error('Too many failed attempts. Please request a new OTP.');
        }

        // 4. Verify Hash
        const inputHash = this._hash(code);
        if (inputHash !== record.code_hash) {
            // Increment attempt count
            await pool.query('UPDATE otps SET attempt_count = attempt_count + 1 WHERE id = $1', [record.id]);
            throw new Error('Invalid OTP code');
        }

        // 5. Mark Consumed
        await pool.query('UPDATE otps SET consumed_at = now() WHERE id = $1', [record.id]);
        return true;
    }

    async sendOtpEmail(email, code, purpose) {
        // Simple templates based on purpose
        let subject = 'UniToko Verification Code';
        let html = `<p>Your verification code is: <b>${code}</b></p>`;

        if (purpose === 'admin_request') {
            subject = 'Unitoko Admin Access Verification';
            html = `<p>You requested Admin Access. Verify your email with code: <b>${code}</b></p>`;
        } else if (purpose === 'reset') {
            subject = 'Password Reset Request';
            html = `<p>Use this code to reset your password: <b>${code}</b></p>`;
        }

        await mailer.sendEmail({ to: email, subject, html });
    }

    async sendAdminRequestNotification(userEmail, approvalLink) {
        // Notify Super Admin
        const superAdminEmail = process.env.ADMIN_APPROVER_EMAIL || 'ejajul@unitoko.com'; 
        // fallback logic should be handled with envs ideally
        
        await mailer.sendEmail({
            to: superAdminEmail,
            subject: '[ACTION REQUIRED] New Admin Access Request',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>New Admin Access Request</h2>
                    <p>User <b>${userEmail}</b> has requested admin access to UTA.</p>
                    <p>Please review and approve the request.</p>
                    
                    <div style="margin: 20px 0;">
                        <a href="${approvalLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            ✅ Approve Request
                        </a>
                    </div>
                    
                    <p style="font-size: 0.9em; color: #666;">
                        Or click this link: <br>
                        <a href="${approvalLink}">${approvalLink}</a>
                    </p>
                </div>
            `
        });
    }

    async sendAdminApprovalNotification(userEmail) {
        await mailer.sendEmail({
            to: userEmail,
            subject: 'Admin Access Approved',
            html: `<p>Congratulations! Your access to Unitoko Admin (UTA) has been approved. You can now login.</p>`
        });
    }
}

export default new OtpService();
