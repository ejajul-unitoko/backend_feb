import AddressValidators from '../common/AddressValidators.js';

class BranchValidators {
    /**
     * Validate branch creation data
     * @param {Object} data - Branch creation data
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    static validateCreate(data) {
        const errors = [];

        // Business ID
        if (!data.business_id) {
            errors.push('business_id is required');
        }

        // Branch name
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Branch name is required');
        } else if (data.name.trim().length < 3) {
            errors.push('Branch name must be at least 3 characters');
        }

        // Address
        if (!data.address) {
            errors.push('Branch address is required');
        } else if (typeof data.address === 'string') {
            if (data.address.trim().length < 10) {
                errors.push('Branch address must be at least 10 characters');
            }
        } else if (typeof data.address === 'object') {
            const addressValidation = AddressValidators.validate(data.address);
            if (!addressValidation.valid) {
                errors.push(...addressValidation.errors);
            }
        } else {
            errors.push('Invalid branch address format');
        }

        // Latitude (optional)
        if (data.latitude !== undefined && data.latitude !== null) {
            const lat = parseFloat(data.latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                errors.push('Invalid latitude. Must be between -90 and 90');
            }
        }

        // Longitude (optional)
        if (data.longitude !== undefined && data.longitude !== null) {
            const lon = parseFloat(data.longitude);
            if (isNaN(lon) || lon < -180 || lon > 180) {
                errors.push('Invalid longitude. Must be between -180 and 180');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate branch update data
     * @param {Object} data - Branch update data
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    static validateUpdate(data) {
        const errors = [];

        // Branch name (if provided)
        if (data.name !== undefined) {
            if (!data.name || data.name.trim().length === 0) {
                errors.push('Branch name cannot be empty');
            } else if (data.name.trim().length < 3) {
                errors.push('Branch name must be at least 3 characters');
            }
        }

        // Address (if provided)
        if (data.address !== undefined) {
            if (!data.address) {
                errors.push('Branch address cannot be empty');
            } else if (typeof data.address === 'string') {
                if (data.address.trim().length < 10) {
                    errors.push('Branch address must be at least 10 characters');
                }
            } else if (typeof data.address === 'object') {
                const addressValidation = AddressValidators.validate(data.address);
                if (!addressValidation.valid) {
                    errors.push(...addressValidation.errors);
                }
            } else {
                errors.push('Invalid branch address format');
            }
        }

        // Latitude (if provided)
        if (data.latitude !== undefined && data.latitude !== null) {
            const lat = parseFloat(data.latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                errors.push('Invalid latitude');
            }
        }

        // Longitude (if provided)
        if (data.longitude !== undefined && data.longitude !== null) {
            const lon = parseFloat(data.longitude);
            if (isNaN(lon) || lon < -180 || lon > 180) {
                errors.push('Invalid longitude');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export default BranchValidators;
