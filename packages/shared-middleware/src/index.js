/**
 * @crp/shared-middleware
 *
 * Shared Express middleware for all CRP microservices.
 * Provides JWT authentication and role-based access control
 * that is multi-tenant aware (roles are per organization).
 *
 * Usage:
 *   import { authenticate, requireRole } from '@crp/shared-middleware'
 *
 * Prerequisites for each service:
 *   - JWT_SECRET environment variable must be set (same secret used by user-service)
 *   - Must use authenticate() BEFORE requireRole() in the middleware chain
 *
 * Example:
 *   router.get('/admin/dashboard',
 *     authenticate,
 *     requireRole('COORDINATOR', 'ORGANIZATION_ADMIN'),
 *     dashboardHandler
 *   )
 */

export { authenticate } from './authenticate.js'
export { requireRole } from './requireRole.js'
