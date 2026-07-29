/**
 * auth.middleware.js — user-service
 *
 * Re-exports authenticate and requireRole from the shared middleware package.
 * The actual implementation lives in packages/shared-middleware.
 *
 * All other services should import directly from '@crp/shared-middleware':
 *   import { authenticate, requireRole } from '@crp/shared-middleware'
 */
export { authenticate, requireRole } from '@crp/shared-middleware'
