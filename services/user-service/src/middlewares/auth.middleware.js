import jwt from 'jsonwebtoken'

/**
 * Defense-in-depth JWT middleware.
 *
 * Kong validates the token at the gateway level.
 * This middleware validates again at the service level — so the service
 * is secure even when called directly (bypassing Kong in dev/internal scenarios).
 *
 * On success, attaches decoded payload to req.user:
 *   req.user = { sub, email, roles: [{ org_id, role }, ...], iat, exp }
 */
export function authenticate(req, res, next) {
    const authHeader = req.headers['authorization']

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid Authorization header' })
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

/**
 * Role-based authorization middleware factory.
 *
 * Usage: requireRole('ORGANIZATION_ADMIN', 'SUPER_ADMIN')
 * Passes if the user has ANY of the allowed roles across ANY of their orgs.
 *
 * For org-specific checks (e.g. "is admin in THIS org?"),
 * the service/controller layer should also verify org_id from the request.
 *
 * @param {...string} allowedRoles - membership_role enum values from the DB
 */
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const userRoles = req.user?.roles ?? []
        const hasRole = userRoles.some((r) => allowedRoles.includes(r.role))

        if (!hasRole) {
            return res.status(403).json({ message: 'Insufficient permissions' })
        }
        next()
    }
}
