import BranchRepository from '../../repositories/public/BranchRepository.js';
import BusinessRepository from '../../repositories/public/BusinessRepository.js';
import BranchUserRepository from '../../repositories/public/BranchUserRepository.js';

class BranchService {
    /**
     * Get branches accessible by user
     * Edge Case 5: Owner gets all branches, managers get only assigned branches
     * @param {string} userId - User ID
     * @returns {Promise<Array>} - Array of branches
     */
    async getMyBranches(userId) {
        // Check if user owns a business
        const business = await BusinessRepository.findByOwnerId(userId);

        if (business) {
            // Owner gets all branches
            return await BranchRepository.findByBusinessId(business.id);
        } else {
            // Manager/staff gets only assigned branches
            const branchUsers = await BranchUserRepository.getActiveBranchesByUserId(userId);
            return branchUsers;
        }
    }

    /**
     * Create a new branch
     * @param {string} businessId - Business UUID
     * @param {Object} data - Branch data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Created branch
     */
    async createBranch(businessId, data, userId) {
        // Verify ownership
        const business = await BusinessRepository.findById(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.owner_user_id !== userId) {
            throw new Error('Only business owner can create branches');
        }

        const { name, address, latitude, longitude } = data;

        // Validation
        if (!name || name.trim().length === 0) {
            throw new Error('Branch name is required');
        }

        if (!address || address.trim().length === 0) {
            throw new Error('Branch address is required');
        }

        // Validate coordinates if provided
        if (latitude !== undefined && latitude !== null) {
            const lat = parseFloat(latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                throw new Error('Invalid latitude. Must be between -90 and 90');
            }
        }

        if (longitude !== undefined && longitude !== null) {
            const lon = parseFloat(longitude);
            if (isNaN(lon) || lon < -180 || lon > 180) {
                throw new Error('Invalid longitude. Must be between -180 and 180');
            }
        }

        const branchData = {
            business_id: businessId,
            name: name.trim(),
            address: address.trim(),
            latitude: latitude || null,
            longitude: longitude || null,
            is_primary: false, // Additional branches are never primary
            status: 'active'
        };

        return await BranchRepository.create(branchData);
    }

    /**
     * Update a branch
     * @param {string} branchId - Branch UUID
     * @param {Object} data - Fields to update
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Updated branch
     */
    async updateBranch(branchId, data, userId) {
        const branch = await BranchRepository.findById(branchId);
        if (!branch) {
            throw new Error('Branch not found');
        }

        // Check permissions: owner or assigned manager
        const business = await BusinessRepository.findById(branch.business_id);
        const isOwner = business && business.owner_user_id === userId;

        if (!isOwner) {
            // Check if user is assigned to this branch
            const branchUser = await BranchUserRepository.findByBranchAndUser(branchId, userId);
            if (!branchUser || branchUser.status !== 'active') {
                throw new Error('You do not have permission to update this branch');
            }
        }

        const updateData = {};

        if (data.name !== undefined) {
            if (!data.name || data.name.trim().length === 0) {
                throw new Error('Branch name cannot be empty');
            }
            updateData.name = data.name.trim();
        }

        if (data.address !== undefined) {
            if (!data.address || data.address.trim().length === 0) {
                throw new Error('Branch address cannot be empty');
            }
            updateData.address = data.address.trim();
        }

        if (data.latitude !== undefined) {
            if (data.latitude !== null) {
                const lat = parseFloat(data.latitude);
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    throw new Error('Invalid latitude');
                }
                updateData.latitude = lat;
            } else {
                updateData.latitude = null;
            }
        }

        if (data.longitude !== undefined) {
            if (data.longitude !== null) {
                const lon = parseFloat(data.longitude);
                if (isNaN(lon) || lon < -180 || lon > 180) {
                    throw new Error('Invalid longitude');
                }
                updateData.longitude = lon;
            } else {
                updateData.longitude = null;
            }
        }

        const updated = await BranchRepository.update(branchId, updateData);
        if (!updated) {
            throw new Error('Failed to update branch');
        }

        return updated;
    }

    /**
     * Delete a branch
     * @param {string} branchId - Branch UUID
     * @param {string} userId - User ID (must be owner)
     * @returns {Promise<Object>} - Deleted branch
     */
    async deleteBranch(branchId, userId) {
        const branch = await BranchRepository.findById(branchId);
        if (!branch) {
            throw new Error('Branch not found');
        }

        // Only owner can delete branches
        const business = await BusinessRepository.findById(branch.business_id);
        if (!business || business.owner_user_id !== userId) {
            throw new Error('Only business owner can delete branches');
        }

        // Cannot delete primary branch if it's the only one
        if (branch.is_primary) {
            const branchCount = await BranchRepository.countByBusinessId(branch.business_id);
            if (branchCount === 1) {
                throw new Error('Cannot delete the only branch. Business must have at least one branch.');
            }
        }

        const deleted = await BranchRepository.delete(branchId);
        if (!deleted) {
            throw new Error('Failed to delete branch');
        }

        return deleted;
    }

    /**
     * Toggle branch status
     * @param {string} branchId - Branch UUID
     * @param {string} userId - User ID (must be owner)
     * @returns {Promise<Object>} - Updated branch
     */
    async toggleBranchStatus(branchId, userId) {
        const branch = await BranchRepository.findById(branchId);
        if (!branch) {
            throw new Error('Branch not found');
        }

        // Only owner can change status
        const business = await BusinessRepository.findById(branch.business_id);
        if (!business || business.owner_user_id !== userId) {
            throw new Error('Only business owner can change branch status');
        }

        const newStatus = branch.status === 'active' ? 'inactive' : 'active';
        const updated = await BranchRepository.updateStatus(branchId, newStatus);

        if (!updated) {
            throw new Error('Failed to update branch status');
        }

        return updated;
    }

    /**
     * Get branch by ID with permission check
     * @param {string} branchId - Branch UUID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Branch object
     */
    async getBranchById(branchId, userId) {
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
                throw new Error('You do not have permission to view this branch');
            }
        }

        return branch;
    }
}

export default new BranchService();
