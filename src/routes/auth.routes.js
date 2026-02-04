import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { 
    validate, 
    validateHeader,
    registerSchema, 
    otpVerifySchema, 
    loginSchema, 
    setPasswordSchema, 
    changePasswordSchema, 
    forgotPasswordSchema, 
    resetPasswordSchema,
    updateProfileSchema,
    adminRequestSchema
} from '../validators/AuthValidators.js';

const router = express.Router();

// Public / Common
router.post('/login', validateHeader, validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh); // Helper validation usually just token
router.post('/logout', AuthController.logout);

// OTP Registration (Public Apps)
router.post('/otp/send', validateHeader, validate(registerSchema), AuthController.otpSend);
router.post('/otp/verify', validateHeader, validate(otpVerifySchema), AuthController.otpVerify);

// Profile & Password Management
router.put('/profile', authenticate, validateHeader, validate(updateProfileSchema), AuthController.updateProfile);
router.post('/password/set', authenticate, validateHeader, validate(setPasswordSchema), AuthController.setPassword);
router.post('/password/change', authenticate, validateHeader, validate(changePasswordSchema), AuthController.changePassword);
router.get('/me', authenticate, AuthController.me);

// Password Reset (Public)
router.post('/password/forgot', validateHeader, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/password/reset', validateHeader, validate(resetPasswordSchema), AuthController.resetPassword);

// Admin Workflow (UTA)
router.post('/admin/request', validate(adminRequestSchema), AuthController.adminRequest); // Header check inside controller logic for 'uta' enforcement or add generic here?
// Admin flows are specific. Let's add validateHeader to ensure scope is passed if needed, 
// but adminRequest usually implies scope=uta internally or passed? 
// Controller checks header. Let's add validateHeader for consistency if client sends it.
router.post('/admin/verify', validateHeader, validate(otpVerifySchema), AuthController.adminVerify);
router.post('/admin/requests/:requestId/approve', authenticate, requirePermission('users:manage'), AuthController.adminApprove); 
// Magic Link Route (GET for Email Click)
router.get('/admin/approve-magic', AuthController.adminApproveMagic);

// Media Routes
import MediaController from '../controllers/MediaController.js';
import { upload } from '../middleware/upload.middleware.js';

router.post('/media/upload/avatar', authenticate, upload.single('avatar'), MediaController.uploadAvatar);

export default router;
