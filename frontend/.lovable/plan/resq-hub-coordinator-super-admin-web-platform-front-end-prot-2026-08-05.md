# ResQ Hub — Coordinator & Super Admin Web Platform (Front-end Prototype)

A responsive React prototype of the Resource Coordination Platform, built page-by-page with realistic sample data. No database is added — all data comes from an in-app mock layer shaped exactly like your REST API, so swapping in the real backend later is a one-file change.

## Design direction

- Light, calm teal/green theme: near-white background, soft mint surfaces, deep teal primary, muted slate text.
- Status colours: amber (pending), teal (approved/accepted), green (fulfilled/completed), rose (rejected/cancelled), slate (cancelled/archived).
- Clean dashboard layout: fixed left sidebar (nav), top bar with organization switcher + notifications bell + coordinator avatar.
- Generous whitespace, rounded-xl cards, subtle borders instead of heavy shadows, readable table density.

## Coordinator platform

Top-left of the sidebar: an **organization dropdown**. A coordinator belongs to several organizations; switching filters every page's data to that org.

| Page | Content |
| --- | --- |
| Dashboard | KPI cards (open requests, pending donations, low-stock items, active volunteers, overdue tasks), request-status breakdown, recent activity feed |
| Requests | Table of community help requests: requester, resource, quantity, priority, location, date, status, actions. Approve / Reject (with mandatory reason) / View detail drawer with status timeline. Filters: status, priority, category, search |
| Donations | Table: donor name, resource, quantity, pickup location, date, status, action. Accept / Reject (with reason). Filters on every column-level facet plus search |
| Inventory | Stock table by category: available / reserved / allocated, warehouse, expiry, low-stock and expiring-soon alert banners. Restock and allocate-to-request actions |
| Volunteers | Volunteer directory with skills, availability badge, location, verification status. Approve / reject registration, search by skill and availability |
| Tasks | Task board plus table: title, priority, deadline, assigned volunteers, progress status. Create task, assign volunteers, update status |

## Super Admin platform

Separate area with its own sidebar: Overview (system-wide stats), Organizations (verify / approve / reject, search by district and category), Users & Roles (assign roles, account status), Resource Categories (CRUD), Audit Log.

## Shared behaviour

- Every table: search, faceted filters, sortable columns, pagination, empty states.
- Confirmation dialogs before destructive actions; toast feedback on every action.
- Notifications panel from the bell icon, with unread markers.
- Fully responsive down to tablet; sidebar collapses on narrow screens.

## Technical notes

- Routes: `/` (role picker / sign-in mock), `/coordinator/*` for the six coordinator tabs, `/admin/*` for the super admin pages. Each page is its own route file with its own head metadata.
- A `src/api/` layer with one function per endpoint from your spec (`getRequests`, `verifyRequest`, `verifyDonation`, `allocateInventory`, `approveVolunteer`, `assignTask`, `getDashboard`, `getOrganizations`, `getNotifications`, ...). Each currently resolves from seeded in-memory fixtures with a small artificial delay; the real base URL and fetch call drop in behind the same signatures.
- TanStack Query for all reads and mutations, so loading/error/optimistic states are already wired for the real API.
- Organization selection held in a React context and passed as the org filter to every query key.
- Theme tokens defined in `src/styles.css` (oklch), shadcn components for tables, dialogs, dropdowns, badges, and tabs.

## Not included in this pass

Real authentication, persistence, mobile Flutter app, PDF/CSV export, Kafka/WebSocket realtime.
