import UserRepository from '../../repositories/UserRepository.js';
import RbacRepository from '../../repositories/RbacRepository.js';

class AdminUserService {
    async getAllUsers(filters) {
        return await UserRepository.findAll(filters);
    }

    async updateUser(userId, data) {
        // Separate roles from other user data
        const { roles, ...userData } = data;

        // 1. Update User Fields
        const user = await UserRepository.update(userId, userData);
        if (!user) {
            throw new Error('User not found or update failed');
        }

        // 2. Update Roles (if provided)
        if (roles && Array.isArray(roles)) {
            // Clear existing roles
            await RbacRepository.clearUserRoles(userId);
            
            // Assign new roles
            for (const roleName of roles) {
                const role = await RbacRepository.findRoleByName(roleName, user.scope);
                if (role) {
                    await RbacRepository.assignRoleToUser(userId, role.id);
                } else {
                    console.warn(`Role '${roleName}' not found for scope '${user.scope}'`);
                }
            }
        }
        
        // Return updated user (maybe with roles? Controller sends basic user back, table fetches fresh list anyway)
        return user;
    }

    async deleteUser(userId, requester = {}) {
        // 1. Fetch target user to check their roles
        const targetUser = await UserRepository.findById(userId);
        if (!targetUser) throw new Error('User not found');

        // 2. Fetch target roles
        const targetRoles = await RbacRepository.getUserRoles(userId, targetUser.scope); // Assuming RbacRepository is available
        const isTargetSuperAdmin = targetRoles.some(r => r.name === 'super_admin');

        // 3. Fetch requester roles (if not passed fully, we might need to fetch)
        // We expect requester to be the req.user object which usually has roles/permissions attached 
        // OR we fetch them here. Let's assume passed requester has ID and scope.
        // Actually, Controller should pass full requester info or we fetch.
        // Let's fetch requester roles to be safe.
        const requesterRoles = await RbacRepository.getUserRoles(requester.userId, requester.app_type || 'uta'); 
        const isRequesterSuperAdmin = requesterRoles.some(r => r.name === 'super_admin');

        // RULE: Super Admin can ONLY be deleted by another Super Admin (or nobody if we want strict protection)
        // User request: "ejajul (Super Admin) ... can be deleted by other users" (Assumption: TYPO, means CANNOT).
        // Let's implement: Target Super Admin -> Requester MUST be Super Admin.
        
        if (isTargetSuperAdmin && !isRequesterSuperAdmin) {
            throw new Error('Access Denied: Only Super Admins can delete other Super Admins.');
        }

        const result = await UserRepository.delete(userId);
        
        // Also remove any admin access request for this user's email
        // We need raw query access or a Repository method. Using pool here would require importing it.
        // Let's assume we can access pool from UserRepository or importa it.
        // Better: Add a method to UserRepository (or new RequestRepository?)
        // Quicker: Import pool here or add deleting logic to UserRepository.
        
        // Since UserRepository.delete is simple, let's update IT to delete from access requests too?
        // No, that makes UserRepository coupled to specific auth logic.
        // Let's do it here. Import pool.
        
        // Wait, I need targetUser.email which I fetched in step 1.
        if (targetUser.email) {
             const requestDelete = await import('../../config/database.js').then(m => m.default.query(
                'DELETE FROM admin_access_requests WHERE email = $1',
                [targetUser.email]
             ));
        }

        return { message: 'User deleted successfully' };
    }
}

export default new AdminUserService();
