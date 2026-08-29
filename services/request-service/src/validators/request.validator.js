import Joi from "joi";

export const createRequestSchema = Joi.object({
    organization_id: Joi.string()
        .uuid()
        .allow(null, "")
        .optional(),

    requester_id: Joi.string()
        .uuid()
        .allow(null, "")
        .optional(),

    title: Joi.string()
        .min(3)
        .max(200)
        .required(),

    description: Joi.string()
        .allow("", null)
        .optional()
        .default("No description provided"),

    category: Joi.string()
        .max(100)
        .required(),

    location: Joi.string()
        .max(255)
        .allow(null, "")
        .optional()
        .default("Location not specified"),

    latitude: Joi.number()
        .allow(null)
        .optional(),

    longitude: Joi.number()
        .allow(null)
        .optional(),

    affected_people: Joi.number()
        .integer()
        .min(0)
        .allow(null)
        .optional(),

    urgency: Joi.string()
        .valid(
            "LOW",
            "MEDIUM",
            "HIGH",
            "CRITICAL"
        )
        .default("MEDIUM"),

    quantity_required: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .required(),

    unit: Joi.string()
        .max(50)
        .default("units")
        .required(),

    contact_name: Joi.string()
        .allow(null, "")
        .optional(),

    contact_mobile: Joi.string()
        .allow(null, "")
        .optional(),

    contact_email: Joi.string()
        .allow(null, "")
        .optional(),

    is_personal: Joi.boolean()
        .optional()
});

export const updateRequestSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(200),

    description: Joi.string()
        .allow("", null),

    category: Joi.string()
        .max(100),

    location: Joi.string()
        .max(255),

    latitude: Joi.number()
        .allow(null),

    longitude: Joi.number()
        .allow(null),

    affected_people: Joi.number()
        .integer()
        .min(0)
        .allow(null),

    urgency: Joi.string()
        .valid(
            "LOW",
            "MEDIUM",
            "HIGH",
            "CRITICAL"
        ),

    quantity_required: Joi.number()
        .integer()
        .min(1),

    unit: Joi.string()
        .max(50)
}).min(1);
