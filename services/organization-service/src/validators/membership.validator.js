import Joi from "joi";

const roles = [
    "SUPER_ADMIN",
    "ORGANIZATION_ADMIN",
    "COORDINATOR",
    "COMMUNITY_MEMBER",
    "DONOR",
    "VOLUNTEER",
];

const statuses = [
    "PENDING",
    "ACTIVE",
    "INACTIVE",
];

// Create Membership
export const createMembershipSchema = Joi.object({
    user_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid": "User ID must be a valid UUID.",
            "any.required": "User ID is required.",
        }),

    role: Joi.string()
        .valid(...roles)
        .required()
        .messages({
            "any.only": `Role must be one of: ${roles.join(", ")}.`,
            "any.required": "Role is required.",
        }),
});

// Update Membership
export const updateMembershipSchema = Joi.object({
    role: Joi.string()
        .valid(...roles)
        .messages({
            "any.only": `Role must be one of: ${roles.join(", ")}.`,
        }),

    status: Joi.string()
        .valid(...statuses)
        .messages({
            "any.only": `Status must be one of: ${statuses.join(", ")}.`,
        }),
}).min(1).messages({
    "object.min": "At least one field must be provided for update.",
});

// Validate Route Parameters
export const membershipParamsSchema = Joi.object({
    organizationId: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid": "Organization ID must be a valid UUID.",
            "any.required": "Organization ID is required.",
        }),

    membershipId: Joi.string()
        .uuid()
        .optional()
        .messages({
            "string.guid": "Membership ID must be a valid UUID.",
        }),
});