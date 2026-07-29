import * as authService from '../services/auth.service.js'

/**
 * POST /auth/register
 * Body: { first_name, last_name, email, password }
 * Response 201: { message, userId }
 */
export async function register(req, res, next) {
    try {
        const { first_name, last_name, email, password } = req.body

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                message: 'first_name, last_name, email, and password are required',
            })
        }

        const user = await authService.register({
            firstName: first_name,
            lastName: last_name,
            email,
            password,
        })

        return res.status(201).json({
            message: 'User registered successfully',
            userId: user.user_id,
        })
    } catch (err) {
        next(err)
    }
}

/**
 * POST /auth/login
 * Body: { email, password }
 * Response 200: { token, userId, roles }
 */
export async function login(req, res, next) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required' })
        }

        const result = await authService.login({ email, password })
        return res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}

/**
 * GET /auth/profile
 * Headers: Authorization: Bearer <token>
 * Response 200: { user_id, first_name, last_name, email, phone, profile_image, status, created_at }
 *
 * req.user is populated by auth.middleware.js authenticate()
 */
export async function getProfile(req, res, next) {
    try {
        const profile = await authService.getProfile(req.user.sub)
        return res.status(200).json(profile)
    } catch (err) {
        next(err)
    }
}
