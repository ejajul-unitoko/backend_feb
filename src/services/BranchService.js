import BranchRepository from '../repositories/BranchRepository.js';
import BusinessRepository from '../repositories/BusinessRepository.js';
import BranchUserRepository from '../repositories/BranchUserRepository.js';
import AddressService from './AddressService.js';
import AddressValidators from '../validators/AddressValidators.js';

class BranchService {
    /**
     * Get branches accessible by user
     */
    async getMyBranches(userId) {
        const business = await BusinessRepository.findByOwnerId(userId);

        if (business) {
            return await BranchRepository.findByBusinessId(business.id);
        } else {
            const branchUsers = await BranchUserRepository.getActiveBranchesByUserId(userId);
            return branchUsers;
        }
    }

    /**
     * Get branches by business ID (Admin/Internal use)
     */
    async getBranchesByBusinessId(businessId) {
        return await BranchRepository.findByBusinessId(businessId);
    }

    /**
     * Create a new branch
     */
    async createBranch(businessId, data, userId) {
        const business = await BusinessRepository.findById(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.owner_user_id !== userId) {
            throw new Error('Only business owner can create branches');
        }

        const { name, address, latitude, longitude } = data;

        if (!name || name.trim().length === 0) {
            throw new Error('Branch name is required');
        }

        if (!address) {
            throw new Error('Branch address is required');
        }

        let addressId;
        let addressStr;

        if (typeof address === 'string') {
            const addressData = {
                user_id: userId,
                purpose: 'branch_location',
                address_line_1: address,
                city: 'Delhi',
                state: 'Delhi',
                country: 'India',
                pincode: '110001',
                latitude: latitude || null,
                longitude: longitude || null,
                is_default: false
            };
            const newAddress = await AddressService.create(addressData); // Updated method name
            addressId = newAddress.id;
            addressStr = address;
        } else {
            const validation = AddressValidators.validate(address);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            const addressData = {
                ...address,
                user_id: userId,
                purpose: 'branch_location',
                is_default: false
            };
            const newAddress = await AddressService.create(addressData);
            addressId = newAddress.id;
            addressStr = `${newAddress.address_line_1}, ${newAddress.city}, ${newAddress.pincode}`;
        }

        const branchData = {
            business_id: businessId,
            name: name.trim(),
            address: addressStr,
            address_id: addressId,
            latitude: latitude || null,
            longitude: longitude || null,
            is_primary: false,
            status: 'active'
        };

        return await BranchRepository.create(branchData);
    }

    /**
     * Update a branch
     */
    async updateBranch(branchId, data, userId) {
        const branch = await BranchRepository.findById(branchId);
        if (!branch) {
            throw new Error('Branch not found');
        }

        const business = await BusinessRepository.findById(branch.business_id);
        const isOwner = business && business.owner_user_id === userId;

        if (!isOwner) {
            const branchUser = await BranchUserRepository.findByBranchAndUser(branchId, userId);
            if (!branchUser || branchUser.status !== 'active') {
                throw new Error('You do not have permission to update this branch');
            }
        }

        const updateData = {};

        if (data.name !== undefined) {
            if (!data.name || data.name.trim().length === 0) throw new Error('Branch name cannot be empty');
            updateData.name = data.name.trim();
        }

        if (data.address !== undefined) {
            if (!data.address || data.address.trim().length === 0) throw new Error('Branch address cannot be empty');
            updateData.address = data.address.trim();
        }

        if (data.latitude !== undefined) {
            if (data.latitude !== null) {
                const lat = parseFloat(data.latitude);
                if (isNaN(lat) || lat < -90 || lat > 90) throw new Error('Invalid latitude');
                updateData.latitude = lat;
            } else {
                updateData.latitude = null;
            }
        }

        if (data.longitude !== undefined) {
            if (data.longitude !== null) {
                const lon = parseFloat(data.longitude);
                if (isNaN(lon) || lon < -180 || lon > 180) throw new Error('Invalid longitude');
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
     */
    async deleteBranch(branchId, userId) {
        const branch = await BranchRepository.findById(branchId);
        if (!branch) {
            throw new Error('Branch not found');
        }

        const business = await BusinessRepository.findById(branch.business_id);
        if (!business || business.owner_user_id !== userId) {
            throw new Error('Only business owner can delete branches');
        }

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
     */
    async toggleBranchStatus(branchId, userId) {
        const branch = await BranchRepository.findById(branchId);
        if (!branch) {
            throw new Error('Branch not found');
        }

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
     */
    async getBranchById(branchId, userId) {
        const branch = await BranchRepository.findById(branchId);
        if (!branch) {
            throw new Error('Branch not found');
        }

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
