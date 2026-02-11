import pool from '../config/database.js';
import AddressRepository from '../repositories/AddressRepository.js';
import AddressValidators from '../validators/AddressValidators.js';

class AddressService {
    // =========================================================================
    // Core / Common Methods (Internal Use or Generic)
    // =========================================================================

    /**
     * Create a new address (Generic)
     * Used by Business/Branch creation flows internally
     */
    async create(data) {
        return await AddressRepository.create(data);
    }

    /**
     * Get address by ID (Generic)
     */
    async findById(id) {
        const address = await AddressRepository.findById(id);
        if (!address) {
            throw new Error('Address not found');
        }
        return address;
    }

    /**
     * Update address (Generic)
     */
    async update(id, data) {
        const updated = await AddressRepository.update(id, data);
        if (!updated) {
            throw new Error('Failed to update address');
        }
        return updated;
    }

    /**
     * Delete address (Generic/Soft Delete)
     */
    async delete(id) {
        const deleted = await AddressRepository.delete(id);
        if (!deleted) {
            throw new Error('Failed to delete address');
        }
        return deleted;
    }

    // =========================================================================
    // Customer Methods (Secure, User-Scoped)
    // =========================================================================

    async getCustomerAddresses(userId) {
        return await AddressRepository.findByUserAndPurpose(userId, 'customer_delivery');
    }

    async addCustomerAddress(userId, data) {
        const validation = AddressValidators.validate(data);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        const existingAddresses = await this.getCustomerAddresses(userId);
        const isDefault = existingAddresses.length === 0 || data.is_default === true;

        if (isDefault && existingAddresses.length > 0) {
            await AddressRepository.unsetDefault(userId, 'customer_delivery');
        }

        return await AddressRepository.create({
            ...data,
            user_id: userId,
            purpose: 'customer_delivery',
            is_default: isDefault
        });
    }

    async updateCustomerAddress(userId, addressId, data) {
        const address = await AddressRepository.findById(addressId);
        if (!address || address.user_id !== userId) {
            throw new Error('Address not found or access denied');
        }

        if (data.is_default === true) {
            await AddressRepository.unsetDefault(userId, 'customer_delivery');
        }

        const validData = {};
        const allowedFields = ['address_line_1', 'address_line_2', 'landmark', 'city', 'state', 'pincode', 'latitude', 'longitude', 'is_default'];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) validData[field] = data[field];
        });

        return await AddressRepository.update(addressId, validData);
    }

    async deleteCustomerAddress(userId, addressId) {
        const address = await AddressRepository.findById(addressId);
        if (!address || address.user_id !== userId) {
            throw new Error('Address not found or access denied');
        }

        return await AddressRepository.delete(addressId);
    }

    async setCustomerDefaultAddress(userId, addressId) {
        const address = await AddressRepository.findById(addressId);
        if (!address || address.user_id !== userId) {
            throw new Error('Address not found or access denied');
        }

        await AddressRepository.unsetDefault(userId, 'customer_delivery');
        return await AddressRepository.update(addressId, { is_default: true });
    }

    // =========================================================================
    // Rider Methods (Secure, User-Scoped)
    // =========================================================================

    async getRiderAddresses(userId) {
        return await AddressRepository.findByUserAndPurpose(userId, 'rider_home');
    }

    async addRiderAddress(userId, data) {
        const validation = AddressValidators.validate(data);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        return await AddressRepository.create({
            ...data,
            user_id: userId,
            purpose: 'rider_home'
        });
    }

    async updateRiderAddress(userId, addressId, data) {
        const address = await AddressRepository.findById(addressId);
        if (!address || address.user_id !== userId) {
            throw new Error('Address not found or access denied');
        }

        const validData = {};
        const allowedFields = ['address_line_1', 'address_line_2', 'landmark', 'city', 'state', 'pincode', 'latitude', 'longitude'];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) validData[field] = data[field];
        });

        return await AddressRepository.update(addressId, validData);
    }

    async deleteRiderAddress(userId, addressId) {
        const address = await AddressRepository.findById(addressId);
        if (!address || address.user_id !== userId) {
            throw new Error('Address not found or access denied');
        }

        return await AddressRepository.delete(addressId);
    }

    // =========================================================================
    // Admin Methods (Global Access, Enrichment)
    // =========================================================================

    async getAllAddresses(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (query.city) {
            conditions.push(`a.city ILIKE $${paramIndex++}`);
            params.push(`%${query.city}%`);
        }

        if (query.purpose) {
            conditions.push(`a.purpose = $${paramIndex++}`);
            params.push(query.purpose);
        }

        if (query.user_id) {
            conditions.push(`a.user_id = $${paramIndex++}`);
            params.push(query.user_id);
        }

        conditions.push(`a.deleted_at IS NULL`);
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT 
                a.*,
                u.name as creator_name,
                u.email as creator_email,
                u.phone as creator_phone
            FROM addresses a
            LEFT JOIN users u ON a.user_id = u.id
            ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(limit, offset);

        const result = await pool.query(sql, params);

        const countSql = `SELECT COUNT(*) FROM addresses a ${whereClause}`;
        const countParams = params.slice(0, params.length - 2);
        const countResult = await pool.query(countSql, countParams);
        const total = parseInt(countResult.rows[0].count);

        const enrichedData = result.rows.map(row => {
            let app_type = 'UNKNOWN';
            switch (row.purpose) {
                case 'business_registered':
                case 'branch_location':
                    app_type = 'UTB (Business)';
                    break;
                case 'customer_delivery':
                    app_type = 'UTC (Customer)';
                    break;
                case 'rider_home':
                    app_type = 'UTD (Delivery)';
                    break;
                case 'warehouse':
                    app_type = 'Admin/Ops';
                    break;
            }

            return {
                ...row,
                app_type,
                creator_details: {
                    id: row.user_id,
                    name: row.creator_name,
                    email: row.creator_email,
                    phone: row.creator_phone
                }
            };
        });

        return {
            data: enrichedData,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async createAddress(data, userId) {
        // Admin generic create
        return await AddressRepository.create({
            ...data,
            user_id: data.user_id || userId // Fallback to creator if not specified
        });
    }
}

export default new AddressService();
