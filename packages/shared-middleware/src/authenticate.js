import jwt from 'jsonwebtoken'

/**
 * Defense-in-depth JWT authentication middleware.
 *
 * Usage in any service:
 *   import { authenticate } from '@crp/shared-middleware'
 *   router.get('/protected', authenticate, handler)
 *
 * What it does:
 *   - Reads the Bearer token from the Authorization header
 *   - Verifies signature and expiry using JWT_SECRET env variable
 *   - On success: attaches decoded payload to req.user and calls next()
 *   - On failure: returns 401 immediately
 *
 * req.user shape (after successful verification):
 *   {
 *     sub:   "uuid-of-user",           // user_id from users table
 *     email: "user@example.com",
 *     roles: [                          // all active org memberships
 *       { org_id: "uuid", role: "ORGANIZATION_ADMIN" },
 *       { org_id: "uuid", role: "VOLUNTEER" },
 *     ],
 *     iat: 1234567890,
 *     exp: 1235000000,
 *   }
 *
 * Note: Kong API Gateway also validates the token at the gateway level.
 * This middleware provides a second validation layer (defense-in-depth)
 * so services remain secure even when called directly, bypassing Kong.
 */
export function authenticate(req, res, next) {
    const authHeader = req.headers['authorization']

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Missing or invalid Authorization header',
        })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired' })
        }
        return res.status(401).json({ message: 'Invalid token' })
    }
}
