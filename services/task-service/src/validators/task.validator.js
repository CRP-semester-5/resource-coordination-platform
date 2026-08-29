import Joi from 'joi'

export const createTaskSchema = Joi.object({
  request_id: Joi.string().uuid().required(),
  title: Joi.string().max(255).required(),
  description: Joi.string().optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional().default('MEDIUM'),
  location: Joi.string().max(255).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  start_date: Joi.date().iso().optional(),
  due_date: Joi.date().iso().optional(),
})

export const updateTaskSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
  location: Joi.string().max(255).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  start_date: Joi.date().iso().optional(),
  due_date: Joi.date().iso().optional(),
}).min(1)

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').required()
})

export const assignVolunteerSchema = Joi.object({
  volunteer_id: Joi.string().uuid().required()
})

export const assignmentResponseSchema = Joi.object({
  assignment_status: Joi.string().valid('ACCEPTED', 'REJECTED', 'COMPLETED').required()
})

export const progressSchema = Joi.object({
  progress_percent: Joi.number().integer().min(0).max(100).required(),
  remarks: Joi.string().optional()
})
