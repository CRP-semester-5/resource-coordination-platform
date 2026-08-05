/**
 * @crp/shared-middleware
 *
 * Shared Express middleware for all CRP microservices.
 *
 * ── Authentication ───────────────────────────────────────────────────────────
 *
 * authenticate(req, res, next)
 *   Verifies the Bearer JWT from the Authorization header.
 *   Attaches decoded payload to req.user:
 *     { sub, email, globalRoles: ['USER', 'VOLUNTEER'], iat, exp }
 *
 * ── Authorization ────────────────────────────────────────────────────────────
 *
 * requireGlobalRole(...roles)
 *   Checks globalRoles in the JWT (no DB query). Use for:
 *     - VOLUNTEER-only routes
 *     - SUPER_ADMIN routes
 *
 * requireOrgRole(...roles)
 *   Queries organization_members table (DB call per request). Use for:
 *     - COORDINATOR routes
 *     - ORGANIZATION_ADMIN routes
 *   Requires organization context via x-organization-id header, or
 *   :organizationId param, or body.organization_id.
 *   Attaches req.orgMembership = { org_id, role } on success.
 *
 * requireRole(...roles) — @deprecated
 *   Legacy alias. Delegates to requireGlobalRole or requireOrgRole.
 *   Migrate to explicit functions.
 *
 * ── Prerequisites ─────────────────────────────────────────────────────────────
 *   - JWT_SECRET env variable must match the secret used by user-service
 *   - SUPABASE_URL + SUPABASE_SERVICE_KEY must be set (for requireOrgRole)
 *   - authenticate() must run BEFORE any require*Role() middleware
 *
 * ── Example Usage ─────────────────────────────────────────────────────────────
 *   import { authenticate, requireGlobalRole, requireOrgRole } from '@crp/shared-middleware'
 *
 *   // Any logged-in user
 *   router.get('/profile', authenticate, handler)
 *
 *   // Volunteer-only (JWT check, no DB)
 *   router.get('/tasks/assigned', authenticate, requireGlobalRole('VOLUNTEER'), handler)
 *
 *   // Coordinator OR org admin (DB check)
 *   router.patch('/requests/:id/verify', authenticate, requireOrgRole('COORDINATOR', 'ORGANIZATION_ADMIN'), handler)
 *
 *   // Org admin only (DB check)
 *   router.post('/members/invite', authenticate, requireOrgRole('ORGANIZATION_ADMIN'), handler)
 */

export { authenticate }                                    from './authenticate.js'
export { requireGlobalRole, requireOrgRole, requireRole }  from './requireRole.js'
