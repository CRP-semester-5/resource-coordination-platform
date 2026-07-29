# @crp/shared-middleware

Shared Express middleware for all **ResQ Hub** microservices.

Provides JWT authentication and multi-tenant role-based access control — no need to write it yourself in every service.

---

## Setup (for each service)

**1. Add as a dependency in your service's `package.json`:**
```json
{
  "dependencies": {
    "@crp/shared-middleware": "*"
  }
}
```

**2. Run from the monorepo root:**
```bash
npm install
```

**3. Make sure `JWT_SECRET` is in your service's environment** (it's in the root `.env`).

---

## Usage

### `authenticate` — Verify JWT

Protects a route. Rejects requests with missing/invalid/expired tokens.

```js
import { authenticate } from '@crp/shared-middleware'

// Protect a single route
router.get('/profile', authenticate, getProfile)

// Protect all routes in a router
router.use(authenticate)
```

On success, attaches `req.user` to the request:
```js
req.user = {
  sub:   "uuid-of-user",      // user_id from users table
  email: "user@example.com",
  roles: [                     // all active org memberships
    { org_id: "uuid-org-a", role: "ORGANIZATION_ADMIN" },
    { org_id: "uuid-org-b", role: "VOLUNTEER" },
  ],
  iat: 1234567890,
  exp: 1235000000,
}
```

---

### `requireRole` — Authorize by role

Use **after** `authenticate`. Allows access only if the user has one of the specified roles in any of their organizations.

```js
import { authenticate, requireRole } from '@crp/shared-middleware'

// Only coordinators and admins can verify requests
router.patch('/requests/:id/verify',
  authenticate,
  requireRole('COORDINATOR', 'ORGANIZATION_ADMIN'),
  verifyRequest
)

// Only super admins can access this
router.delete('/users/:id',
  authenticate,
  requireRole('SUPER_ADMIN'),
  deleteUser
)
```

**Available roles** (from `membership_role` DB enum):

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | Platform-level admin |
| `ORGANIZATION_ADMIN` | Admin of a specific org |
| `COORDINATOR` | Coordinates resources within an org |
| `COMMUNITY_MEMBER` | Regular member |
| `DONOR` | Resource donor |
| `VOLUNTEER` | Task volunteer |

---

### ⚠️ Org-specific authorization

`requireRole` checks if the user has a role in **any** org. For routes that need to verify the user is authorized for a **specific** organization, add a check in your controller:

```js
export async function updateOrg(req, res) {
  const { orgId } = req.params

  // Check user has admin role specifically in THIS org
  const match = req.user.roles.find(
    r => r.org_id === orgId && r.role === 'ORGANIZATION_ADMIN'
  )

  if (!match) {
    return res.status(403).json({ message: 'Not an admin of this organization' })
  }

  // proceed...
}
```

---

## Defense-in-depth

Kong API Gateway also validates JWTs at the gateway level before routing requests to services. This middleware provides a **second validation layer** — services remain secure even when called directly (e.g. service-to-service calls, local dev, or bypassing Kong).

```
Client → Kong (validates JWT) → your-service → authenticate() (validates again) → handler
```
