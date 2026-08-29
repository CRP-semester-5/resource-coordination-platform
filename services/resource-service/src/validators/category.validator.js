import Joi from "joi";

export const createCategorySchema = Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().allow(null, ""),
    unit_of_measure: Joi.string().max(50).required()
});

export const updateCategorySchema = Joi.object({
    name: Joi.string().max(100),
    description: Joi.string().allow(null, ""),
    unit_of_measure: Joi.string().max(50)
});
