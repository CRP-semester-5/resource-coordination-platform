import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
//  Authorization Middleware
//
//  Two types of authorization in the ResQ Hub system:
//
//  1. requireGlobalRole(...roles)
//     Checks the globalRoles array embedded in the JWT.
//     Use for: VOLUNTEER-only routes, SUPER_ADMIN routes.
//     Fast — no database query needed.
//
//  2. requireOrgRole(...roles)
//     Queries the organization_members table in the database.
//     Use for: COORDINATOR routes, ORGANIZATION_ADMIN routes.
//     Slower — DB query per request — but always fresh (no stale JWT risk).
//     The organization_id must be provided via:
//       a. req.headers['x-organization-id']
//       b. req.params.organizationId
//       c. req.body.organization_id
//
//  Usage:
//    import { authenticate, requireGlobalRole, requireOrgRole } from '@crp/shared-middleware'
//
//    // Volunteer-only route (checked from JWT)
//    router.get('/tasks', authenticate, requireGlobalRole('VOLUNTEER'), handler)
//
//    // Coordinator route (checked from DB)
//    router.patch('/requests/:id/verify', authenticate, requireOrgRole('COORDINATOR', 'ORGANIZATION_ADMIN'), handler)
//
//    // Org admin only (checked from DB)
//    router.post('/members/invite', authenticate, requireOrgRole('ORGANIZATION_ADMIN'), handler)
// ─────────────────────────────────────────────────────────────────────────────

// Lazy Supabase client — only created once, shared across all requests.
let _supabase = null
function getSupabase() {
    if (!_supabase) {
        const url    = process.env.SUPABASE_URL
        const key    = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY
        if (!url || !key) {
            throw new Error('[requireOrgRole] SUPABASE_URL and SUPABASE_SECRET_KEY must be set')
        }
        _supabase = createClient(url, key)
    }
    return _supabase
}

// ─────────────────────────────────────────────────────────────────────────────
//  requireGlobalRole — checks JWT payload (no DB query)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware that checks if the user has ANY of the specified global roles.
 * Global roles are stored in the JWT payload (globalRoles array).
 * No database query — fast and suitable for high-traffic routes.
 *
 * Available global roles: 'USER' | 'VOLUNTEER' | 'SUPER_ADMIN'
 *
 * @param {...string} allowedRoles
 * @returns Express middleware
 */
export function requireGlobalRole(...args) {
    const allowedRoles = args.flat();
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }

        const userGlobalRoles = req.user.globalRoles ?? []
        const hasRole = allowedRoles.some((r) => userGlobalRoles.includes(r))

        if (!hasRole) {
            return res.status(403).json({
                message: `Access denied. Required global role: ${allowedRoles.join(' or ')}`,
            })
        }

        next()
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  requireOrgRole — checks organization_members table (DB query)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware that checks if the user is an active member with one of the
 * specified org roles in the organization_members table.
 *
 * Why DB query and not JWT?
 *   Organization roles can be revoked at any time (e.g. coordinator removed).
 *   If we embedded them in the JWT, the revoked role would still be valid
 *   until the token expires (could be hours). Checking the DB ensures
 *   role changes take effect immediately.
 *
 * Organization context is resolved from (in order):
 *   1. req.headers['x-organization-id']
 *   2. req.params.organizationId
 *   3. req.body.organization_id
 *
 * On success: attaches req.orgMembership = { org_id, role } for use in controllers.
 *
 * Available org roles: 'COORDINATOR' | 'ORGANIZATION_ADMIN'
 *
 * @param {...string} allowedRoles
 * @returns Express middleware (async)
 */
export function requireOrgRole(...args) {
    const allowedRoles = args.flat();
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' })
        }

        // SUPER_ADMIN bypasses org-level checks — they can access everything
        if (req.user.globalRoles?.includes('SUPER_ADMIN')) {
            req.orgMembership = { org_id: null, role: 'SUPER_ADMIN' }
            return next()
        }

        const userId = req.user.sub
        const orgId  = req.headers['x-organization-id']
                    || req.params.organizationId
                    || req.body?.organization_id

        if (!orgId) {
            return res.status(400).json({
                message: 'Organization context is required. Provide x-organization-id header or organizationId param.',
            })
        }

        try {
            const supabase = getSupabase()
            const { data, error } = await supabase
                .from('organization_members')
                .select('role, status')
                .eq('user_id', userId)
                .eq('organization_id', orgId)
                .eq('status', 'ACTIVE')
                .single()

            if (error && error.code !== 'PGRST116') throw error

            if (!data || !allowedRoles.includes(data.role)) {
                return res.status(403).json({
                    message: `Access denied. Required organization role: ${allowedRoles.join(' or ')}`,
                })
            }

            // Attach for use in controllers (e.g. to know which org they're acting for)
            req.orgMembership = { org_id: orgId, role: data.role }
            next()
        } catch (err) {
            console.error('[requireOrgRole] DB error:', err.message)
            return res.status(500).json({ message: 'Authorization check failed' })
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  requireRole — legacy alias, kept for backward compatibility
//
//  Old code used: requireRole('COORDINATOR', 'ORGANIZATION_ADMIN')
//  This now maps to requireOrgRole() so existing service routes continue to work.
//  Migrate usages to requireOrgRole() or requireGlobalRole() explicitly.
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use requireOrgRole() or requireGlobalRole() explicitly */
export function requireRole(...args) {
    const allowedRoles = args.flat();

    // Determine if all allowed roles are org-level or global
    const orgRoles    = ['COORDINATOR', 'ORGANIZATION_ADMIN']
    const globalRoles = ['USER', 'VOLUNTEER', 'SUPER_ADMIN']

    const hasOrgRoles    = allowedRoles.some((r) => orgRoles.includes(r))
    const hasGlobalRoles = allowedRoles.some((r) => globalRoles.includes(r))

    if (hasOrgRoles && !hasGlobalRoles) {
        return requireOrgRole(...allowedRoles)
    }
    return requireGlobalRole(...allowedRoles)
}
