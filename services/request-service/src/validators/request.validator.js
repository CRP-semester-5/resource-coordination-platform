import Joi from "joi";


export const createRequestSchema = Joi.object({

    organization_id: Joi.string()
        .uuid()
        .required(),

    requester_id: Joi.string()
        .uuid()
        .required(),

    title: Joi.string()
        .min(3)
        .max(200)
        .required(),

    description: Joi.string()
        .min(5)
        .required(),

    category: Joi.string()
        .max(100)
        .required(),

    location: Joi.string()
        .max(255)
        .required(),

    latitude: Joi.number()
        .allow(null),

    longitude: Joi.number()
        .allow(null),

    affected_people: Joi.number()
        .integer()
        .allow(null),

    contact_name: Joi.string()
        .allow('', null),

    contact_mobile: Joi.string()
        .allow('', null),

    contact_email: Joi.string()
        .allow('', null),

    is_personal: Joi.boolean()
        .default(false),

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

}).unknown(true);


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
