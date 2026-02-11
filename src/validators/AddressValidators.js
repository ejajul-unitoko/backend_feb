class AddressValidators {
    static validate(data) {
        const errors = [];

        // Address Line 1
        if (!data.address_line_1 || data.address_line_1.trim().length === 0) {
            errors.push('Address Line 1 is required');
        } else if (data.address_line_1.trim().length < 5) {
            errors.push('Address Line 1 must be at least 5 characters');
        }

        // City
        if (!data.city || data.city.trim().length === 0) {
            errors.push('City is required');
        }

        // State
        if (!data.state || data.state.trim().length === 0) {
            errors.push('State is required');
        }

        // Pincode (Indian format: 6 digits)
        if (!data.pincode) {
            errors.push('Pincode is required');
        } else {
            const pincodeRegex = /^[1-9][0-9]{5}$/;
            if (!pincodeRegex.test(data.pincode.toString())) {
                errors.push('Invalid Pincode. Must be 6 digits.');
            }
        }

        // Coordinates (Optional but must be valid if present)
        if (data.latitude !== undefined && data.latitude !== null) {
            const lat = parseFloat(data.latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                errors.push('Invalid latitude. Must be between -90 and 90');
            }
        }

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
}

export default AddressValidators;
