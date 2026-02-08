/**
 * Market Validators for Admin Operations
 * Validates input data for market creation and updates
 */

class MarketValidators {
    /**
     * Validate market creation data
     * @param {Object} data - Market data to validate
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    static validateCreate(data) {
        const errors = [];

        // Name validation
        if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
            errors.push('Market name is required');
        } else if (data.name.trim().length > 255) {
            errors.push('Market name must be less than 255 characters');
        }

        // Description validation (optional)
        if (data.description && typeof data.description !== 'string') {
            errors.push('Description must be a string');
        } else if (data.description && data.description.length > 1000) {
            errors.push('Description must be less than 1000 characters');
        }

        // Latitude validation (optional)
        if (data.latitude !== undefined && data.latitude !== null) {
            const lat = parseFloat(data.latitude);
            if (isNaN(lat)) {
                errors.push('Latitude must be a valid number');
            } else if (lat < -90 || lat > 90) {
                errors.push('Latitude must be between -90 and 90');
            }
        }

        // Longitude validation (optional)
        if (data.longitude !== undefined && data.longitude !== null) {
            const lon = parseFloat(data.longitude);
            if (isNaN(lon)) {
                errors.push('Longitude must be a valid number');
            } else if (lon < -180 || lon > 180) {
                errors.push('Longitude must be between -180 and 180');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate market update data
     * @param {Object} data - Market data to validate
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    static validateUpdate(data) {
        const errors = [];

        // Name validation (optional for update)
        if (data.name !== undefined) {
            if (typeof data.name !== 'string' || data.name.trim().length === 0) {
                errors.push('Market name cannot be empty');
            } else if (data.name.trim().length > 255) {
                errors.push('Market name must be less than 255 characters');
            }
        }

        // Description validation (optional)
        if (data.description !== undefined && data.description !== null) {
            if (typeof data.description !== 'string') {
                errors.push('Description must be a string');
            } else if (data.description.length > 1000) {
                errors.push('Description must be less than 1000 characters');
            }
        }

        // Latitude validation (optional)
        if (data.latitude !== undefined && data.latitude !== null) {
            const lat = parseFloat(data.latitude);
            if (isNaN(lat)) {
                errors.push('Latitude must be a valid number');
            } else if (lat < -90 || lat > 90) {
                errors.push('Latitude must be between -90 and 90');
            }
        }

        // Longitude validation (optional)
        if (data.longitude !== undefined && data.longitude !== null) {
            const lon = parseFloat(data.longitude);
            if (isNaN(lon)) {
                errors.push('Longitude must be a valid number');
            } else if (lon < -180 || lon > 180) {
                errors.push('Longitude must be between -180 and 180');
            }
        }

        // is_public validation (optional)
        if (data.is_public !== undefined && typeof data.is_public !== 'boolean') {
            errors.push('is_public must be a boolean');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate UUID format
     * @param {string} id - UUID to validate
     * @returns {boolean} - True if valid UUID
     */
    static validateUUID(id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }
}

export default MarketValidators;
