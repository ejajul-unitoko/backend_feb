import UserRepository from '../repositories/UserRepository.js';
import RbacRepository from '../repositories/RbacRepository.js';

class UserService {
    async getAllUsers(filters) {
        return await UserRepository.findAll(filters);
    }

    async updateUser(userId, data) {
        const { roles, ...userData } = data;

        const user = await UserRepository.update(userId, userData);
        if (!user) {
            throw new Error('User not found or update failed');
        }

        if (roles && Array.isArray(roles)) {
            await RbacRepository.clearUserRoles(userId);

            for (const roleName of roles) {
                const role = await RbacRepository.findRoleByName(roleName, user.scope);
                if (role) {
                    await RbacRepository.assignRoleToUser(userId, role.id);
                } else {
                    console.warn(`Role '${roleName}' not found for scope '${user.scope}'`);
                }
            }
        }

        return user;
    }

    async deleteUser(userId, requester = {}) {
        const targetUser = await UserRepository.findById(userId);
        if (!targetUser) throw new Error('User not found');

        const targetRoles = await RbacRepository.getUserRoles(userId, targetUser.scope);
        const isTargetSuperAdmin = targetRoles.some(r => r.name === 'super_admin');

        const requesterRoles = await RbacRepository.getUserRoles(requester.userId, requester.app_type || 'uta');
        const isRequesterSuperAdmin = requesterRoles.some(r => r.name === 'super_admin');

        if (isTargetSuperAdmin && !isRequesterSuperAdmin) {
            throw new Error('Access Denied: Only Super Admins can delete other Super Admins.');
        }

        const result = await UserRepository.delete(userId);

        if (targetUser.email) {
            const requestDelete = await import('../config/database.js').then(m => m.default.query(
                'DELETE FROM admin_access_requests WHERE email = $1',
                [targetUser.email]
            ));
        }

        return { message: 'User deleted successfully' };
    }
}

export default new UserService();
