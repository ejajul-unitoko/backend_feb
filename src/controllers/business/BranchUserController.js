import BranchUserService from '../../services/business/BranchUserService.js';

class BranchUserController {
    /**
     * GET /utb/branches/:branchId/users - Get users assigned to branch
     */
    async getBranchUsers(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchId = req.params.branchId;

            const users = await BranchUserService.getBranchUsers(branchId, userId);

            res.json({
                success: true,
                count: users.length,
                data: users
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /utb/branches/:branchId/users - Assign user to branch
     * Edge Case 3: Creates user if email doesn't exist
     */
    async assignUser(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchId = req.params.branchId;

            const branchUser = await BranchUserService.assignUser(branchId, req.body, userId);

            res.status(201).json({
                success: true,
                message: 'User assigned to branch successfully',
                data: branchUser
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * PUT /utb/branch-users/:id/role - Update user role
     */
    async updateUserRole(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchUserId = req.params.id;
            const { role } = req.body;

            if (!role) {
                return res.status(400).json({
                    success: false,
                    message: 'role is required'
                });
            }

            const branchUser = await BranchUserService.updateUserRole(branchUserId, role, userId);

            res.json({
                success: true,
                message: 'User role updated successfully',
                data: branchUser
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * PATCH /utb/branch-users/:id/revoke - Revoke user access
     */
    async revokeUser(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchUserId = req.params.id;

            const branchUser = await BranchUserService.revokeUser(branchUserId, userId);

            res.json({
                success: true,
                message: 'User access revoked successfully',
                data: branchUser
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /utb/branch-users/:id - Delete user assignment
     */
    async deleteUser(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchUserId = req.params.id;

            const branchUser = await BranchUserService.deleteUser(branchUserId, userId);

            res.json({
                success: true,
                message: 'User assignment deleted successfully',
                data: branchUser
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new BranchUserController();
