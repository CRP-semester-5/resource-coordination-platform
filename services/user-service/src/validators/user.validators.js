import Joi from 'joi'

/**
 * PATCH /api/v1/users/me
 * All fields optional — at least one must be present.
 */
export const updateProfileSchema = Joi.object({
    first_name: Joi.string().trim().min(1).max(100).messages({
        'string.max': 'first_name must be at most 100 characters',
    }),
    last_name: Joi.string().trim().min(1).max(100).messages({
        'string.max': 'last_name must be at most 100 characters',
    }),
    phone: Joi.string()
        .trim()
        .pattern(/^\+?[0-9\s\-().]{7,30}$/)
        .allow(null, '')
        .messages({
            'string.pattern.base': 'phone must be a valid phone number',
        }),
    profile_image: Joi.string().uri().allow(null, '').messages({
        'string.uri': 'profile_image must be a valid URL',
    }),
})
    .min(1)
    .messages({
        'object.min': 'At least one field must be provided for update',
    })

/**
 * POST /api/v1/users/me/addresses
 */
export const addAddressSchema = Joi.object({
    address_type: Joi.string()
        .valid('HOME', 'WORK', 'OTHER')
        .default('HOME')
        .messages({
            'any.only': 'address_type must be HOME, WORK, or OTHER',
        }),
    address_line1: Joi.string().trim().min(1).max(255).required().messages({
        'string.empty': 'address_line1 is required',
        'any.required': 'address_line1 is required',
    }),
    address_line2: Joi.string().trim().max(255).allow(null, ''),
    city: Joi.string().trim().max(100).allow(null, ''),
    district: Joi.string().trim().max(100).allow(null, ''),
    province: Joi.string().trim().max(100).allow(null, ''),
    postal_code: Joi.string().trim().max(20).allow(null, ''),
    latitude: Joi.number().min(-90).max(90).allow(null),
    longitude: Joi.number().min(-180).max(180).allow(null),
    is_primary: Joi.boolean().default(false),
})
