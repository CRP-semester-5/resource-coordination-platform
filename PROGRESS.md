# ResQ Hub & Resource Coordination Platform — Comprehensive Master Progress & Handover Document

**Date:** September 23, 2026  
**Status:** All Core End-to-End Flows (Donations, Requests, Volunteer Missions, Handover Security PIN, Real-time Status Sync, Cross-Platform CORS) **100% Fully Operational & Verified**.

---

## 1. System Architecture & Microservices Overview

The platform is a multi-tier disaster relief resource coordination ecosystem consisting of:
1. **Flutter Mobile App (`resq_hub_mobile`)**: Supports Citizens/Requesters, Donors, and Volunteer Field Responders on Android and Web.
2. **Coordinator Web Dashboard (`frontend`)**: React 18 + Vite + TanStack Router/Query + TailwindCSS for Organization Relief Coordinators.
3. **Kong API Gateway (Port 3000)**: Single entry point handling routing, CORS, JWT validation, and Rate Limiting.
4. **Node.js Microservices (7 Services)**: Running in Docker containers, integrated with **Supabase PostgreSQL**.

```
+---------------------------------------------------------------------------------+
|                         CLIENT APPLICATIONS                                     |
|  - Flutter Mobile App (resq_hub_mobile) [Android Emulator: 10.0.2.2 / Wi-Fi]    |
|  - Flutter Web App [localhost:random_port via Chrome]                           |
|  - Coordinator Dashboard (frontend) [Vite: localhost:5173]                      |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                         KONG API GATEWAY (Port 3000)                            |
|  - Regex CORS: origins: [".*"] (Allows any browser port / IP)                  |
|  - Correlation IDs, Rate Limiting (300 req/min), JWT Header Forwarding          |
+---------------------------------------------------------------------------------+
   |           |           |           |           |           |           |
   v (3001)    v (3002)    v (3003)    v (3004)    v (3005)    v (3006)    v (3007)
+---------+ +---------+ +---------+ +---------+ +---------+ +---------+ +---------+
|  User   | |  Org    | |Resource | | Request | |  Task   | |Volunteer| | Notif   |
| Service | | Service | | Service | | Service | | Service | | Service | | Service |
+---------+ +---------+ +---------+ +---------+ +---------+ +---------+ +---------+
   |           |           |           |           |           |           |
   +-----------+-----------+-----------+-----------+-----------+-----------+
                                       |
                                       v
                        Supabase PostgreSQL Database
```

### Microservices Port & Route Mapping
| Service Name | Docker Container | Port | Kong Route | Key Roles & Responsibilities |
|---|---|---|---|---|
| **Kong Gateway** | `crp-kong` | `3000` | `/api/v1/*` | Unified API entry, CORS proxy, Auth routing |
| **User Service** | `crp-user-service` | `3001` | `/api/v1/users`, `/auth` | User login, registration, JWT issuance, profile |
| **Organization Service** | `crp-organization-service` | `3002` | `/api/v1/organizations` | Relief organizations, branches, coordinator mapping |
| **Resource Service** | `crp-resource-service` | `3003` | `/api/v1/resources`, `/donations`, `/inventory` | Donations, relief store inventory auto-credit |
| **Request Service** | `crp-request-service` | `3004` | `/api/v1/requests` | Citizen aid requests, urgent relief requirements |
| **Task Service** | `crp-task-service` | `3005` | `/api/v1/tasks` | Volunteer missions, SitReps, Handover OTP |
| **Volunteer Service** | `crp-volunteer-service` | `3006` | `/api/v1/volunteers` | Volunteer registration, badges, skill matching |
| **Notification Service** | `crp-notification-service` | `3007` | `/api/v1/notifications` | Push alerts & system events |
| **Web Coordinator** | Local Node process | `5173` | UI | Organization operations, dispatching & inventory |

---

## 2. Network, IP & CORS Configuration

* **Local Machine IP:** `192.168.8.100` (can be updated dynamically in `.env`).
* **Kong Gateway CORS Plugin (`api-gateway/kong/kong.yml`):**
  ```yaml
  plugins:
    - name: cors
      config:
        origins:
          - ".*"
        methods:
          - GET
          - POST
          - PATCH
          - PUT
          - DELETE
          - OPTIONS
        headers:
          - Accept
          - Authorization
          - Content-Type
          - X-Requested-With
          - X-Correlation-ID
          - x-organization-id
        exposed_headers:
          - X-Correlation-ID
        credentials: true
        max_age: 3600
  ```
* **Mobile Client Initialization (`resq_hub_mobile/lib/core/network/api_client.dart`):**
  - Reads `API_URL` from `.env` (defaults to `http://192.168.8.100:3000/api/v1`).
  - Supports dynamic IP switching via `ApiClient.updateBaseUrl(ip)`.
  - Automatically loads saved JWT token from `SharedPreferences` on app launch (`initBaseUrl()`).

---

## 3. Verified End-to-End Workflow Lifecycles

### Flow A: Citizen Help Request & Volunteer Delivery Mission

1. **Citizen Request Submission (Mobile):**
   - Citizen fills 5-step form (Category $\rightarrow$ Contact $\rightarrow$ Location $\rightarrow$ Urgency $\rightarrow$ Review).
   - Saved in `requests` table with `status: 'PENDING'`.
   - **Mobile Tracking Screen:**
     - `Step 1: Request Submitted` (Checked ✅)
     - `Step 2: Coordinator Verification & Approval` (Pending ⏳)
     - `Step 3: Volunteer Assigned` (Pending ⏳)
     - `Step 4: In Transit / Delivering Aid` (Pending ⏳)
     - `Step 5: Aid Delivered & Fulfilled` (Pending ⏳)
     - Status Badge: `PENDING REVIEW`
2. **Coordinator Verification & Task Dispatch (Web):**
   - Coordinator opens **Help Requests** tab $\rightarrow$ Clicks **"Dispatch Task to Volunteers"**.
   - Modal creates task with tagged description: `[REQUEST_ID:uuid] [REQUEST_CODE:code]`.
   - Task created with initial `status: 'PENDING'`.
   - Linked Request status in database transitions to `VERIFIED`.
   - Mobile tracking marks `Step 2: Coordinator Verification` (Checked ✅).
3. **Volunteer Claiming Mission (Mobile):**
   - Volunteer opens **Volunteer Missions Tab** $\rightarrow$ Taps **"Claim Mission"**.
   - API calls `POST /api/v1/tasks/:id/assign`.
   - Backend updates `task_assignments` with `assignment_status: 'ACCEPTED'` and synchronizes request status to `ASSIGNED`.
   - **Mobile Tracking Screen Updates:**
     - `Step 3: Volunteer Assigned` (Checked ✅)
     - Status Badge: `VOLUNTEER ASSIGNED`
4. **Tactical Mission Milestones (Mobile):**
   - Volunteer taps **"Mark as En Route (50%)"** $\rightarrow$ Status `IN_PROGRESS` $\rightarrow$ Requester tracking marks `Step 4: In Transit / Delivering Aid` (Checked ✅).
   - Volunteer taps **"On Scene (75%)"** $\rightarrow$ Status `IN_PROGRESS`.
5. **Secure Handover PIN Generation & Verification:**
   - Volunteer arrives at citizen location and taps **"Complete Delivery & Verify OTP"**.
   - Backend `taskService.regeneratePin(taskId)` generates a secure 4-digit PIN (e.g. `9001`) in Supabase `requests.handover_pin`.
   - Requester Mobile Tracking automatically displays the **4-Digit Handover Security PIN Card**.
   - Volunteer inputs the 4-digit PIN on mobile modal and submits $\rightarrow$ Backend validates PIN $\rightarrow$ Inserts progress record with 100% $\rightarrow$ Updates task to `COMPLETED` $\rightarrow$ Updates request to `FULFILLED`.
6. **Post-Completion OTP Removal:**
   - Requester Tracking marks `Step 5: Aid Delivered & Fulfilled` (Checked ✅).
   - **Handover PIN Card is completely removed / hidden** from UI (`SizedBox.shrink()`).

---

### Flow B: Donation Offer & Volunteer Pickup Mission

1. **Donor Offer Submission (Mobile):**
   - Donor submits resource offer (e.g., 50 items of Baby Care) with pickup address.
   - Saved in `donations` table with `status: 'PENDING'`.
2. **Coordinator Acceptance & Dispatch (Web):**
   - Coordinator opens **Donations** tab $\rightarrow$ Clicks **"Confirm Acceptance"** $\rightarrow$ Donation status `ACCEPTED`.
   - Coordinator clicks **"Dispatch Task to Volunteers"** $\rightarrow$ Task created with `[DONATION_ID:uuid] [DONATION_CODE:code]`.
   - Donor tracking displays `ACCEPTED BY COORDINATOR` with `Step 2: Coordinator Verification` (Checked ✅).
3. **Volunteer Mission Claiming (Mobile):**
   - Volunteer accepts task $\rightarrow$ Database updates donation status to `ASSIGNED`.
   - Donor tracking marks `Step 3: Volunteer Assigned` (Checked ✅).
4. **Transit & Pickup (Mobile):**
   - Volunteer marks **"En Route"** $\rightarrow$ Donation status `IN_PROGRESS` $\rightarrow$ Donor tracking marks `Step 4: In Transit / Pickup En Route` (Checked ✅).
5. **Handover OTP & Automatic Inventory Credit:**
   - Volunteer arrives at donor location and taps **"Complete Delivery & Verify OTP"** $\rightarrow$ Dynamic 4-digit PIN generated in `donations.handover_pin`.
   - Donor tracking displays 4-digit PIN.
   - Volunteer submits PIN $\rightarrow$ Backend verifies $\rightarrow$ Task marked `COMPLETED` $\rightarrow$ Donation marked `COMPLETED` $\rightarrow$ **Automatically increments / upserts Organi### Flow C: Inventory Ledger, Auto-Crediting & Request Auto-Deduction

1. **Donation Auto-Credit (`STOCK_IN`)**:
   - When a volunteer delivers a donation pickup and citizen/donor verifies Handover PIN (100% completion), `task-service` automatically upserts into `inventory` table and logs a `STOCK_IN` record in `inventory_transactions`.
   - Reference recorded as `#DON-[ID]`, with timestamp and donor notes.
2. **Request Dispatch Stock Sufficiency Validation**:
   - When a coordinator clicks **"Dispatch Task to Volunteers"** in Coordinator Web UI:
     - Real-time stock check (`POST /api/v1/inventory/check-stock`) validates warehouse availability.
     - 🟢 **Sufficient Stock**: Shows green available badge (`In Stock: X | Requested: Y`) and permits dispatch.
     - 🔴 **Insufficient Stock**: Shows red shortage alert (`In Stock: X | Requested: Y | Shortage: -Z`) and blocks the dispatch button.
     - `task-service` also enforces this validation at the database level when creating tasks with `[REQUEST_ID:uuid]`.
3. **Request Fulfillment Auto-Deduction (`STOCK_OUT`)**:
   - When volunteer arrives at citizen location and verifies the 4-digit Handover PIN:
     - Task marked `COMPLETED` and Request marked `FULFILLED`.
     - `task-service` automatically deducts the quantity from `inventory` and logs a `STOCK_OUT` record in `inventory_transactions`.
     - Reference recorded as `#REQ-[ID]`, with citizen contact notes.
4. **3-Tier Coordinator Inventory Dashboard (`/coordinator/inventory`)**:
   - **Top**: Metric cards for Total Units in Stock, In-Store Categories, Low Stock Warnings (<50 threshold), and Operational Warehouse Facility.
   - **Middle**: Live Stock on Hand table with search, category filtering, status badges (`Available`, `Low Stock`, `Out of Stock`), and instant Restock/Allocate dialogs.
   - **Bottom**: Real-time **Inventory Movement & Transaction Audit Trail** ledger with `STOCK_IN` (Green) and `STOCK_OUT` (Red) direction badges, reference codes, quantity changes, and timestamps.

---

## 4. Critical Bug Fixes & Architectural Rules

### 1. Task Service Database Authentication (RLS Bypass)
* **Problem:** `task-service` was using `SUPABASE_PUBLISHABLE_KEY` (anon key), causing Postgres Row Level Security (RLS) to silently reject cross-table updates to `donations` and `requests`.
* **Fix:** In `services/task-service/src/config/env.js`, prioritized `SUPABASE_SECRET_KEY` (Service Role Key).

### 2. Strict Exact Tag Matching in Coordinator Dashboard
* **Problem:** Coordinator Preview modals matched tasks using loose fuzzy strings (`requester name` + `resource name`), which caused brand-new requests to inherit old completed tasks from previous requests by the same user.
* **Fix:** In `frontend/src/routes/coordinator.requests.tsx` and `coordinator.donations.tsx`, `getLinkedTask` enforces exact `[REQUEST_ID:uuid]` / `[DONATION_ID:uuid]` matching and explicitly rejects any task tagged with a different record's ID (`hasExplicitOtherTag`).

### 3. Dynamic Status Calculation in Task Repository
* **Problem:** A trigger on the `tasks` master table threw `record "new" has no field "created_by"` when executing updates directly on the `tasks` table.
* **Fix:** In `services/task-service/src/repositories/task.repository.js`, `formatTaskWithTeamInfo` dynamically derives top-level `status` and `progress_percent` from `task_progress` and `task_assignments`, populating `volunteers` user details directly for the Web Coordinator UI.

### 4. Client-Side Fake Fallback PIN Removal
* **Problem:** Repositories had synthetic fallback PIN math (`((seed % 9000) + 1000)`), causing PINs to display prematurely before volunteer arrival.
* **Fix:** In `donation_repository.dart` and `request_repository.dart`, PIN is set to `null` until generated by the backend on scene.

### 5. Automated OTP Card Removal on Completion
* **Problem:** Completed tracking screens continued displaying the security PIN card after handover was finished.
* **Fix:** In `donation_details_screen.dart` and `request_details_screen.dart`, `_buildHandoverPinCard` returns `const SizedBox.shrink()` when `isCompleted` / `isFulfilled` is true.

---

## 5. File & Component Reference Guide

### Mobile Application (`resq_hub_mobile`)
* `lib/core/network/api_client.dart`: Dio HTTP client, JWT interceptor, dynamic base URL switcher.
* `lib/features/requests/views/request_details_screen.dart`: Citizen request tracking, timeline milestones & secure OTP display.
* `lib/features/donations/views/donation_details_screen.dart`: Donor tracking, timeline milestones & secure OTP display.
* `lib/features/volunteer/views/volunteer_dashboard_tab.dart`: Volunteer mission feeds (Pending, Assigned, Completed).
* `lib/features/volunteer/views/dispatch_mission_details_screen.dart`: Active tactical mission console with En Route & On Scene triggers.
* `lib/features/volunteer/views/widgets/volunteer_task_details_sheet.dart`: Mission preview modal & Handover PIN entry dialog.
* `lib/features/volunteer/repositories/volunteer_repository.dart`: Task assignment, progress submission, OTP verification API calls.
* `lib/features/donations/repositories/donation_repository.dart`: Donation submission, retrieval & PIN regeneration.
* `lib/features/requests/repositories/request_repository.dart`: Request submission, retrieval & PIN regeneration.

### Web & Backend (`resource-coordination-platform-dev-feature-frontend`)
* `api-gateway/kong/kong.yml`: Kong routes, plugins, rate limiting, and regex CORS.
* `services/task-service/src/services/task.service.js`: Task business logic, status synchronization, OTP verification, stock validation, and `inventory_transactions` logging.
* `services/task-service/src/repositories/task.repository.js`: Supabase database queries and formatters.
* `services/resource-service/src/repositories/inventory.repository.js`: Inventory balances, categories, and transaction ledger engine.
* `services/resource-service/src/services/inventory.service.js`: Restock, allocate, checkStock, and transaction querying.
* `services/resource-service/src/controllers/inventory.controller.js` & `inventory.routes.js`: Inventory routes (`GET /transactions`, `POST /check-stock`).
* `frontend/src/routes/coordinator.inventory.tsx`: 3-Tier Coordinator Inventory Dashboard (Summary cards, live stock table, transaction ledger).
* `frontend/src/routes/coordinator.requests.tsx`: Web Coordinator Help Requests management with real-time stock sufficiency validation badge.
* `frontend/src/routes/coordinator.donations.tsx`: Web Coordinator Donations management.
* `frontend/src/routes/coordinator.tasks.tsx`: Web Coordinator Tasks & Volunteer Assignments overview.

---

## 6. How to Run & Verify the Project

### Start Backend Services (Docker)
```powershell
cd "e:\semester 5\SE project\Code\new\resource-coordination-platform-dev-feature-frontend"
docker compose up -d
```

### Start Web Coordinator Dashboard
```powershell
cd "e:\semester 5\SE project\Code\new\resource-coordination-platform-dev-feature-frontend\frontend"
npm run dev
# Dashboard opens on http://localhost:5173
```

### Start Flutter Mobile App
```powershell
cd "e:\semester 5\SE project\Code\resq_hub_mobile"
flutter run
# Or for Web:
flutter run -d chrome
```

---

## 7. Next Session Roadmap

1. **Multi-Volunteer Team Missions**: Extend mission dispatching to support `volunteers_required > 1` with individual responder progress tracking.
2. **Push Notifications**: Integrate `notification-service` with Firebase Cloud Messaging (FCM) to trigger real-time mobile push alerts on task dispatch.
3. **Tactical GPS Map Live Navigation**: Connect Mapbox / Google Maps navigation inside `dispatch_mission_details_screen.dart`.

