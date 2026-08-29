import Joi from 'joi'

/**
 * POST /api/v1/auth/register
 * { first_name, last_name, email, password }
 */
export const registerSchema = Joi.object({
    first_name: Joi.string().trim().min(1).max(100).required().messages({
        'string.empty': 'first_name is required',
        'string.max': 'first_name must be at most 100 characters',
        'any.required': 'first_name is required',
    }),
    last_name: Joi.string().trim().min(1).max(100).required().messages({
        'string.empty': 'last_name is required',
        'string.max': 'last_name must be at most 100 characters',
        'any.required': 'last_name is required',
    }),
    email: Joi.string().trim().email().max(255).required().messages({
        'string.email': 'email must be a valid email address',
        'string.empty': 'email is required',
        'any.required': 'email is required',
    }),
    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/[A-Z]/, 'uppercase letter')
        .pattern(/[0-9]/, 'number')
        .required()
        .messages({
            'string.min': 'password must be at least 8 characters',
            'string.pattern.name': 'password must contain at least one {#name}',
            'any.required': 'password is required',
        }),
})

/**
 * POST /api/v1/auth/login
 * { email, password }
 */
export const loginSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        'string.email': 'email must be a valid email address',
        'any.required': 'email is required',
    }),
    password: Joi.string().required().messages({
        'any.required': 'password is required',
    }),
})

/**
 * POST /api/v1/auth/verify-email
 * { token }
 */
export const verifyEmailSchema = Joi.object({
    token: Joi.string().hex().length(64).required().messages({
        'string.hex': 'token must be a valid hex string',
        'string.length': 'token must be 64 characters',
        'any.required': 'token is required',
    }),
})

/**
 * POST /api/v1/auth/forgot-password
 * { email }
 */
export const forgotPasswordSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        'string.email': 'email must be a valid email address',
        'any.required': 'email is required',
    }),
})

/**
 * POST /api/v1/auth/reset-password
 * { token, password }
 */
export const resetPasswordSchema = Joi.object({
    token: Joi.string().hex().length(64).required().messages({
        'string.hex': 'token must be a valid hex string',
        'string.length': 'token must be 64 characters',
        'any.required': 'token is required',
    }),
    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/[A-Z]/, 'uppercase letter')
        .pattern(/[0-9]/, 'number')
        .required()
        .messages({
            'string.min': 'password must be at least 8 characters',
            'string.pattern.name': 'password must contain at least one {#name}',
            'any.required': 'password is required',
        }),
})
