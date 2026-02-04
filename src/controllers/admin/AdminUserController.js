import AdminUserService from '../../services/admin/AdminUserService.js';

class AdminUserController {
    async listUsers(req, res, next) {
        try {
            const { type } = req.query;
            const filters = {};
            if (type) filters.scope = type;

            const users = await AdminUserService.getAllUsers(filters);
            res.json(users);
        } catch (err) { next(err); }
    }

    async updateUser(req, res, next) {
        try {
            const { userId } = req.params;
            const updateData = req.body;
            
            // Prevent updating immutable fields if necessary, but for now allow all passed fields
            // excluding security sensitive ones ideally, but admin has power.
            // Maybe block password update here if we have a specific endpoint for it?
            // The prompt said "edit email, name, number and profile".
            delete updateData.password; // use specific password endpoints for safety if needed, or allow it.
            delete updateData.password_hash; // definitely don't allow raw hash update

            const user = await AdminUserService.updateUser(userId, updateData);
            res.json(user);
        } catch (err) { next(err); }
    }

    async deleteUser(req, res, next) {
        try {
            const { userId } = req.params;
            // Pass requester info (req.user has userId from jwt)
            // We also need app_type from header or token. 
            // Auth middleware usually attaches user.
            const requester = { 
                userId: req.user.userId, 
                app_type: req.headers['x-app-type'] 
            };
            
            const result = await AdminUserService.deleteUser(userId, requester);
            res.json(result);
        } catch (err) { next(err); }
    }
}

export default new AdminUserController();
