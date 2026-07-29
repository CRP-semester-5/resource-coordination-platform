/**
 * Role-based authorization middleware factory.
 *
 * Usage in any service:
 *   import { requireRole } from '@crp/shared-middleware'
 *
 *   // Allow any admin or super admin
 *   router.delete('/org/:id', authenticate, requireRole('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), handler)
 *
 *   // Allow only coordinators
 *   router.patch('/request/:id/verify', authenticate, requireRole('COORDINATOR'), handler)
 *
 * How it works:
 *   Checks if the authenticated user has ANY of the allowed roles
 *   across ANY of their organization memberships (multi-tenant aware).
 *
 * Available roles (from membership_role enum in DB):
 *   'SUPER_ADMIN' | 'ORGANIZATION_ADMIN' | 'COORDINATOR' |
 *   'COMMUNITY_MEMBER' | 'DONOR' | 'VOLUNTEER'
 *
 * ⚠️  Org-specific authorization:
 *   This middleware only checks role presence globally.
 *   For "is this user an admin in THIS specific org?" checks,
 *   the service/controller layer must additionally verify that
 *   the matching role entry's org_id equals the requested org_id.
 *
 *   Example in a controller:
 *     const userOrgRole = req.user.roles.find(r => r.org_id === req.params.orgId)
 *     if (!userOrgRole || userOrgRole.role !== 'ORGANIZATION_ADMIN') {
 *       return res.status(403).json({ message: 'Not an admin of this organization' })
 *     }
 *
 * @param {...string} allowedRoles - One or more role names to allow
 * @returns Express middleware function
 */
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            // authenticate() must run before requireRole()
            return res.status(401).json({ message: 'Not authenticated' })
        }

        const userRoles = req.user.roles ?? []
        const hasRole = userRoles.some((r) => allowedRoles.includes(r.role))

        if (!hasRole) {
            return res.status(403).json({
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
            })
        }

        next()
    }
}
