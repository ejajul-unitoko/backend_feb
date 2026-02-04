import Joi from 'joi';

const scopeSchema = Joi.string().valid('uta', 'utb', 'utc', 'utd').required();
const emailSchema = Joi.string().email().required();
const otpSchema = Joi.string().length(6).required();
const passwordSchema = Joi.string().min(8).required(); // Can enforce complexity here

export const registerSchema = Joi.object({
    email: emailSchema
});

export const otpVerifySchema = Joi.object({
    email: emailSchema,
    otp: otpSchema
});

export const loginSchema = Joi.object({
    email: emailSchema,
    password: passwordSchema // Password optional if OTP login? Handled in controller logic, but basic schema here.
});

export const setPasswordSchema = Joi.object({
    password: passwordSchema
});

export const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Passwords do not match'
    })
});

export const forgotPasswordSchema = Joi.object({
    email: emailSchema
});

export const resetPasswordSchema = Joi.object({
    email: emailSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

export const adminRequestSchema = Joi.object({
    email: emailSchema
});

export const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional(),
    avatar_url: Joi.string().uri().optional()
}).min(1);

export const validate = (schema) => (req, res, next) => {
    // If schema expects body, validate body. If separate args needed, custom logic.
    // Simplifying: Validate req.body against schema.
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

export const validateHeader = (req, res, next) => {
    if (!req.headers['x-app-type'] || !['uta', 'utb', 'utc', 'utd'].includes(req.headers['x-app-type'])) {
        return res.status(400).json({ error: 'Invalid or missing x-app-type header' });
    }
    next();
};
