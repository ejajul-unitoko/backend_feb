import BusinessRepository from '../../repositories/public/BusinessRepository.js';
import BusinessMarketRepository from '../../repositories/public/BusinessMarketRepository.js';
import BranchRepository from '../../repositories/public/BranchRepository.js';

class BusinessService {
    /**
     * Get business owned by user
     * Edge Case 2: Check if user already owns a business
     * @param {string} userId - Owner user ID
     * @returns {Promise<Object|null>} - Business object or null
     */
    async getMyBusiness(userId) {
        return await BusinessRepository.findByOwnerId(userId);
    }

    /**
     * Register a new business
     * Edge Case 1: Auto-create default branch if no branches specified
     * Edge Case 6: Link to multiple markets
     * @param {Object} data - Business registration data
     * @param {string} userId - Owner user ID
     * @returns {Promise<Object>} - Created business with branch
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

        // Validate PAN format (10 characters, alphanumeric)
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(pan.toUpperCase())) {
            throw new Error('Invalid PAN format. Must be 10 characters (e.g., ABCDE1234F)');
        }

        // Validate GSTIN if provided (15 characters)
        if (gstin && gstin.trim().length > 0) {
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstinRegex.test(gstin.toUpperCase())) {
                throw new Error('Invalid GSTIN format. Must be 15 characters');
            }
        }

        if (!registered_address || registered_address.trim().length === 0) {
            throw new Error('Registered address is required');
        }

        // Edge Case 2: Check if user already owns a business
        const existingBusiness = await BusinessRepository.findByOwnerId(userId);
        if (existingBusiness) {
            throw new Error('You already own a business. Each user can own only one business.');
        }

        // Create business
        const businessData = {
            owner_user_id: userId,
            legal_name: legal_name.trim(),
            display_name: display_name.trim(),
            business_type,
            pan: pan.toUpperCase().trim(),
            gstin: gstin ? gstin.toUpperCase().trim() : null,
            registered_address: registered_address.trim(),
            logo_media_id: logo_media_id || null
        };

        const business = await BusinessRepository.create(businessData);

        // Edge Case 6: Link to markets if provided
        if (market_ids && market_ids.length > 0) {
            await BusinessMarketRepository.addMarkets(business.id, market_ids);
        }

        // Edge Case 1: Auto-create default branch
        const defaultBranch = {
            business_id: business.id,
            name: display_name.trim(),
            address: registered_address.trim(),
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
     * Update business details
     * @param {string} businessId - Business UUID
     * @param {Object} data - Fields to update
     * @param {string} userId - Owner user ID
     * @returns {Promise<Object>} - Updated business
     */
    async updateBusiness(businessId, data, userId) {
        // Verify ownership
        const business = await BusinessRepository.findById(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.owner_user_id !== userId) {
            throw new Error('You do not have permission to update this business');
        }

        // Cannot update if KYC is approved (prevent fraud)
        if (business.kyc_status === 'approved') {
            throw new Error('Cannot update business details after KYC approval. Contact admin for changes.');
        }

        const updateData = {};

        // Validate and prepare updates
        if (data.legal_name !== undefined) {
            if (!data.legal_name || data.legal_name.trim().length === 0) {
                throw new Error('Legal name cannot be empty');
            }
            updateData.legal_name = data.legal_name.trim();
        }

        if (data.display_name !== undefined) {
            if (!data.display_name || data.display_name.trim().length === 0) {
                throw new Error('Display name cannot be empty');
            }
            updateData.display_name = data.display_name.trim();
        }

        if (data.business_type !== undefined) {
            const validTypes = ['proprietorship', 'partnership', 'llp', 'private_limited'];
            if (!validTypes.includes(data.business_type)) {
                throw new Error('Invalid business type');
            }
            updateData.business_type = data.business_type;
        }

        if (data.pan !== undefined) {
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!panRegex.test(data.pan.toUpperCase())) {
                throw new Error('Invalid PAN format');
            }
            updateData.pan = data.pan.toUpperCase().trim();
        }

        if (data.gstin !== undefined && data.gstin) {
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstinRegex.test(data.gstin.toUpperCase())) {
                throw new Error('Invalid GSTIN format');
            }
            updateData.gstin = data.gstin.toUpperCase().trim();
        }

        if (data.registered_address !== undefined) {
            if (!data.registered_address || data.registered_address.trim().length === 0) {
                throw new Error('Registered address cannot be empty');
            }
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
     * Get business KYC status
     * @param {string} businessId - Business UUID
     * @param {string} userId - Owner user ID
     * @returns {Promise<Object>} - KYC status info
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
     * Get markets linked to business
     * @param {string} businessId - Business UUID
     * @param {string} userId - Owner user ID
     * @returns {Promise<Array>} - Array of markets
     */
    async getBusinessMarkets(businessId, userId) {
        const business = await BusinessRepository.findById(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.owner_user_id !== userId) {
            throw new Error('You do not have permission to view this business');
        }

        return await BusinessMarketRepository.getMarketsByBusinessId(businessId);
    }

    /**
     * Update business markets
     * @param {string} businessId - Business UUID
     * @param {Array<string>} marketIds - Array of market IDs
     * @param {string} userId - Owner user ID
     * @returns {Promise<Array>} - Updated markets
     */
    async updateBusinessMarkets(businessId, marketIds, userId) {
        const business = await BusinessRepository.findById(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.owner_user_id !== userId) {
            throw new Error('You do not have permission to update this business');
        }

        // Remove all existing markets
        await BusinessMarketRepository.removeAllMarkets(businessId);

        // Add new markets
        if (marketIds && marketIds.length > 0) {
            await BusinessMarketRepository.addMarkets(businessId, marketIds);
        }

        return await BusinessMarketRepository.getMarketsByBusinessId(businessId);
    }
}

export default new BusinessService();
