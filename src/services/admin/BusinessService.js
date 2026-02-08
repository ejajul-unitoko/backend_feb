import BusinessRepository from '../../repositories/public/BusinessRepository.js';
import BusinessMarketRepository from '../../repositories/public/BusinessMarketRepository.js';

class AdminBusinessService {
    /**
     * Get all businesses (admin view)
     * @param {Object} filters - { kyc_status, status }
     * @returns {Promise<Array>} - Array of businesses
     */
    async getAllBusinesses(filters = {}) {
        return await BusinessRepository.findAll(filters);
    }

    /**
     * Get business by ID (admin view)
     * @param {string} id - Business UUID
     * @returns {Promise<Object>} - Business object with markets
     */
    async getBusinessById(id) {
        const business = await BusinessRepository.findById(id);
        if (!business) {
            throw new Error('Business not found');
        }

        // Get linked markets
        const markets = await BusinessMarketRepository.getMarketsByBusinessId(id);

        return {
            ...business,
            markets
        };
    }

    /**
     * Verify business KYC (approve/reject)
     * Edge Case 4: Business rejected with remarks, can re-upload
     * @param {string} id - Business UUID
     * @param {string} status - 'approved' or 'rejected'
     * @param {string} remarks - Admin remarks (required for rejection)
     * @returns {Promise<Object>} - Updated business
     */
    async verifyBusiness(id, status, remarks = null) {
        const business = await BusinessRepository.findById(id);
        if (!business) {
            throw new Error('Business not found');
        }

        // Validation
        const validStatuses = ['approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid KYC status. Must be approved or rejected');
        }

        // Edge Case 4: Rejection requires remarks
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

    /**
     * Suspend business (admin only)
     * @param {string} id - Business UUID
     * @param {string} reason - Suspension reason
     * @returns {Promise<Object>} - Updated business
     */
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

        // Update status and store reason in kyc_remarks
        const updated = await BusinessRepository.updateStatus(id, 'suspended');

        // Also update kyc_remarks with suspension reason
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

    /**
     * Activate business (admin only)
     * @param {string} id - Business UUID
     * @returns {Promise<Object>} - Updated business
     */
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

    /**
     * Search businesses (admin)
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} - Array of matching businesses
     */
    async searchBusinesses(query, filters = {}) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        return await BusinessRepository.search(query, filters);
    }

    /**
     * Get businesses by market (admin view)
     * @param {string} marketId - Market UUID
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} - Array of businesses
     */
    async getBusinessesByMarket(marketId, filters = {}) {
        return await BusinessMarketRepository.getBusinessesByMarketId(marketId, filters);
    }
}

export default new AdminBusinessService();
