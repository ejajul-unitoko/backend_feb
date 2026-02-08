class AdminBusinessValidators {
    /**
     * Validate KYC verification data
     * @param {Object} data - Verification data
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    static validateVerification(data) {
        const errors = [];

        // KYC status
        const validStatuses = ['approved', 'rejected'];
        if (!data.kyc_status) {
            errors.push('kyc_status is required');
        } else if (!validStatuses.includes(data.kyc_status)) {
            errors.push('Invalid kyc_status. Must be: approved or rejected');
        }

        // Remarks (required for rejection)
        if (data.kyc_status === 'rejected') {
            if (!data.kyc_remarks || data.kyc_remarks.trim().length === 0) {
                errors.push('kyc_remarks are required when rejecting KYC');
            } else if (data.kyc_remarks.trim().length < 10) {
                errors.push('kyc_remarks must be at least 10 characters');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate suspension data
     * @param {Object} data - Suspension data
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    static validateSuspension(data) {
        const errors = [];

        if (!data.reason || data.reason.trim().length === 0) {
            errors.push('Suspension reason is required');
        } else if (data.reason.trim().length < 10) {
            errors.push('Suspension reason must be at least 10 characters');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export default AdminBusinessValidators;
