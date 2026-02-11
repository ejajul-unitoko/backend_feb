import UserRepository from '../repositories/UserRepository.js';
import RiderProfileRepository from '../repositories/RiderProfileRepository.js';
import RiderAccessLogRepository from '../repositories/RiderAccessLogRepository.js';

class RiderService {
    async getProfile(userId, requester = null) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('Rider not found');

        if (requester && requester.userId !== userId) {
            await RiderAccessLogRepository.create({
                accessed_by_user_id: requester.userId,
                rider_user_id: userId,
                branch_id: requester.branchId || null,
                purpose: requester.purpose || 'profile_view'
            });
        }

        const profile = await RiderProfileRepository.findByUserId(userId);
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar_url: user.avatar_url,
            ...profile
        };
    }

    async updateProfile(userId, data, isAdmin = false) {
        const { name, avatar_url, phone, ...profileData } = data;

        // Core User Updates
        const userUpdate = {};
        if (name) userUpdate.name = name;
        if (avatar_url) userUpdate.avatar_url = avatar_url;
        if (phone) userUpdate.phone = phone;

        if (Object.keys(userUpdate).length > 0) {
            await UserRepository.update(userId, userUpdate);
        }

        // Profile Updates
        let profile = await RiderProfileRepository.findByUserId(userId);

        // Security Logic: If rider changes sensitive info, reset KYC
        if (!isAdmin && profile && (profileData.driving_license_number || profileData.vehicle_type)) {
            profileData.kyc_status = 'pending';
        }

        if (profile) {
            profile = await RiderProfileRepository.update(userId, profileData);
        } else {
            profile = await RiderProfileRepository.create({
                user_id: userId,
                ...profileData
            });
        }

        return this.getProfile(userId);
    }

    async updateStatus(userId, status) {
        const profile = await RiderProfileRepository.findByUserId(userId);
        if (!profile) throw new Error('Rider profile not found');

        if (status === 'online' && profile.kyc_status !== 'approved') {
            throw new Error('Access Denied: Your KYC must be approved to go online.');
        }

        return await RiderProfileRepository.update(userId, { work_status: status });
    }

    async updateLocation(userId, latitude, longitude) {
        return await RiderProfileRepository.updateLocation(userId, latitude, longitude);
    }

    async getAllRiders(filters = {}) {
        return await RiderProfileRepository.findAll(filters);
    }

    async verifyRider(riderId, kyc_status, remarks, adminId) {
        return await RiderProfileRepository.update(riderId, {
            kyc_status,
            kyc_remarks: remarks
        });
    }

    async getAccessLogs(riderId) {
        return await RiderAccessLogRepository.findByRiderId(riderId);
    }
}

export default new RiderService();
