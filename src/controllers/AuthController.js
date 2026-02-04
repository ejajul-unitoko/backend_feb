import AuthService from '../services/AuthService.js';
import RbacRepository from '../repositories/RbacRepository.js';
import jwt from 'jsonwebtoken';

class AuthController {
    // --- PUBLIC AUTH (UTC, UTB, UTD) ---
    async otpSend(req, res, next) {
        try {
            const { email } = req.body;
            const scope = req.headers['x-app-type'];
            if (!scope) return res.status(400).json({ error: 'Missing x-app-type' });

            const result = await AuthService.initiateRegistration(email, scope);
            res.json(result);
        } catch (err) { next(err); }
    }

    async otpVerify(req, res, next) {
        try {
            const { email, otp } = req.body;
            const scope = req.headers['x-app-type'];
            if (!scope) return res.status(400).json({ error: 'Missing x-app-type' });

            const meta = {
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                device_id: req.headers['x-device-id']
            };

            const result = await AuthService.verifyRegistrationOtp(email, otp, scope, meta);
            res.json(result);
        } catch (err) { next(err); }
    }

    async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await AuthService.completeProfile(userId, req.body);
            res.json(result);
        } catch (err) { next(err); }
    }

    async setPassword(req, res, next) {
        try {
            const userId = req.user.userId;
            const { password } = req.body;
            if (!password) return res.status(400).json({ error: 'Password required' });
            
            const result = await AuthService.setPassword(userId, password);
            res.json(result);
        } catch (err) { next(err); }
    }

    async changePassword(req, res, next) {
        try {
            const userId = req.user.userId;
            const { oldPassword, newPassword, confirmPassword } = req.body;
            if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });

            const result = await AuthService.changePassword(userId, oldPassword, newPassword);
            res.json(result);
        } catch (err) { next(err); }
    }

    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            const scope = req.headers['x-app-type'];
            if (!scope) return res.status(400).json({ error: 'Missing x-app-type' });

            const result = await AuthService.forgotPassword(email, scope);
            res.json(result);
        } catch (err) { next(err); }
    }

    async resetPassword(req, res, next) {
        try {
            const { email, otp, newPassword, confirmPassword } = req.body;
            const scope = req.headers['x-app-type'];
            if (!scope) return res.status(400).json({ error: 'Missing x-app-type' });
            if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });

            const result = await AuthService.resetPassword(email, otp, newPassword, scope);
            res.json(result);
        } catch (err) { next(err); }
    }

    // --- ADMIN (UTA) ---
    async adminRequest(req, res, next) {
        try {
            const { email } = req.body;
            const result = await AuthService.requestAdminAccess(email);
            res.json(result);
        } catch (err) { next(err); }
    }

    async adminVerify(req, res, next) {
        try {
            const { email, otp } = req.body;
            const scope = req.headers['x-app-type'];
            const meta = {
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                device_id: req.headers['x-device-id'],
                app_type: scope
            };
            const result = await AuthService.verifyAdminRequest(email, otp, meta);
            res.json(result);
        } catch (err) { next(err); }
    }

    async adminApprove(req, res, next) {
        try {
            // Protected by middleware check, but careful
            const { requestId } = req.params;
            const result = await AuthService.approveAdminAccess(requestId, req.user.userId);
            res.json(result);
        } catch (err) { next(err); }
    }

    async adminApproveMagic(req, res, next) {
        try {
            const { token } = req.query;
            if (!token) return res.send('Error: Missing token');

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.action !== 'approve_admin') throw new Error('Invalid token purpose');
                
                // Approve it! (Pass 'system' as adminId since it's magic link)
                await AuthService.approveAdminAccess(decoded.requestId, 'magic-link-system');
                
                // Return simple HTML success page
                res.send(`
                    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: green;">✅ Approved!</h1>
                        <p>Access for <b>${decoded.email}</b> has been granted.</p>
                        <p>They have been notified via email.</p>
                    </div>
                `);

            } catch (err) {
                console.error(err);
                res.status(400).send(`<h1 style="color: red;">Link Expired or Invalid</h1><p>${err.message}</p>`);
            }
        } catch (err) { next(err); }
    }

    // --- SHARED ---
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const scope = req.headers['x-app-type'];
            const meta = {
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                app_type: scope
            };
            const result = await AuthService.login(email, password, meta);
            res.json(result);
        } catch (err) { next(err); }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await AuthService.refresh(refreshToken);
            res.json(result);
        } catch (err) { next(err); }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            await AuthService.logout(refreshToken);
            res.json({ message: 'Logged out' });
        } catch (err) { next(err); }
    }

    async me(req, res, next) {
        res.json({ user: req.user });
    }
}

export default new AuthController();
