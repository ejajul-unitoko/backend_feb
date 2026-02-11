import AddressValidators from '../common/AddressValidators.js';

class BusinessValidators {
    /**
     * Validate business registration data
     * @param {Object} data - Business registration data
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    static validateRegister(data) {
        const errors = [];

        // Legal name
        if (!data.legal_name || data.legal_name.trim().length === 0) {
            errors.push('Legal business name is required');
        } else if (data.legal_name.trim().length < 3) {
            errors.push('Legal business name must be at least 3 characters');
        }

        // Display name
        if (!data.display_name || data.display_name.trim().length === 0) {
            errors.push('Display name is required');
        } else if (data.display_name.trim().length < 3) {
            errors.push('Display name must be at least 3 characters');
        }

        // Business type
        const validBusinessTypes = ['proprietorship', 'partnership', 'llp', 'private_limited'];
        if (!data.business_type) {
            errors.push('Business type is required');
        } else if (!validBusinessTypes.includes(data.business_type)) {
            errors.push('Invalid business type. Must be: proprietorship, partnership, llp, or private_limited');
        }

        // PAN validation
        if (!data.pan || data.pan.trim().length === 0) {
            errors.push('PAN is required');
        } else {
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!panRegex.test(data.pan.toUpperCase())) {
                errors.push('Invalid PAN format. Must be 10 characters (e.g., ABCDE1234F)');
            }
        }

        // GSTIN validation (optional)
        if (data.gstin && data.gstin.trim().length > 0) {
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstinRegex.test(data.gstin.toUpperCase())) {
                errors.push('Invalid GSTIN format. Must be 15 characters');
            }
        }

        // Registered address
        if (!data.registered_address) {
            errors.push('Registered address is required');
        } else if (typeof data.registered_address === 'string') {
            if (data.registered_address.trim().length < 10) {
                errors.push('Registered address must be at least 10 characters');
            }
        } else if (typeof data.registered_address === 'object') {
            const addressValidation = AddressValidators.validate(data.registered_address);
            if (!addressValidation.valid) {
                errors.push(...addressValidation.errors);
            }
        } else {
            errors.push('Invalid registered address format');
        }

        // Market IDs (optional but must be array if provided)
        if (data.market_ids !== undefined && !Array.isArray(data.market_ids)) {
            errors.push('market_ids must be an array');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate business update data
     * @param {Object} data - Business update data
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    static validateUpdate(data) {
        const errors = [];

        // Legal name (if provided)
        if (data.legal_name !== undefined) {
            if (!data.legal_name || data.legal_name.trim().length === 0) {
                errors.push('Legal business name cannot be empty');
            } else if (data.legal_name.trim().length < 3) {
                errors.push('Legal business name must be at least 3 characters');
            }
        }

        // Display name (if provided)
        if (data.display_name !== undefined) {
            if (!data.display_name || data.display_name.trim().length === 0) {
                errors.push('Display name cannot be empty');
            } else if (data.display_name.trim().length < 3) {
                errors.push('Display name must be at least 3 characters');
            }
        }

        // Business type (if provided)
        if (data.business_type !== undefined) {
            const validBusinessTypes = ['proprietorship', 'partnership', 'llp', 'private_limited'];
            if (!validBusinessTypes.includes(data.business_type)) {
                errors.push('Invalid business type');
            }
        }

        // PAN (if provided)
        if (data.pan !== undefined) {
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!panRegex.test(data.pan.toUpperCase())) {
                errors.push('Invalid PAN format');
            }
        }

        // GSTIN (if provided)
        if (data.gstin !== undefined && data.gstin) {
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstinRegex.test(data.gstin.toUpperCase())) {
                errors.push('Invalid GSTIN format');
            }
        }

        // Registered address (if provided)
        if (data.registered_address !== undefined) {
            if (!data.registered_address) {
                errors.push('Registered address cannot be empty');
            } else if (typeof data.registered_address === 'string') {
                if (data.registered_address.trim().length < 10) {
                    errors.push('Registered address must be at least 10 characters');
                }
            } else if (typeof data.registered_address === 'object') {
                const addressValidation = AddressValidators.validate(data.registered_address);
                if (!addressValidation.valid) {
                    errors.push(...addressValidation.errors);
                }
            } else {
                errors.push('Invalid registered address format');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export default BusinessValidators;
