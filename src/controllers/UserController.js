import UserService from '../services/UserService.js';

class UserController {
    async listUsers(req, res, next) {
        try {
            const { type } = req.query;
            const filters = {};
            if (type) filters.scope = type;

            const users = await UserService.getAllUsers(filters);
            res.json(users);
        } catch (err) { next(err); }
    }

    async updateUser(req, res, next) {
        try {
            const { userId } = req.params;
            const updateData = req.body;

            delete updateData.password;
            delete updateData.password_hash;

            const user = await UserService.updateUser(userId, updateData);
            res.json(user);
        } catch (err) { next(err); }
    }

    async deleteUser(req, res, next) {
        try {
            const { userId } = req.params;
            const requester = {
                userId: req.user.userId,
                app_type: req.headers['x-app-type']
            };

            const result = await UserService.deleteUser(userId, requester);
            res.json(result);
        } catch (err) { next(err); }
    }
}

export default new UserController();
