import BranchUserRepository from '../repositories/BranchUserRepository.js';
import BranchRepository from '../repositories/BranchRepository.js';
import BusinessRepository from '../repositories/BusinessRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import bcrypt from 'bcrypt';

class BranchUserService {
    /**
     * Assign user to branch
     */
    async assignUser(branchId, data, ownerId) {
        const { email, role, password } = data;

        if (!email || email.trim().length === 0) throw new Error('Email is required');
        if (!role) throw new Error('Role is required');
        const validRoles = ['manager', 'staff'];
        if (!validRoles.includes(role)) throw new Error('Invalid role. Must be manager or staff');
        if (!password || password.length < 6) throw new Error('Password is required and must be at least 6 characters');

        const branch = await BranchRepository.findById(branchId);
        if (!branch) throw new Error('Branch not found');

        const business = await BusinessRepository.findById(branch.business_id);
        if (!business || business.owner_user_id !== ownerId) throw new Error('Only business owner can assign users to branches');

        let user = await UserRepository.findByEmail(email.toLowerCase().trim(), 'utb');

        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await UserRepository.create({
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                scope: 'utb',
                name: email.split('@')[0],
                status: 'pending'
            });
        }

        const existing = await BranchUserRepository.findByBranchAndUser(branchId, user.id);
        if (existing) {
            if (existing.status === 'active') {
                throw new Error('User is already assigned to this branch');
            } else {
                return await BranchUserRepository.updateStatus(existing.id, 'active');
            }
        }

        const branchUserData = {
            branch_id: branchId,
            user_id: user.id,
            role,
            status: 'active'
        };

        const branchUser = await BranchUserRepository.create(branchUserData);

        return {
            ...branchUser,
            user_email: user.email,
            user_status: user.status
        };
    }

    /**
     * Get users assigned to a branch
     */
    async getBranchUsers(branchId, userId, isAdmin = false) {
        const branch = await BranchRepository.findById(branchId);
        if (!branch) throw new Error('Branch not found');

        if (!isAdmin) {
            const business = await BusinessRepository.findById(branch.business_id);
            const isOwner = business && business.owner_user_id === userId;

            if (!isOwner) {
                const branchUser = await BranchUserRepository.findByBranchAndUser(branchId, userId);
                if (!branchUser || branchUser.status !== 'active') {
                    throw new Error('You do not have permission to view branch users');
                }
            }
        }

        return await BranchUserRepository.findByBranchId(branchId);
    }

    /**
     * Update user role
     */
    async updateUserRole(branchUserId, role, ownerId, isAdmin = false) {
        const validRoles = ['manager', 'staff'];
        if (!validRoles.includes(role)) throw new Error('Invalid role. Must be manager or staff');

        const branchUser = await BranchUserRepository.findById(branchUserId);
        if (!branchUser) throw new Error('Branch user assignment not found');

        if (!isAdmin) {
            const branch = await BranchRepository.findById(branchUser.branch_id);
            const business = await BusinessRepository.findById(branch.business_id);

            if (!business || business.owner_user_id !== ownerId) {
                throw new Error('Only business owner can update user roles');
            }
        }

        const updated = await BranchUserRepository.updateRole(branchUserId, role);
        if (!updated) throw new Error('Failed to update user role');

        return updated;
    }

    /**
     * Revoke user access to branch
     */
    async revokeUser(branchUserId, ownerId, isAdmin = false) {
        const branchUser = await BranchUserRepository.findById(branchUserId);
        if (!branchUser) throw new Error('Branch user assignment not found');

        if (!isAdmin) {
            const branch = await BranchRepository.findById(branchUser.branch_id);
            const business = await BusinessRepository.findById(branch.business_id);

            if (!business || business.owner_user_id !== ownerId) {
                throw new Error('Only business owner can revoke user access');
            }
        }

        const updated = await BranchUserRepository.updateStatus(branchUserId, 'revoked');
        if (!updated) throw new Error('Failed to revoke user access');

        return updated;
    }

    /**
     * Delete branch user assignment (hard delete)
     */
    async deleteUser(branchUserId, ownerId, isAdmin = false) {
        const branchUser = await BranchUserRepository.findById(branchUserId);
        if (!branchUser) throw new Error('Branch user assignment not found');

        if (!isAdmin) {
            const branch = await BranchRepository.findById(branchUser.branch_id);
            const business = await BusinessRepository.findById(branch.business_id);

            if (!business || business.owner_user_id !== ownerId) {
                throw new Error('Only business owner can delete user assignments');
            }
        }

        const deleted = await BranchUserRepository.delete(branchUserId);
        if (!deleted) throw new Error('Failed to delete user assignment');

        return deleted;
    }

    /**
     * Reactivate user access to branch
     */
    async reactivateUser(branchUserId, ownerId, isAdmin = false) {
        const branchUser = await BranchUserRepository.findById(branchUserId);
        if (!branchUser) throw new Error('Branch user assignment not found');

        if (!isAdmin) {
            const branch = await BranchRepository.findById(branchUser.branch_id);
            const business = await BusinessRepository.findById(branch.business_id);

            if (!business || business.owner_user_id !== ownerId) {
                throw new Error('Only business owner can reactivate user access');
            }
        }

        const updated = await BranchUserRepository.updateStatus(branchUserId, 'active');
        if (!updated) throw new Error('Failed to reactivate user access');
    }
}

export default new BranchUserService();
