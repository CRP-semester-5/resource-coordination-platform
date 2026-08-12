import Joi from "joi";

export const createOrganizationSchema = Joi.object({
    organization_name: Joi.string()
        .trim()
        .min(3)
        .max(200)
        .required()
        .messages({
            "string.empty": "Organization name is required.",
            "string.min": "Organization name must be at least 3 characters.",
            "any.required": "Organization name is required."
        }),

    description: Joi.string()
        .allow("")
        .max(1000),

    email: Joi.string()
        .email()
        .allow("")
        .messages({
            "string.email": "Please provide a valid email address."
        }),

    phone: Joi.string()
        .pattern(/^[0-9+\-\s()]{7,20}$/)
        .allow("")
        .messages({
            "string.pattern.base": "Please provide a valid phone number."
        }),

    address: Joi.string()
        .allow("")
        .max(500)
});
