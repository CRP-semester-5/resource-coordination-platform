import Joi from 'joi';

export const createTaskSchema = Joi.object({
  request_id: Joi.string().uuid().optional().allow(null, ''),
  title: Joi.string().max(255).required(),
  description: Joi.string().optional().allow(null, ''),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional().default('MEDIUM'),
  required_skill: Joi.string().max(100).optional().allow(null, ''),
  task_type: Joi.string().valid('INDIVIDUAL', 'TEAM').optional().default('INDIVIDUAL'),
  volunteers_required: Joi.number().integer().min(1).optional().default(1),
  location: Joi.string().max(255).optional().allow(null, ''),
  latitude: Joi.number().min(-90).max(90).optional().allow(null),
  longitude: Joi.number().min(-180).max(180).optional().allow(null),
  start_date: Joi.date().iso().optional().allow(null),
  due_date: Joi.date().iso().optional().allow(null),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional().allow(null, ''),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
  required_skill: Joi.string().max(100).optional().allow(null, ''),
  task_type: Joi.string().valid('INDIVIDUAL', 'TEAM').optional(),
  volunteers_required: Joi.number().integer().min(1).optional(),
  location: Joi.string().max(255).optional().allow(null, ''),
  latitude: Joi.number().min(-90).max(90).optional().allow(null),
  longitude: Joi.number().min(-180).max(180).optional().allow(null),
  start_date: Joi.date().iso().optional().allow(null),
  due_date: Joi.date().iso().optional().allow(null),
}).min(1);

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'UNASSIGNED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').required(),
});

export const assignVolunteerSchema = Joi.object({
  volunteer_id: Joi.string().uuid().required(),
});

export const assignmentResponseSchema = Joi.object({
  assignment_status: Joi.string().valid('PENDING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').required(),
});

export const progressSchema = Joi.object({
  progress_percent: Joi.number().integer().min(0).max(100).required(),
  remarks: Joi.string().optional().allow(null, ''),
  status: Joi.string().optional(),
});
