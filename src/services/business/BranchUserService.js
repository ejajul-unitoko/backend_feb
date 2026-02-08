import BranchUserRepository from '../../repositories/public/BranchUserRepository.js';
import BranchRepository from '../../repositories/public/BranchRepository.js';
import BusinessRepository from '../../repositories/public/BusinessRepository.js';
import UserRepository from '../../repositories/UserRepository.js';
import bcrypt from 'bcrypt';

class BranchUserService {
    /**
     * Assign user to branch
     * Edge Case 3: Create user if email doesn't exist (pending until first login)
     * @param {string} branchId - Branch UUID
     * @param {Object} data - { email, role, password }
     * @param {string} ownerId - Owner user ID
     * @returns {Promise<Object>} - Created branch user assignment
     */
    async assignUser(branchId, data, ownerId) {
        const { email, role, password } = data;

        // Validation
        if (!email || email.trim().length === 0) {
            throw new Error('Email is required');
        }

        if (!role) {
            throw new Error('Role is required');
        }

        const validRoles = ['manager', 'staff'];
        if (!validRoles.includes(role)) {
            throw new Error('Invalid role. Must be manager or staff');
        }

        if (!password || password.length < 6) {
            throw new Error('Password is required and must be at least 6 characters');
        }

        // Verify branch exists and user is owner
        const branch = await BranchRepository.findById(branchId);
        if (!branch) {
            throw new Error('Branch not found');
        }

        const business = await BusinessRepository.findById(branch.business_id);
        if (!business || business.owner_user_id !== ownerId) {
            throw new Error('Only business owner can assign users to branches');
        }

        // Edge Case 3: Find or create user
        let user = await UserRepository.findByEmailAndScope(email.toLowerCase().trim(), 'utb');

        if (!user) {
            // Create new user with pending status
            const hashedPassword = await bcrypt.hash(password, 10);

            user = await UserRepository.create({
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                scope: 'utb',
                full_name: email.split('@')[0], // Temporary name
                status: 'pending' // Will be activated on first login
            });
        }

        // Check if user is already assigned to this branch
        const existing = await BranchUserRepository.findByBranchAndUser(branchId, user.id);
        if (existing) {
            if (existing.status === 'active') {
                throw new Error('User is already assigned to this branch');
            } else {
                // Reactivate revoked user
                return await BranchUserRepository.updateStatus(existing.id, 'active');
            }
        }

        // Create branch user assignment
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
     * @param {string} branchId - Branch UUID
     * @param {string} userId - User ID (owner or assigned user)
     * @returns {Promise<Array>} - Array of branch users
     */
    async getBranchUsers(branchId, userId) {
        const branch = await BranchRepository.findById(branchId);
        if (!branch) {
            throw new Error('Branch not found');
        }

        // Check permissions
        const business = await BusinessRepository.findById(branch.business_id);
        const isOwner = business && business.owner_user_id === userId;

        if (!isOwner) {
            const branchUser = await BranchUserRepository.findByBranchAndUser(branchId, userId);
            if (!branchUser || branchUser.status !== 'active') {
                throw new Error('You do not have permission to view branch users');
            }
        }

        return await BranchUserRepository.findByBranchId(branchId);
    }

    /**
     * Update user role
     * @param {string} branchUserId - Branch user UUID
     * @param {string} role - New role
     * @param {string} ownerId - Owner user ID
     * @returns {Promise<Object>} - Updated branch user
     */
    async updateUserRole(branchUserId, role, ownerId) {
        const validRoles = ['manager', 'staff'];
        if (!validRoles.includes(role)) {
            throw new Error('Invalid role. Must be manager or staff');
        }

        const branchUser = await BranchUserRepository.findById(branchUserId);
        if (!branchUser) {
            throw new Error('Branch user assignment not found');
        }

        // Verify ownership
        const branch = await BranchRepository.findById(branchUser.branch_id);
        const business = await BusinessRepository.findById(branch.business_id);

        if (!business || business.owner_user_id !== ownerId) {
            throw new Error('Only business owner can update user roles');
        }

        const updated = await BranchUserRepository.updateRole(branchUserId, role);
        if (!updated) {
            throw new Error('Failed to update user role');
        }

        return updated;
    }

    /**
     * Revoke user access to branch
     * @param {string} branchUserId - Branch user UUID
     * @param {string} ownerId - Owner user ID
     * @returns {Promise<Object>} - Updated branch user
     */
    async revokeUser(branchUserId, ownerId) {
        const branchUser = await BranchUserRepository.findById(branchUserId);
        if (!branchUser) {
            throw new Error('Branch user assignment not found');
        }

        // Verify ownership
        const branch = await BranchRepository.findById(branchUser.branch_id);
        const business = await BusinessRepository.findById(branch.business_id);

        if (!business || business.owner_user_id !== ownerId) {
            throw new Error('Only business owner can revoke user access');
        }

        const updated = await BranchUserRepository.updateStatus(branchUserId, 'revoked');
        if (!updated) {
            throw new Error('Failed to revoke user access');
        }

        return updated;
    }

    /**
     * Delete branch user assignment (hard delete)
     * @param {string} branchUserId - Branch user UUID
     * @param {string} ownerId - Owner user ID
     * @returns {Promise<Object>} - Deleted branch user
     */
    async deleteUser(branchUserId, ownerId) {
        const branchUser = await BranchUserRepository.findById(branchUserId);
        if (!branchUser) {
            throw new Error('Branch user assignment not found');
        }

        // Verify ownership
        const branch = await BranchRepository.findById(branchUser.branch_id);
        const business = await BusinessRepository.findById(branch.business_id);

        if (!business || business.owner_user_id !== ownerId) {
            throw new Error('Only business owner can delete user assignments');
        }

        const deleted = await BranchUserRepository.delete(branchUserId);
        if (!deleted) {
            throw new Error('Failed to delete user assignment');
        }

        return deleted;
    }
}

export default new BranchUserService();
