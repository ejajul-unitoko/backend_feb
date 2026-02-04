import jwt from 'jsonwebtoken';
import RbacRepository from '../repositories/RbacRepository.js';

export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach { userId, ... } to request

        // Hydrate Permissions based on App Scope
        const scope = req.headers['x-app-type'];
        if (scope) {
            req.user.permissions = await RbacRepository.getUserPermissions(req.user.userId, scope);
        } else {
            req.user.permissions = [];
        }

        next();
    } catch (err) {
        console.error(err);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
