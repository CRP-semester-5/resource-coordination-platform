import Joi from "joi";


export const createRequestSchema = Joi.object({

    organization_id: Joi.string()
        .uuid()
        .required(),

    title: Joi.string()
        .min(3)
        .max(200)
        .required(),

    description: Joi.string()
        .min(5)
        .required(),

    location: Joi.string()
        .max(255)
        .required(),

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
        .required(),

    unit: Joi.string()
        .max(50)
        .required()

});


export const updateRequestSchema = Joi.object({

    title: Joi.string()
        .min(3)
        .max(200),

    description: Joi.string()
        .min(5),

    location: Joi.string()
        .max(255),

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