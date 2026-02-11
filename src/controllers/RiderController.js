import RiderService from '../services/RiderService.js';

class RiderController {
    // --- UTD ROUTES (Rider Self-Service) ---
    async getOwnProfile(req, res, next) {
        try {
            const profile = await RiderService.getProfile(req.user.userId);
            res.json(profile);
        } catch (err) { next(err); }
    }

    async updateOwnProfile(req, res, next) {
        try {
            const profile = await RiderService.updateProfile(req.user.userId, req.body, false);
            res.json(profile);
        } catch (err) { next(err); }
    }

    async updateStatus(req, res, next) {
        try {
            const { status } = req.body;
            const profile = await RiderService.updateStatus(req.user.userId, status);
            res.json(profile);
        } catch (err) { next(err); }
    }

    async updateLocation(req, res, next) {
        try {
            const { latitude, longitude } = req.body;
            const profile = await RiderService.updateLocation(req.user.userId, latitude, longitude);
            res.json(profile);
        } catch (err) { next(err); }
    }

    // --- UTB ROUTES (Business Lookup) ---
    async getRiderForBusiness(req, res, next) {
        try {
            const { riderId } = req.params;
            const { branchId, orderId } = req.query;

            const requester = {
                userId: req.user.userId,
                branchId,
                purpose: `pickup_coordination:${orderId || 'unknown'}`
            };

            const profile = await RiderService.getProfile(riderId, requester);

            // Privacy: Limited view for Businesses
            res.json({
                name: profile.name,
                phone: profile.phone,
                vehicle_type: profile.vehicle_type,
                vehicle_number: profile.vehicle_number,
                work_status: profile.work_status
            });
        } catch (err) { next(err); }
    }

    // --- UTA ROUTES (Admin Master Control) ---
    async listRiders(req, res, next) {
        try {
            const riders = await RiderService.getAllRiders(req.query);
            res.json(riders);
        } catch (err) { next(err); }
    }

    async updateRiderAdmin(req, res, next) {
        try {
            const { id } = req.params;
            const profile = await RiderService.updateProfile(id, req.body, true);
            res.json(profile);
        } catch (err) { next(err); }
    }

    async verifyRider(req, res, next) {
        try {
            const { id } = req.params;
            const { kyc_status, remarks } = req.body;
            const profile = await RiderService.verifyRider(id, kyc_status, remarks, req.user.userId);
            res.json(profile);
        } catch (err) { next(err); }
    }

    async getAccessLogs(req, res, next) {
        try {
            const { id } = req.params;
            const logs = await RiderService.getAccessLogs(id);
            res.json(logs);
        } catch (err) { next(err); }
    }
}

export default new RiderController();
