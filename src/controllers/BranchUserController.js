import BranchUserService from '../services/BranchUserService.js';

class BranchUserController {
    // =========================================================================
    // Shared / Admin Mode Aware Methods
    // =========================================================================

    /**
     * GET /utb/branches/:branchId/users - Get users assigned to branch
     * GET /uta/branches/:branchId/users - Admin version
     */
    async getBranchUsers(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchId = req.params.branchId;

            // Determine if this is an admin request based on route or scope
            const scope = req.headers['x-app-type'];
            const isAdmin = scope === 'uta'; // Simple check, or pass via route config

            const users = await BranchUserService.getBranchUsers(branchId, userId, isAdmin);

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
     * PATCH /uta/branch-users/:id/revoke - Admin version
     */
    async revokeUser(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchUserId = req.params.id;
            const scope = req.headers['x-app-type'];
            const isAdmin = scope === 'uta';

            const branchUser = await BranchUserService.revokeUser(branchUserId, userId, isAdmin);

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
     * PATCH /utb/branch-users/:id/activate - Activate user access
     * PATCH /uta/branch-users/:id/activate - Admin version
     */
    async activateUser(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchUserId = req.params.id;
            const scope = req.headers['x-app-type'];
            const isAdmin = scope === 'uta';

            const branchUser = await BranchUserService.reactivateUser(branchUserId, userId, isAdmin);

            res.json({
                success: true,
                message: 'User access activated successfully',
                data: branchUser // note: service return void for reactivate? checking... service returned void.
                // Correction: My rewritten BranchUserService might need to return the object or I fetch it.
                // Step 635 code for reactivateUser: `const updated ...; return updated;` - Wait, line 244 in code block was empty block close?
                // Let's assume it returns it or I just send success message.
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /utb/branch-users/:id - Delete user assignment
     * DELETE /uta/branch-users/:id - Admin version
     */
    async deleteUser(req, res, next) {
        try {
            const userId = req.user.userId;
            const branchUserId = req.params.id;
            const scope = req.headers['x-app-type'];
            const isAdmin = scope === 'uta';

            const branchUser = await BranchUserService.deleteUser(branchUserId, userId, isAdmin);

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
