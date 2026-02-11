class BranchUserValidators {
    /**
     * Validate user assignment data
     * @param {Object} data - User assignment data
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    static validateAssign(data) {
        const errors = [];

        // Email
        if (!data.email || data.email.trim().length === 0) {
            errors.push('Email is required');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                errors.push('Invalid email format');
            }
        }

        // Role
        const validRoles = ['manager', 'staff'];
        if (!data.role) {
            errors.push('Role is required');
        } else if (!validRoles.includes(data.role)) {
            errors.push('Invalid role. Must be: manager or staff');
        }

        // Password
        if (!data.password) {
            errors.push('Password is required');
        } else if (data.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate role update data
     * @param {Object} data - Role update data
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    static validateRoleUpdate(data) {
        const errors = [];

        const validRoles = ['manager', 'staff'];
        if (!data.role) {
            errors.push('Role is required');
        } else if (!validRoles.includes(data.role)) {
            errors.push('Invalid role. Must be: manager or staff');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export default BranchUserValidators;
