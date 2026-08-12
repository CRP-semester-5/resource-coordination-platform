import Joi from "joi";

export const createDonationSchema = Joi.object({
    organization_id: Joi.string()
        .uuid()
        .optional(),

    donor_id: Joi.string()
        .uuid()
        .optional(),

    resource_id: Joi.string()
        .uuid()
        .optional()
        .allow(null),

    resource_name: Joi.string()
        .max(200)
        .required(),

    category: Joi.string()
        .max(100)
        .optional(),

    quantity: Joi.number()
        .integer()
        .min(1)
        .required(),

    unit: Joi.string()
        .max(50)
        .required(),

    delivery_method: Joi.string()
        .valid(
            "DONOR_DELIVERY",
            "ORGANIZATION_PICKUP",
            "VOLUNTEER_PICKUP"
        )
        .required(),

    pickup_address: Joi.string()
        .optional()
        .allow(""),

    donation_notes: Joi.string()
        .optional()
        .allow(""),

    item_condition: Joi.string()
        .optional()
        .allow(null)
        .allow(""),

    expiry_date: Joi.string()
        .optional()
        .allow(null)
        .allow("")
});

export const updateDonationSchema = Joi.object({
    resource_name: Joi.string()
        .max(200)
        .optional(),

    category: Joi.string()
        .max(100)
        .optional(),

    quantity: Joi.number()
        .integer()
        .min(1)
        .optional(),

    unit: Joi.string()
        .max(50)
        .optional(),

    delivery_method: Joi.string()
        .valid(
            "DONOR_DELIVERY",
            "ORGANIZATION_PICKUP",
            "VOLUNTEER_PICKUP"
        )
        .optional(),

    pickup_address: Joi.string()
        .optional()
        .allow(""),

    donation_notes: Joi.string()
        .optional()
        .allow(""),

    item_condition: Joi.string()
        .optional()
        .allow(null)
        .allow(""),

    expiry_date: Joi.string()
        .optional()
        .allow(null)
        .allow("")
}).min(1);
