import BusinessRepository from '../repositories/BusinessRepository.js';
import BranchRepository from '../repositories/BranchRepository.js';
import BranchUserRepository from '../repositories/BranchUserRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import AddressService from './AddressService.js';
import AddressValidators from '../validators/AddressValidators.js';

class BusinessService {
    // =========================================================================
    // User / Business Owner Methods
    // =========================================================================

    /**
     * Get business owned by user
     */
    async getMyBusiness(userId) {
        return await BusinessRepository.findByOwnerId(userId);
    }

    /**
     * Register a new business
     */
    async registerBusiness(data, userId) {
        const {
            legal_name,
            display_name,
            business_type,
            pan,
            gstin,
            registered_address,
            logo_media_id,
            market_ids
        } = data;

        // Validation
        if (!legal_name || legal_name.trim().length === 0) {
            throw new Error('Legal business name is required');
        }

        if (!display_name || display_name.trim().length === 0) {
            throw new Error('Display name is required');
        }

        if (!business_type) {
            throw new Error('Business type is required');
        }

        const validBusinessTypes = ['proprietorship', 'partnership', 'llp', 'private_limited'];
        if (!validBusinessTypes.includes(business_type)) {
            throw new Error('Invalid business type');
        }

        if (!pan || pan.trim().length === 0) {
            throw new Error('PAN is required');
        }

        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(pan.toUpperCase())) {
            throw new Error('Invalid PAN format. Must be 10 characters (e.g., ABCDE1234F)');
        }

        if (gstin && gstin.trim().length > 0) {
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstinRegex.test(gstin.toUpperCase())) {
                throw new Error('Invalid GSTIN format. Must be 15 characters');
            }
        }

        if (!registered_address) {
            throw new Error('Registered address is required');
        }

        const existingBusiness = await BusinessRepository.findByOwnerId(userId);
        if (existingBusiness) {
            throw new Error('You already own a business. Each user can own only one business.');
        }

        let addressId;
        let addressStr;

        if (typeof registered_address === 'string') {
            const addressData = {
                user_id: userId,
                purpose: 'business_registered',
                address_line_1: registered_address,
                city: 'Delhi',
                state: 'Delhi',
                country: 'India',
                pincode: '110001',
                is_default: true
            };
            const newAddress = await AddressService.create(addressData); // Uses common create
            addressId = newAddress.id;
            addressStr = registered_address;
        } else {
            const validation = AddressValidators.validate(registered_address);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            const addressData = {
                ...registered_address,
                user_id: userId,
                purpose: 'business_registered',
                is_default: true
            };
            const newAddress = await AddressService.create(addressData);
            addressId = newAddress.id;
            addressStr = `${newAddress.address_line_1}, ${newAddress.city}, ${newAddress.pincode}`;
        }

        const businessData = {
            owner_user_id: userId,
            legal_name: legal_name.trim(),
            display_name: display_name.trim(),
            business_type,
            pan: pan.toUpperCase().trim(),
            gstin: gstin ? gstin.toUpperCase().trim() : null,
            registered_address: addressStr,
            registered_address_id: addressId,
            logo_media_id: logo_media_id || null
        };

        const business = await BusinessRepository.create(businessData);

        if (market_ids && market_ids.length > 0) {
            await BusinessRepository.addMarkets(business.id, market_ids);
        }

        // Edge Case 1: Auto-create default branch
        const branchAddressData = {
            ...(typeof registered_address === 'string' ? {
                address_line_1: registered_address,
                city: 'Delhi',
                state: 'Delhi',
                country: 'India',
                pincode: '110001'
            } : registered_address),
            user_id: userId,
            purpose: 'branch_location',
            is_default: true
        };

        const branchAddress = await AddressService.create(branchAddressData);

        const defaultBranch = {
            business_id: business.id,
            name: display_name.trim(),
            address: addressStr,
            address_id: branchAddress.id,
            is_primary: true,
            status: 'active'
        };

        const branch = await BranchRepository.create(defaultBranch);

        return {
            ...business,
            default_branch: branch
        };
    }

    /**
     * Update business details (User)
     */
    async updateBusiness(businessId, data, userId) {
        const business = await BusinessRepository.findById(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.owner_user_id !== userId) {
            throw new Error('You do not have permission to update this business');
        }

        if (business.kyc_status === 'approved') {
            throw new Error('Cannot update business details after KYC approval. Contact admin for changes.');
        }

        const updateData = {};

        if (data.legal_name !== undefined) {
            if (!data.legal_name || data.legal_name.trim().length === 0) throw new Error('Legal name cannot be empty');
            updateData.legal_name = data.legal_name.trim();
        }

        if (data.display_name !== undefined) {
            if (!data.display_name || data.display_name.trim().length === 0) throw new Error('Display name cannot be empty');
            updateData.display_name = data.display_name.trim();
        }

        if (data.business_type !== undefined) {
            const validTypes = ['proprietorship', 'partnership', 'llp', 'private_limited'];
            if (!validTypes.includes(data.business_type)) throw new Error('Invalid business type');
            updateData.business_type = data.business_type;
        }

        if (data.pan !== undefined) {
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!panRegex.test(data.pan.toUpperCase())) throw new Error('Invalid PAN format');
            updateData.pan = data.pan.toUpperCase().trim();
        }

        if (data.gstin !== undefined && data.gstin) {
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstinRegex.test(data.gstin.toUpperCase())) throw new Error('Invalid GSTIN format');
            updateData.gstin = data.gstin.toUpperCase().trim();
        }

        if (data.registered_address !== undefined) {
            if (!data.registered_address || data.registered_address.trim().length === 0) throw new Error('Registered address cannot be empty');
            updateData.registered_address = data.registered_address.trim();
        }

        if (data.logo_media_id !== undefined) {
            updateData.logo_media_id = data.logo_media_id;
        }

        const updated = await BusinessRepository.update(businessId, updateData);
        if (!updated) {
            throw new Error('Failed to update business');
        }

        return updated;
    }

    /**
     * Get business KYC status (User)
     */
    async getBusinessStatus(businessId, userId) {
        const business = await BusinessRepository.findById(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.owner_user_id !== userId) {
            throw new Error('You do not have permission to view this business');
        }

        return {
            kyc_status: business.kyc_status,
            kyc_remarks: business.kyc_remarks,
            status: business.status
        };
    }

    /**
     * Get markets linked to business (User)
     */
    async getBusinessMarkets(businessId, userId) {
        const business = await BusinessRepository.findById(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.owner_user_id !== userId) {
            throw new Error('You do not have permission to view this business');
        }

        return await BusinessRepository.getMarketsByBusinessId(businessId);
    }

    /**
     * Update business markets (User)
     */
    async updateBusinessMarkets(businessId, marketIds, userId) {
        const business = await BusinessRepository.findById(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.owner_user_id !== userId) {
            throw new Error('You do not have permission to update this business');
        }

        await BusinessRepository.removeAllMarkets(businessId);

        if (marketIds && marketIds.length > 0) {
            await BusinessRepository.addMarkets(businessId, marketIds);
        }

        return await BusinessRepository.getMarketsByBusinessId(businessId);
    }

    // =========================================================================
    // Admin Methods
    // =========================================================================

    async getAllBusinesses(filters = {}) {
        return await BusinessRepository.findAll(filters);
    }

    async getBusinessById(id) {
        const business = await BusinessRepository.findById(id);
        if (!business) {
            throw new Error('Business not found');
        }

        const [markets, branches, owner] = await Promise.all([
            BusinessRepository.getMarketsByBusinessId(id),
            BranchRepository.findByBusinessId(id),
            UserRepository.findById(business.owner_user_id)
        ]);

        const branchesWithUsers = await Promise.all(branches.map(async (branch) => {
            const users = await BranchUserRepository.findByBranchId(branch.id);
            return {
                ...branch,
                users
            };
        }));

        let ownerDetails = null;
        if (owner) {
            const { password_hash, ...safeOwner } = owner;
            ownerDetails = safeOwner;
        }

        return {
            ...business,
            owner: ownerDetails,
            markets,
            branches: branchesWithUsers
        };
    }

    async verifyBusiness(id, status, remarks = null) {
        const business = await BusinessRepository.findById(id);
        if (!business) {
            throw new Error('Business not found');
        }

        const validStatuses = ['approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid KYC status. Must be approved or rejected');
        }

        if (status === 'rejected' && (!remarks || remarks.trim().length === 0)) {
            throw new Error('Rejection remarks are required when rejecting KYC');
        }

        const updated = await BusinessRepository.updateKycStatus(
            id,
            status,
            status === 'rejected' ? remarks.trim() : null
        );

        if (!updated) {
            throw new Error('Failed to update KYC status');
        }

        return updated;
    }

    async suspendBusiness(id, reason) {
        const business = await BusinessRepository.findById(id);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.status === 'suspended') {
            throw new Error('Business is already suspended');
        }

        if (!reason || reason.trim().length === 0) {
            throw new Error('Suspension reason is required');
        }

        const updated = await BusinessRepository.updateStatus(id, 'suspended');

        await BusinessRepository.updateKycStatus(
            id,
            business.kyc_status,
            `SUSPENDED: ${reason.trim()}`
        );

        if (!updated) {
            throw new Error('Failed to suspend business');
        }

        return updated;
    }

    async activateBusiness(id) {
        const business = await BusinessRepository.findById(id);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.status === 'active') {
            throw new Error('Business is already active');
        }

        const updated = await BusinessRepository.updateStatus(id, 'active');

        if (!updated) {
            throw new Error('Failed to activate business');
        }

        return updated;
    }

    async searchBusinesses(query, filters = {}) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        return await BusinessRepository.search(query, filters);
    }

    async getBusinessesByMarket(marketId, filters = {}) {
        return await BusinessRepository.getBusinessesByMarketId(marketId, filters);
    }
}

export default new BusinessService();
