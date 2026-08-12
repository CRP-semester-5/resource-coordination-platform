/**
 * validate.js — Generic Joi validation middleware factory.
 *
 * Usage:
 *   import { validate } from '../middlewares/validate.js'
 *   import { registerSchema } from '../validators/auth.validators.js'
 *
 *   router.post('/register', validate(registerSchema), registerHandler)
 *
 * On validation failure returns 400 with the first error message.
 * On success, replaces req.body with the validated (and sanitised) value.
 */
export function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: true,    // return first error only
            stripUnknown: true,  // remove fields not in schema
            convert: true,       // coerce types (e.g. trim strings)
        })

        if (error) {
            return res.status(400).json({
                message: error.details[0].message,
            })
        }

        // Replace body with the sanitised value (trimmed, converted)
        req.body = value
        next()
    }
}
