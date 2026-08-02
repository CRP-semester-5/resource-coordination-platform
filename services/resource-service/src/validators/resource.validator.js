import Joi from "joi";

export const createResourceSchema = Joi.object({
    organization_id: Joi.string()
        .uuid()
        .required(),

    resource_name: Joi.string()
        .min(2)
        .max(200)
        .required(),

    category: Joi.string()
        .min(2)
        .max(100)
        .required(),

    quantity_available: Joi.number()
        .integer()
        .min(0)
        .default(0),

    quantity_reserved: Joi.number()
        .integer()
        .min(0)
        .default(0),

    unit: Joi.string()
        .max(50)
        .required(),

    location: Joi.string()
        .max(255)
        .optional()
        .allow("", null),

    reorder_level: Joi.number()
        .integer()
        .min(0)
        .default(0)
});

export const updateResourceSchema = Joi.object({
    organization_id: Joi.string()
        .uuid()
        .optional(),

    resource_name: Joi.string()
        .min(2)
        .max(200)
        .optional(),

    category: Joi.string()
        .min(2)
        .max(100)
        .optional(),

    quantity_available: Joi.number()
        .integer()
        .min(0)
        .optional(),

    quantity_reserved: Joi.number()
        .integer()
        .min(0)
        .optional(),

    unit: Joi.string()
        .max(50)
        .optional(),

    location: Joi.string()
        .max(255)
        .optional()
        .allow("", null),

    reorder_level: Joi.number()
        .integer()
        .min(0)
        .optional()
}).min(1);