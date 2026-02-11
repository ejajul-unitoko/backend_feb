import UserRepository from '../repositories/UserRepository.js';
import CustomerProfileRepository from '../repositories/CustomerProfileRepository.js';
import AccessLogRepository from '../repositories/AccessLogRepository.js';
import RbacRepository from '../repositories/RbacRepository.js';

class CustomerService {
    /**
     * Get customer profile with core user details
     */
    async getProfile(userId, requester = null) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('Customer not found');

        // Log access if requested by someone else (UTB/UTA)
        if (requester && requester.userId !== userId) {
            await AccessLogRepository.create({
                accessed_by_user_id: requester.userId,
                customer_user_id: userId,
                branch_id: requester.branchId || null,
                purpose: requester.purpose || 'profile_view'
            });
        }

        const profile = await CustomerProfileRepository.findByUserId(userId);

        // Flatten the data for easier consumption
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status,
            scope: user.scope,
            avatar_url: user.avatar_url,
            is_temporary: user.is_temporary,
            ...profile
        };
    }

    /**
     * Update customer profile - combines User and Profile updates
     */
    async updateProfile(userId, data) {
        const { name, avatar_url, ...profileData } = data;

        // Update core user fields
        const userUpdate = {};
        if (name) userUpdate.name = name;
        if (avatar_url) userUpdate.avatar_url = avatar_url;

        if (Object.keys(userUpdate).length > 0) {
            await UserRepository.update(userId, userUpdate);
        }

        // Update or create extended profile
        let profile = await CustomerProfileRepository.findByUserId(userId);
        if (profile) {
            profile = await CustomerProfileRepository.update(userId, profileData);
        } else {
            profile = await CustomerProfileRepository.create({
                user_id: userId,
                ...profileData
            });
        }

        return this.getProfile(userId);
    }

    /**
     * Admin: List all customers
     */
    async getAllCustomers(filters = {}) {
        const users = await UserRepository.findAll({ ...filters, scope: 'utc' });

        // Enrich with profile data
        return await Promise.all(users.map(async (u) => {
            const profile = await CustomerProfileRepository.findByUserId(u.id);
            return { ...u, ...profile };
        }));
    }

    /**
     * Admin: Get access logs for a customer
     */
    async getAccessLogs(customerId) {
        return await AccessLogRepository.findByCustomerId(customerId);
    }
}

export default new CustomerService();
