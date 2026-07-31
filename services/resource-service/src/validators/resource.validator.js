import Joi from "joi";
export const createResourceSchema = Joi.object({

    organization_id:
        Joi.string()
        .uuid()
        .required(),

    resource_name:
        Joi.string()
        .max(200)
        .required(),

    category:
        Joi.string()
        .max(100)
        .required(),

    quantity_available:
        Joi.number()
        .integer()
        .min(0)
        .default(0),

    quantity_reserved:
        Joi.number()
        .integer()
        .min(0)
        .default(0),

    unit:
        Joi.string()
        .max(50)
        .required(),

    location:
        Joi.string()
        .max(255)
        .optional(),

    reorder_level:
        Joi.number()
        .integer()
        .min(0)
        .default(0)
});