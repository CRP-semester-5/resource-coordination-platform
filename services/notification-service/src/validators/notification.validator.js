import Joi from 'joi'

export const createNotificationSchema = Joi.object({
  organization_id: Joi.string().uuid().required(),
  user_id: Joi.string().uuid().required(),
  title: Joi.string().max(255).required(),
  message: Joi.string().required(),
  type: Joi.string().max(50).optional().default('GENERAL'),
  reference_type: Joi.string().max(50).optional(),
  reference_id: Joi.string().uuid().optional()
})
