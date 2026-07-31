import Joi from 'joi'

export const createVolunteerSchema = Joi.object({
  experience_years: Joi.number().min(0).max(99.9).optional().default(0),
  availability_status: Joi.string().valid('AVAILABLE', 'BUSY', 'UNAVAILABLE').optional().default('UNAVAILABLE'),
})

export const updateVolunteerSchema = Joi.object({
  experience_years: Joi.number().min(0).max(99.9).optional(),
  availability_status: Joi.string().valid('AVAILABLE', 'BUSY', 'UNAVAILABLE').optional(),
})

export const addSkillSchema = Joi.object({
  skill_name: Joi.string().max(150).required(),
  proficiency_level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT').optional().default('BEGINNER'),
})

export const addAvailabilitySchema = Joi.object({
  available_date: Joi.date().iso().required(),
  start_time: Joi.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'start_time must be in HH:MM format',
  }),
  end_time: Joi.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'end_time must be in HH:MM format',
  }),
  status: Joi.string().valid('AVAILABLE', 'BUSY', 'UNAVAILABLE').optional().default('AVAILABLE'),
})

export const updateAvailabilitySchema = Joi.object({
  status: Joi.string().valid('AVAILABLE', 'BUSY', 'UNAVAILABLE').required(),
})

export const addCertificationSchema = Joi.object({
  certificate_name: Joi.string().max(255).required(),
  issuing_organization: Joi.string().max(255).optional(),
  issue_date: Joi.date().iso().optional(),
  expiry_date: Joi.date().iso().min(Joi.ref('issue_date')).optional().messages({
    'date.min': 'expiry_date must be on or after issue_date',
  }),
  certificate_url: Joi.string().uri().optional(),
})



export const updateCertificationSchema = Joi.object({
  certificate_name: Joi.string().max(255).optional(),
  issuing_organization: Joi.string().max(255).optional(),
  issue_date: Joi.date().iso().optional(),
  expiry_date: Joi.date().iso().optional(),
  certificate_url: Joi.string().uri().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
})

export const updateVerificationSchema = Joi.object({
  verification_status: Joi.string().valid('PENDING', 'VERIFIED', 'REJECTED').required(),
})

