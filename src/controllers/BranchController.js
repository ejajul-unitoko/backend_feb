import BranchService from '../services/BranchService.js';

class BranchController {
    /**
     * GET /utb/branches - Get my branches
     */
    async getMyBranches(req, res, next) {
        try {
            const userId = req.user.userId;
            const branches = await BranchService.getMyBranches(userId);

            res.json({
                success: true,
                count: branches.length,
                data: branches
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /utb/branches/:id - Get branch by ID
     */
    async getBranchById(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchId = req.params.id;

            const branch = await BranchService.getBranchById(branchId, userId);

            res.json({
                success: true,
                data: branch
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /uta/businesses/:businessId/branches - Get branches of a business (Admin)
     */
    async getBranchesByBusinessId(req, res, next) {
        try {
            const businessId = req.params.businessId;
            const branches = await BranchService.getBranchesByBusinessId(businessId);

            res.json({
                success: true,
                count: branches.length,
                data: branches
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /utb/branches - Create new branch
     */
    async createBranch(req, res, next) {
        try {
            const userId = req.user.userId;
            const { business_id, ...branchData } = req.body;

            if (!business_id) {
                return res.status(400).json({
                    success: false,
                    message: 'business_id is required'
                });
            }

            const branch = await BranchService.createBranch(business_id, branchData, userId);

            res.status(201).json({
                success: true,
                message: 'Branch created successfully',
                data: branch
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * PUT /utb/branches/:id - Update branch
     */
    async updateBranch(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchId = req.params.id;

            const branch = await BranchService.updateBranch(branchId, req.body, userId);

            res.json({
                success: true,
                message: 'Branch updated successfully',
                data: branch
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /utb/branches/:id - Delete branch
     */
    async deleteBranch(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchId = req.params.id;

            const branch = await BranchService.deleteBranch(branchId, userId);

            res.json({
                success: true,
                message: 'Branch deleted successfully',
                data: branch
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * PATCH /utb/branches/:id/toggle-status - Toggle branch status
     */
    async toggleBranchStatus(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchId = req.params.id;

            const branch = await BranchService.toggleBranchStatus(branchId, userId);

            res.json({
                success: true,
                message: `Branch ${branch.status === 'active' ? 'activated' : 'deactivated'} successfully`,
                data: branch
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new BranchController();
