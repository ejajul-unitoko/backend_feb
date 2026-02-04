import jwt from 'jsonwebtoken';
import RbacRepository from '../repositories/RbacRepository.js';

// 1. Authenticate (Verify Token)
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, ... }
        
        // Optimization: In a real "hot path", we might cache permissions in Redis.
        // For V0, let's load them fresh from DB to keep it robust and simple.
        // We need the APP SCOPE to know WHICH permissions to load.
        // We can trust the header IF we validated it on login, but safer to trust the context
        // if we decide to put scope in JWT.
        // Currently, our JWT doesn't have scope. Let's rely on the header for now, 
        // OR fix the JWT generation to include scope.
        // Let's assume the client sends the same x-app-type header.
        
        const scope = req.headers['x-app-type'];
        if (scope) {
            req.user.permissions = await RbacRepository.getUserPermissions(req.user.userId, scope);
        } else {
            req.user.permissions = [];
        }

        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// 2. Authorize (Check Permissions)
export const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (req.user.permissions.includes(requiredPermission)) {
            next();
        } else {
            res.status(403).json({ error: `Missing permission: ${requiredPermission}` });
        }
    };
};
