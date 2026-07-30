# ResQ Hub — Community Resilience Platform
## Project Development Plan

**Project:** ResQ Hub  
**System Type:** Multi-tenant Community Resource and Volunteer Coordination Platform  
**Development Model:** Microservices Architecture  
**Backend:** Node.js and Express.js  
**API Gateway:** Kong Gateway  
**Database:** PostgreSQL hosted on Supabase  
**Containerization:** Docker  
**Container Orchestration:** Kubernetes (final deployment target)  
**CI/CD:** GitHub Actions  
**Frontend:** React.js web application and Flutter mobile application  

---

# 1. Purpose

This document defines the technical development plan for ResQ Hub. It establishes the approved architecture, service responsibilities, team workflow, development phases, testing requirements, integration approach, deployment strategy, and project completion criteria.

The plan is intended to ensure that all team members develop compatible components while maintaining clear ownership boundaries. It should be treated as the main technical guide during implementation.

A feature is not considered complete merely because its API endpoint or user interface has been created. A feature is complete only when it has been implemented, validated, tested, documented, integrated, containerized where applicable, and reviewed through a pull request.

---

# 2. Project Overview

ResQ Hub is a digital platform designed to improve the coordination of community resources, assistance requests, volunteers, donations, and emergency relief activities.

During emergencies such as floods, landslides, and other disasters, affected community members may require food, water, medicine, shelter materials, transport, or volunteer assistance. Coordinating these activities manually can result in delayed responses, duplicated resource allocation, poor inventory visibility, and inefficient volunteer management.

ResQ Hub provides a centralized platform through which:

- Community members can submit and track assistance requests.
- Donors can offer resources and monitor donation progress.
- Volunteers can maintain profiles, availability, skills, and assigned tasks.
- Coordinators can verify requests and donations, manage inventory, assign volunteers, and monitor relief operations.
- Organizations can operate as isolated tenants within the same platform.
- Users can receive real-time notifications regarding requests, tasks, donations, and other important events.

---

# 3. Project Objectives

The primary objectives of ResQ Hub are to:

1. Provide a centralized system for managing community assistance requests.
2. Improve the efficient allocation and tracking of emergency resources.
3. Support the registration, verification, and coordination of volunteers.
4. Enable coordinators to assign and monitor relief tasks.
5. Provide transparent tracking of requests and donations.
6. Support multiple organizations using a secure multi-tenant architecture.
7. Provide real-time notifications and status updates.
8. Maintain secure authentication and role-based authorization.
9. Support scalable deployment using containerized microservices.
10. Reduce manual coordination effort and improve emergency response efficiency.

---

# 4. User Roles

## 4.1 Community Member

Community members can:

- Register and log in.
- Manage their profile.
- Join or access an organization.
- Submit assistance requests.
- Specify required resource type, quantity, location, and urgency.
- Upload supporting attachments where required.
- Track request status.
- Receive request-related notifications.
- Offer resources or register as volunteers.

## 4.2 Donor

Donors can:

- Register and log in.
- Submit donation offers.
- Provide resource details and delivery information.
- Track whether donations are pending, verified, received, or distributed.
- Receive donation-related notifications.

## 4.3 Volunteer

Volunteers can:

- Create and update volunteer profiles.
- Add skills and certifications.
- Update availability.
- View assigned tasks.
- Accept or reject task assignments.
- Update task progress.
- Mark completed tasks.
- Receive real-time task notifications.

## 4.4 Coordinator

Coordinators can:

- Verify or reject assistance requests.
- Verify or reject donation offers.
- Manage resource inventory.
- Create relief tasks.
- Assign volunteers to tasks.
- Monitor task progress.
- Monitor requests, donations, volunteers, and inventory.
- Generate operational reports.

## 4.5 Organization Administrator

Organization administrators can:

- Manage organization information.
- Manage organization memberships.
- Assign organization roles.
- Manage coordinators.
- View organization-level dashboards and reports.
- Monitor organization activities.

## 4.6 Platform Administrator

Platform administrators can:

- Manage organizations.
- Monitor platform-level activity.
- Manage platform administration settings.
- Suspend or reactivate accounts where required.

---

# 5. Approved Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Web Application | React.js | Coordinator, administrator, and public web interfaces |
| Mobile Application | Flutter | Community member, donor, and volunteer application |
| Backend | Node.js with Express.js | Microservice business logic and REST APIs |
| API Gateway | Kong Gateway | API routing, gateway security, rate limiting, CORS, logging, and traffic policies |
| Database | PostgreSQL | Persistent relational data storage |
| Database Hosting | Supabase | Managed PostgreSQL hosting, backups, and database administration |
| Authentication | JWT | Stateless user authentication |
| Authorization | RBAC with organization membership checks | Role and tenant-based access control |
| Real-Time Communication | Socket.IO | Live notifications and status updates |
| API Documentation | OpenAPI / Swagger | API contracts and endpoint documentation |
| Containerization | Docker | Consistent service packaging |
| Local Orchestration | Docker Compose | Running all services locally |
| Production Orchestration | Kubernetes | Scaling, service management, and resilient deployment |
| CI/CD | GitHub Actions | Automated testing, image building, and deployment |
| Cloud Platform | AWS | Production infrastructure and hosting |
| Source Control | Git and GitHub | Version control, collaboration, and code review |
| Project Management | ClickUp | Task tracking and project scheduling |
| Testing | Jest, Supertest, Flutter testing tools | Automated backend and mobile testing |

---

# 6. Final System Architecture

## 6.1 High-Level Architecture

```text
                         ┌─────────────────────┐
                         │   React Web Client  │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   Flutter Mobile    │
                         │        App          │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │    Kong Gateway     │
                         │                     │
                         │ Routing             │
                         │ Rate Limiting       │
                         │ CORS                │
                         │ Logging             │
                         │ Gateway Policies    │
                         └──────────┬──────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       │             │              │              │             │
┌──────▼─────┐ ┌─────▼──────┐ ┌────▼──────┐ ┌─────▼─────┐ ┌────▼────────┐
│ User       │ │Organization│ │ Request   │ │ Task      │ │ Resource    │
│ Service    │ │ Service    │ │ Service   │ │ Service   │ │ Service     │
└──────┬─────┘ └─────┬──────┘ └────┬──────┘ └─────┬─────┘ └────┬────────┘
       │             │              │              │             │
       └─────────────┴──────────────┼──────────────┴─────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │       PostgreSQL Database      │
                    │       Hosted on Supabase       │
                    └───────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │ Volunteer Service             │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │ Notification Service          │
                    │ Socket.IO / Real-Time Events  │
                    └───────────────────────────────┘
```

## 6.2 Architectural Principles

1. Each microservice must be independently runnable.
2. Each service must have its own source folder, Dockerfile, environment configuration, tests, and API documentation.
3. Kong is the only public backend entry point.
4. Backend services must not be directly exposed to the public internet.
5. Frontend applications communicate only with Kong, not directly with individual services.
6. The platform uses one PostgreSQL database during the academic project.
7. Logical service ownership must still be maintained even when services share one database.
8. Each organization-owned record must contain an `organization_id`.
9. Tenant and role information supplied by clients must always be validated by the backend.
10. Business authorization must remain inside the relevant microservice, not inside Kong.
11. Sensitive operations must be recorded in audit logs.
12. Services should communicate synchronously through REST APIs when an immediate response is required.
13. Asynchronous events should be used for notifications and non-critical background processing.
14. Kafka is not required for the initial academic implementation unless the team approves it after identifying a concrete need.

---

# 7. Microservice Responsibilities

## 7.1 User Service

The User Service owns identity and account management.

### Responsibilities

- User registration.
- Email verification.
- User login.
- Password hashing.
- Password reset.
- JWT generation.
- JWT refresh or session management if implemented.
- User profile management.
- Account activation and deactivation.
- User status management.
- User address management.
- Authentication-related API documentation.

### Main API Areas

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/logout

GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/:userId
```

### Important Rule

The User Service authenticates users and issues JWTs. Each business service validates the JWT and performs authorization for its own operations.

---

## 7.2 Organization Service

The Organization Service manages organizations and memberships.

### Responsibilities

- Create organizations.
- Update organization information.
- Manage organization status.
- Add users to organizations.
- Manage organization memberships.
- Approve or reject membership requests.
- Assign organization-specific roles.
- Remove or deactivate memberships.
- Validate organization membership.
- Support multi-tenant access control.

### Main API Areas

```text
POST   /api/v1/organizations
GET    /api/v1/organizations
GET    /api/v1/organizations/:organizationId
PATCH  /api/v1/organizations/:organizationId

POST   /api/v1/organizations/:organizationId/members
GET    /api/v1/organizations/:organizationId/members
PATCH  /api/v1/organizations/:organizationId/members/:membershipId
DELETE /api/v1/organizations/:organizationId/members/:membershipId
```

---

## 7.3 Request Service

The Request Service manages community assistance requests.

### Responsibilities

- Create assistance requests.
- Store request details.
- Store location and urgency information.
- Upload and manage request attachments.
- View requests.
- Filter requests by status, urgency, category, and location.
- Verify or reject requests.
- Update request status.
- Track request history.
- Mark requests as fulfilled or cancelled.
- Notify relevant users when request status changes.

### Main API Areas

```text
POST   /api/v1/requests
GET    /api/v1/requests
GET    /api/v1/requests/:requestId
PATCH  /api/v1/requests/:requestId
PATCH  /api/v1/requests/:requestId/verify
PATCH  /api/v1/requests/:requestId/reject
PATCH  /api/v1/requests/:requestId/status
POST   /api/v1/requests/:requestId/attachments
```

---

## 7.4 Task Service

The Task Service manages relief activities and volunteer assignments.

### Responsibilities

- Create tasks from verified requests.
- Set task priority and deadlines.
- Assign one or more volunteers.
- Allow volunteers to accept or reject assignments.
- Track task status.
- Record task progress.
- Record completion.
- Monitor overdue tasks.
- Notify volunteers about assignments.
- Notify coordinators about task updates.

### Main API Areas

```text
POST   /api/v1/tasks
GET    /api/v1/tasks
GET    /api/v1/tasks/:taskId
PATCH  /api/v1/tasks/:taskId
PATCH  /api/v1/tasks/:taskId/status

POST   /api/v1/tasks/:taskId/assignments
PATCH  /api/v1/tasks/:taskId/assignments/:assignmentId
POST   /api/v1/tasks/:taskId/progress
GET    /api/v1/tasks/:taskId/progress
```

---

## 7.5 Resource Service

The Resource Service manages inventory and donations.

### Responsibilities

- Create and manage resource records.
- Track available quantities.
- Track reserved quantities.
- Track inventory locations.
- Update inventory levels.
- Record inventory transactions.
- Create donation offers.
- Verify or reject donations.
- Record received donations.
- Allocate resources to requests.
- Record resource distribution.
- Prevent invalid inventory quantities.
- Provide low-stock information.

### Main API Areas

```text
POST   /api/v1/resources
GET    /api/v1/resources
GET    /api/v1/resources/:resourceId
PATCH  /api/v1/resources/:resourceId
POST   /api/v1/resources/:resourceId/transactions

POST   /api/v1/donations
GET    /api/v1/donations
GET    /api/v1/donations/:donationId
PATCH  /api/v1/donations/:donationId/verify
PATCH  /api/v1/donations/:donationId/reject
PATCH  /api/v1/donations/:donationId/receive
PATCH  /api/v1/donations/:donationId/distribute
```

---

## 7.6 Volunteer Service

The Volunteer Service manages volunteer profiles and capabilities.

### Responsibilities

- Create volunteer profiles.
- Update volunteer profiles.
- Manage skills.
- Manage certifications.
- Manage availability.
- Update verification status.
- Search volunteers by skill and availability.
- Provide volunteer information to coordinators.
- Support task assignment validation.

### Main API Areas

```text
POST   /api/v1/volunteers
GET    /api/v1/volunteers
GET    /api/v1/volunteers/:volunteerId
PATCH  /api/v1/volunteers/:volunteerId

POST   /api/v1/volunteers/:volunteerId/skills
DELETE /api/v1/volunteers/:volunteerId/skills/:skillId

POST   /api/v1/volunteers/:volunteerId/availability
GET    /api/v1/volunteers/:volunteerId/availability
PATCH  /api/v1/volunteers/:volunteerId/availability/:availabilityId
```

---

## 7.7 Notification Service

The Notification Service manages user notifications.

### Responsibilities

- Receive notification events.
- Store notifications.
- Deliver real-time notifications using Socket.IO.
- Provide notification history.
- Mark notifications as read.
- Support notification preferences if implemented.
- Support email notifications where required.
- Support notification retries for failed delivery.

### Main API Areas

```text
GET    /api/v1/notifications
GET    /api/v1/notifications/:notificationId
PATCH  /api/v1/notifications/:notificationId/read
PATCH  /api/v1/notifications/read-all
```

---

# 8. Kong API Gateway Plan

Kong Gateway will act as the single public entry point for backend APIs.

## 8.1 Kong Responsibilities

Kong will be configured to provide:

- Route requests to the correct microservice.
- Apply API-level rate limiting.
- Configure CORS.
- Record gateway access logs.
- Apply request-size limits where necessary.
- Support authentication-related gateway policies.
- Provide a central location for API routing configuration.
- Support future service scaling without changing client URLs.

## 8.2 Kong Must Not

Kong must not:

- Contain business logic.
- Decide whether a coordinator may verify a particular request.
- Decide whether a volunteer may update a particular task.
- Replace service-level RBAC.
- Trust client-provided organization roles.
- Access or modify business data directly.

## 8.3 Example Route Structure

```text
/api/v1/auth/*             -> user-service
/api/v1/users/*            -> user-service

/api/v1/organizations/*    -> organization-service

/api/v1/requests/*         -> request-service

/api/v1/tasks/*            -> task-service

/api/v1/resources/*        -> resource-service
/api/v1/donations/*        -> resource-service

/api/v1/volunteers/*       -> volunteer-service

/api/v1/notifications/*    -> notification-service
```

## 8.4 Kong Plugins

The initial Kong configuration should consider:

- CORS plugin.
- Rate Limiting plugin.
- Request Size Limiting plugin.
- Prometheus plugin if monitoring is implemented.
- Correlation ID plugin for distributed request tracing.
- Request logging plugin where appropriate.

Rate limits should be stricter for login, registration, password reset, and other abuse-prone endpoints.

---

# 9. Database and Multi-Tenancy Plan

## 9.1 Database Approach

ResQ Hub will initially use:

- One PostgreSQL database.
- Supabase as the managed database hosting platform.
- A shared database schema with clearly defined service ownership.
- `organization_id` as the primary tenant boundary for organization-owned records.

## 9.2 Tenant Isolation Rules

1. Users are global identities.
2. Users may belong to one or more organizations.
3. Organization membership determines the user's role within an organization.
4. Organization-owned records must contain `organization_id`.
5. Every tenant-scoped query must filter using the authenticated user's authorized organization.
6. The backend must not trust an `organization_id` supplied by the frontend without validation.
7. Users must not access records belonging to organizations where they have no valid membership.
8. Cross-tenant access must be covered by automated authorization tests.

## 9.3 Database Ownership

| Domain | Main Tables |
|---|---|
| User Service | users, user_addresses |
| Organization Service | organizations, memberships |
| Request Service | requests, request_attachments |
| Volunteer Service | volunteers, volunteer_availability, skills, volunteer_skills, certifications |
| Resource Service | resources, donations, inventory_transactions |
| Task Service | tasks, task_assignments, task_progress |
| Notification Service | notifications |
| Shared Platform | audit_logs |

## 9.4 Database Change Rules

- Database changes must be version-controlled.
- Schema changes must be reviewed by the team.
- Production changes must use migrations.
- Destructive changes require a backup and rollback plan.
- Database constraints must not be removed merely to make application code pass.
- Sensitive status changes should be recorded in audit logs.

---

# 10. Service-to-Service Communication

## 10.1 Synchronous Communication

REST APIs should be used when a service needs an immediate response.

Examples:

- Task Service checks volunteer information before assignment.
- Task Service retrieves request information when creating a task.
- Resource Service validates organization membership where required.
- Services retrieve user information when necessary.

## 10.2 Asynchronous Communication

Asynchronous events should be used for actions that do not require an immediate response.

Examples:

```text
request.verified
request.status.updated
donation.verified
donation.received
task.assigned
task.accepted
task.progress.updated
task.completed
inventory.low
```

The Notification Service can consume these events and create notifications.

## 10.3 Kafka Decision

Apache Kafka is not mandatory for the first implementation.

The initial implementation may use:

- Direct REST calls for essential synchronous communication.
- Socket.IO for real-time client notifications.
- An internal event abstraction or lightweight event mechanism for notification events.

Kafka may be introduced later if:

- Event volume becomes high.
- Multiple services require reliable event consumption.
- Event replay is required.
- The team has sufficient time to configure, test, monitor, and deploy it correctly.

The team should not introduce Kafka only because the architecture uses microservices.

---

# 11. Repository Structure

The project will maintain separate frontend and backend repositories.

```text
resq-hub/
├── resq-hub-backend/
│   ├── services/
│   │   ├── user-service/
│   │   ├── organization-service/
│   │   ├── request-service/
│   │   ├── task-service/
│   │   ├── resource-service/
│   │   ├── volunteer-service/
│   │   └── notification-service/
│   │
│   ├── gateway/
│   │   └── kong/
│   │
│   ├── shared/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── contracts/
│   │
│   ├── database/
│   │   ├── migrations/
│   │   └── schema/
│   │
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── package.json
│   └── .env.example/
│
└── resq-hub-frontend/
    ├── web/
    ├── mobile/
    ├── shared/
    └── README.md
```

---

# 12. Standard Microservice Structure

Each backend service should follow a consistent structure.

```text
service-name/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── middleware/
│   ├── validators/
│   ├── events/
│   ├── sockets/
│   ├── docs/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── security/
│
├── Dockerfile
├── package.json
├── .env.example
└── README.md
```

Each service must include:

- Health endpoint.
- Centralized error handling.
- Request validation.
- Authentication middleware.
- Role and organization authorization checks.
- Service-specific Swagger documentation.
- Unit tests.
- Integration tests.
- Dockerfile.
- Environment variable documentation.
- Structured logging.

---

# 13. Team Work Allocation

The project will be developed by three team members.

## Member 1 — Platform, User Service, Database, Integration, and Web Foundation

### Main Responsibilities

- User Service.
- Authentication and JWT implementation.
- User profile management.
- Database schema ownership.
- Supabase database configuration.
- Shared middleware and validation utilities.
- Kong Gateway configuration.
- Docker Compose configuration.
- GitHub Actions CI/CD.
- Web application foundation.
- Final integration.
- Deployment coordination.

## Member 2 — Organization, Request, and Resource Domains

### Main Responsibilities

- Organization Service.
- Organization memberships and roles.
- Request Service.
- Request verification workflow.
- Request attachments.
- Resource Service.
- Donation management.
- Inventory management.
- Inventory transactions.
- Related Swagger documentation and tests.
- Relevant web application pages.

## Member 3 — Volunteer, Task, Notification, and Mobile Domains

### Main Responsibilities

- Volunteer Service.
- Volunteer profiles, skills, certifications, and availability.
- Task Service.
- Volunteer assignment workflow.
- Task progress tracking.
- Notification Service.
- Socket.IO implementation.
- Flutter mobile application.
- Related Swagger documentation and tests.

## Shared Responsibilities

All members must contribute to:

- Requirement clarification.
- API contract review.
- Integration testing.
- System testing.
- Security testing.
- Documentation.
- Bug fixing.
- Final demonstration preparation.

---

# 14. Development Phases

## Phase 1 — Project Foundation

### Activities

- Confirm requirements and user stories.
- Finalize the database schema.
- Finalize service boundaries.
- Create frontend and backend repositories.
- Configure GitHub Projects or ClickUp.
- Create branch protection rules.
- Define API naming conventions.
- Create OpenAPI contracts.
- Configure environment templates.
- Create Docker development environment.

### Completion Gate

- Repositories are available.
- Service ownership is documented.
- Database schema is approved.
- API contracts are available.
- All services can be scaffolded and run locally.

---

## Phase 2 — Platform and Authentication Foundation

### Activities

- Implement User Service.
- Implement registration.
- Implement login.
- Implement password hashing.
- Implement JWT generation.
- Implement authentication middleware.
- Implement role authorization middleware.
- Implement organization-aware authorization.
- Configure Kong routes.
- Create web and mobile authentication interfaces.

### Completion Gate

A user can register, log in, receive a JWT, access protected endpoints, and be prevented from accessing unauthorized resources.

---

## Phase 3 — Core Domain Development

### Activities

- Implement Organization Service.
- Implement Request Service.
- Implement Resource Service.
- Implement Volunteer Service.
- Implement Task Service.
- Implement Notification Service.
- Implement database access layers.
- Add validation.
- Add unit tests.
- Add Swagger documentation.

### Completion Gate

Each service can run independently, pass its tests, expose a health endpoint, and provide documented APIs.

---

## Phase 4 — Frontend Development

### Web Application

- Login and registration.
- Coordinator dashboard.
- Organization management.
- Request management.
- Donation management.
- Inventory management.
- Volunteer management.
- Task management.
- Reports and monitoring.

### Mobile Application

- Login and registration.
- Community request submission.
- Request status tracking.
- Donation submission.
- Volunteer profile.
- Availability management.
- Task viewing.
- Task response and progress updates.
- Notification interface.

### Completion Gate

The main user journeys are accessible through the appropriate web and mobile interfaces.

---

## Phase 5 — Integration

### Activities

- Integrate all services through Kong.
- Integrate web application APIs.
- Integrate mobile application APIs.
- Integrate Socket.IO notifications.
- Validate JWT handling across services.
- Validate tenant isolation.
- Validate role-based access.
- Resolve API contract mismatches.

### Completion Gate

The main end-to-end workflows operate successfully.

---

## Phase 6 — Testing and Quality Assurance

### Activities

- Unit testing.
- API integration testing.
- Service integration testing.
- System testing.
- Security testing.
- Tenant isolation testing.
- Role authorization testing.
- Usability testing.
- Performance testing.
- Load testing.
- Bug fixing and regression testing.

### Completion Gate

Critical workflows pass testing and no unresolved critical defects remain.

---

## Phase 7 — Deployment

### Activities

- Create production Docker images.
- Configure AWS infrastructure.
- Configure Kubernetes manifests.
- Configure secrets.
- Configure production environment variables.
- Deploy Kong.
- Deploy backend services.
- Connect to Supabase PostgreSQL.
- Deploy web application.
- Build and release the mobile application.
- Configure monitoring and logging.
- Test rollback procedures.

### Completion Gate

The production environment is operational and the complete system can be accessed through the public application.

---

# 15. Proposed Development Schedule

## Week 1 — Foundation and Architecture

- Finalize user stories.
- Finalize service boundaries.
- Review database schema.
- Create repositories.
- Configure GitHub branches.
- Configure ClickUp tasks.
- Prepare OpenAPI contracts.
- Scaffold backend services.

**Gate:** All services have folders, health endpoints, package configuration, and Dockerfiles.

## Week 2 — Authentication and Organization

- Implement registration.
- Implement login.
- Implement JWT authentication.
- Implement user profiles.
- Implement organizations.
- Implement memberships and roles.
- Configure initial Kong routes.
- Build login interfaces.

**Gate:** Users can register, log in, and access protected routes.

## Week 3 — Requests and Resources

- Implement request creation.
- Implement request verification.
- Implement request status tracking.
- Implement request attachments.
- Implement resource CRUD.
- Implement donation creation.
- Implement inventory transactions.

**Gate:** Community requests and donation workflows are functional.

## Week 4 — Volunteers and Tasks

- Implement volunteer profiles.
- Implement skills and certifications.
- Implement availability.
- Implement task creation.
- Implement volunteer assignment.
- Implement assignment acceptance and rejection.
- Implement task progress.

**Gate:** Coordinators can assign volunteers and volunteers can update task progress.

## Week 5 — Notifications and 50% Milestone

- Implement Notification Service.
- Configure Socket.IO.
- Integrate notifications.
- Build coordinator dashboard.
- Build main mobile workflows.
- Integrate core APIs.
- Review SRS and design documents.

**Gate:** At least 50% of the project is functional and the core workflows are demonstrable.

## Week 6 — Full Frontend and Integration

- Complete web modules.
- Complete mobile modules.
- Integrate all services through Kong.
- Integrate web application.
- Integrate mobile application.
- Resolve API contract issues.

**Gate:** Main user journeys work end to end.

## Week 7 — Testing and Optimization

- Complete unit tests.
- Complete integration tests.
- Perform system testing.
- Perform authorization testing.
- Perform tenant isolation testing.
- Perform usability testing.
- Optimize database queries.
- Fix defects.

**Gate:** Critical workflows are stable.

## Week 8 — Deployment and Finalization

- Configure CI/CD.
- Build production images.
- Deploy to AWS.
- Configure Kubernetes.
- Validate production environment.
- Perform beta testing.
- Complete final documentation.
- Prepare final demonstration.

**Gate:** The system is deployed, tested, documented, and ready for evaluation.

---

# 16. Git Workflow

## 16.1 Branches

```text
main
develop
feature/user-login
feature/request-verification
feature/volunteer-profile
feature/task-assignment
fix/request-status-validation
docs/update-api-contract
```

## 16.2 Rules

- `main` contains production-ready code.
- `develop` contains the latest integrated development code.
- New work must be created in feature branches.
- Direct pushes to `main` should be prevented.
- Pull requests must be reviewed before merging.
- CI checks must pass before merging.
- Large unrelated changes must not be included in one pull request.

## 16.3 Commit Format

```text
feat(user): implement login endpoint
feat(request): add request verification
fix(task): prevent duplicate volunteer assignments
test(resource): add inventory transaction tests
docs(api): update donation endpoints
chore(docker): update service health checks
```

---

# 17. CI/CD Plan

## 17.1 Pull Request Pipeline

On every pull request:

1. Install dependencies.
2. Run linting.
3. Run unit tests.
4. Run integration tests where available.
5. Validate OpenAPI documentation.
6. Build affected services.
7. Build Docker images.
8. Report failures.

## 17.2 Main Branch Pipeline

After merging into `main`:

1. Run the full test suite.
2. Build versioned Docker images.
3. Push images to the selected container registry.
4. Deploy to the staging environment.
5. Run smoke tests.
6. Require approval for production deployment.
7. Deploy updated Kubernetes workloads.
8. Verify service health.
9. Monitor logs and error rates.

## 17.3 Deployment Safety

- Production secrets must be stored securely.
- Secrets must not be committed to GitHub.
- Database migrations must run before dependent application changes.
- Deployment must support rollback.
- Health checks must be used before routing traffic to new service instances.

---

# 18. Testing Strategy

## 18.1 Unit Testing

Test:

- Business logic.
- Validation logic.
- Status transitions.
- Authorization helpers.
- Inventory calculations.
- Task assignment rules.

## 18.2 Integration Testing

Test:

- API routes.
- Database operations.
- Authentication middleware.
- Authorization middleware.
- Service interactions.
- Kong routing.

## 18.3 System Testing

Test complete workflows such as:

1. Community member registers.
2. Community member submits a request.
3. Coordinator verifies the request.
4. Coordinator creates a task.
5. Coordinator assigns a volunteer.
6. Volunteer receives a notification.
7. Volunteer accepts the task.
8. Volunteer updates progress.
9. Coordinator marks the request as fulfilled.

## 18.4 Security Testing

Test:

- Invalid JWTs.
- Expired JWTs.
- Missing authentication.
- Unauthorized role access.
- Cross-organization access attempts.
- SQL injection protection.
- Invalid input.
- Excessive login attempts.
- File upload validation.

## 18.5 Performance Testing

Test:

- Concurrent request creation.
- High notification volume.
- Inventory update concurrency.
- API response times.
- Database query performance.
- Gateway rate limiting.

---

# 19. Security Plan

The system must implement:

- Password hashing using a secure algorithm such as bcrypt.
- JWT authentication.
- Role-based access control.
- Organization-based tenant authorization.
- Input validation.
- Centralized error handling.
- Secure HTTP headers.
- CORS restrictions.
- Rate limiting through Kong.
- File type and file size validation.
- Environment-based secrets.
- Audit logging for sensitive actions.
- HTTPS in production.
- Database backups.

Sensitive actions that should be audited include:

- Request verification.
- Donation verification.
- Inventory adjustments.
- Volunteer assignment.
- Role changes.
- Organization membership changes.
- Account suspension.

---

# 20. Docker Plan

Every backend service must have:

- A Dockerfile.
- A service-specific environment configuration.
- A health endpoint.
- A defined internal port.
- A Docker Compose configuration.

Example local environment:

```text
Kong Gateway
├── user-service
├── organization-service
├── request-service
├── task-service
├── resource-service
├── volunteer-service
└── notification-service
```

Only Kong should expose a public API port. Internal services should communicate through the private Docker network.

---

# 21. Kubernetes Deployment Plan

The final deployment target will use Kubernetes.

Each service should have:

- Deployment.
- Service.
- ConfigMap where appropriate.
- Secret references.
- Readiness probe.
- Liveness probe.
- Resource requests.
- Resource limits.

Kubernetes should support:

- Multiple replicas for high-demand services.
- Rolling updates.
- Service recovery.
- Internal service discovery.
- Horizontal scaling where required.

Initial scaling priority:

1. Kong Gateway.
2. User Service.
3. Request Service.
4. Notification Service.
5. Resource Service.

---

# 22. AWS Deployment Plan

The proposed AWS deployment includes:

- Kubernetes cluster or managed Kubernetes environment.
- Container registry for Docker images.
- Load balancing for public traffic.
- Secure secret management.
- Cloud logging and monitoring.
- Supabase PostgreSQL as the managed database.

The final AWS configuration may be adjusted according to available academic credits, free-tier limits, and project requirements.

---

# 23. Risk Management

| Risk | Impact | Mitigation |
|---|---|---|
| Sudden traffic spikes during emergencies | High | Kong rate limiting, horizontal scaling, optimized queries, caching after measurement, load testing |
| Database overload | High | Indexing, connection pooling, query optimization, monitoring, backups |
| Unauthorized access | High | JWT validation, RBAC, tenant checks, secure password hashing |
| Cross-tenant data exposure | High | Mandatory organization filtering and automated tenant isolation tests |
| Service failure | Medium/High | Health checks, container restart policies, Kubernetes replicas |
| API integration failures | Medium | OpenAPI contracts, versioning, integration tests |
| Team integration conflicts | Medium | Clear ownership, pull requests, regular integration |
| Data loss | High | Supabase backups and migration controls |
| Notification delivery failure | Medium | Persistent notification records and retry mechanisms |
| Scope expansion | Medium | Prioritized backlog and approval before adding major features |
| Deployment failure | Medium | Staging environment, health checks, rollback plan |
| Poor connectivity in affected areas | Medium | Low-bandwidth interfaces and future offline synchronization support |

---

# 24. Definition of Done

A feature is complete only when:

- Requirements are understood.
- API contracts are updated.
- Backend logic is implemented.
- Input validation is implemented.
- Authentication and authorization are applied.
- Tenant isolation is enforced where required.
- Unit tests pass.
- Integration tests pass where applicable.
- Swagger documentation is updated.
- Docker build succeeds.
- Environment variables are documented.
- The frontend or mobile interface is integrated where required.
- The pull request is reviewed.
- No critical defects remain.

---

# 25. Final Acceptance Criteria

ResQ Hub will be considered ready for final evaluation when:

1. Users can register and log in securely.
2. Organization memberships and roles are enforced.
3. Community members can submit and track requests.
4. Coordinators can verify requests.
5. Donors can submit and track donations.
6. Coordinators can manage inventory.
7. Volunteers can manage profiles and availability.
8. Coordinators can assign volunteers to tasks.
9. Volunteers can accept assignments and update progress.
10. Notifications are delivered and stored.
11. Web and mobile applications communicate through Kong.
12. Services run successfully in Docker.
13. Core workflows pass system testing.
14. Tenant isolation is verified.
15. Role-based authorization is verified.
16. API documentation is complete.
17. CI checks pass.
18. The application is deployed successfully.
19. Final reports and technical documentation are complete.

---

# 26. Team Operating Rules

1. Read this plan before beginning a new feature.
2. Confirm the owning microservice before writing code.
3. Do not modify another member's service without discussion.
4. Do not change the database schema without team review.
5. Do not change Kong routes without informing the integration owner.
6. Do not commit secrets.
7. Do not bypass authorization checks to make testing easier.
8. Do not trust roles or organization identifiers sent by the frontend.
9. Do not expose internal services publicly.
10. Do not merge code with failing tests.
11. Keep pull requests focused.
12. Update documentation when behavior changes.
13. Integrate frequently rather than waiting until the final week.
14. Test the complete workflow after integrating related services.

---

# 27. Conclusion

ResQ Hub will be developed as a secure, modular, multi-tenant community resilience platform using independently deployable backend services. Kong Gateway will provide centralized API routing and gateway-level traffic controls, while business authorization remains within the relevant microservices.

The use of PostgreSQL hosted through Supabase, Docker for consistent development, Kubernetes for scalable deployment, GitHub Actions for CI/CD, and AWS for hosting provides a practical architecture that supports both the academic project requirements and future expansion.

The project will prioritize the core emergency coordination workflow:

```text
User Registration
        ↓
Assistance Request
        ↓
Coordinator Verification
        ↓
Task Creation
        ↓
Volunteer Assignment
        ↓
Volunteer Acceptance
        ↓
Task Progress
        ↓
Request Fulfilment
        ↓
Notification and Audit History
```

All development activities should follow the service ownership, security, testing, integration, and deployment rules defined in this document.
