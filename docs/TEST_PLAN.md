# ResQ Hub — Community Resilience & Resource Coordination Platform
## Master Test Plan (Iteration 3 / Final Release)

**Document Identifier:** RUP-STP-2026-V1.0  
**Version:** 1.0  
**Status:** Approved for Iteration Execution  
**Project:** ResQ Hub — Resource Coordination Platform for Community Resilience  
**Academic Context:** Semester 5 Software Engineering Project (Group 09 / Team 14)  

---

### Revision History

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 15/Sep/2026 | 0.1 | Initial draft of Test Mission, Motivation, and Target Test Items | Team Member 1 (Lead QA / Backend) |
| 18/Sep/2026 | 0.5 | Added Functional, UI, and Database Integrity testing specifications | Team Member 2 (Functional & UI Specialist) |
| 21/Sep/2026 | 0.8 | Added Performance, Security, Failover, Configuration, and Risk Matrix | Team Member 3 (Performance & Security Specialist) |
| 24/Sep/2026 | 1.0 | Consolidated Master Test Plan, verified traceability, and finalized team work division | Team Member 1, Team Member 2, Team Member 3 |

---

### Team Work Division & Responsibility Allocation Matrix

To guarantee rigorous quality assurance, accountability, and parallel test execution, the work required for this Test Plan document and its subsequent implementation is evenly distributed among three team members according to technical specializations:

| Team Member | Primary QA Role | Document Section Ownership | Testing & Implementation Responsibilities | Tools & Artifacts Owned |
| :--- | :--- | :--- | :--- | :--- |
| **Team Member 1** | **Lead QA Engineer & Backend/Failover Specialist** | • **Section 1**: Evaluation Mission & Motivation<br>• **Section 2**: Target Test Items<br>• **Section 3.1.7**: Failover & Recovery Testing | • Authoring core testing mission and architectural test items.<br>• Simulating database crash, network severance, and disaster recovery procedures.<br>• Verifying Docker container lifecycle, service-level persistence, and failover orchestration. | • Docker Desktop / Compose<br>• Chaos disruption scripts<br>• Supabase CLI & PITR tools |
| **Team Member 2** | **Functional, UI/UX, Data Integrity & Integration Specialist** | • **Section 3.1.1**: Data & Database Integrity Testing<br>• **Section 3.1.2**: Function Testing<br>• **Section 3.1.3**: User Interface Testing<br>• **Section 3.1.8**: Configuration Testing<br>• **Section 4**: Deliverables (4.1 & 4.2) | • Designing PostgreSQL schema integrity, RLS, and transaction boundary test scripts.<br>• Specifying end-to-end functional use-case tests (Citizen requests, Coordinator dispatch, Volunteer missions, Handover OTP).<br>• Designing React Web Dashboard and Flutter Mobile UI test cases.<br>• Validating multi-device screen responsiveness, cross-browser compatibility, and producing Test Evaluation Summaries & Coverage reports. | • Supabase SQL Editor / CLI<br>• DBeaver / pgAdmin 4<br>• Node.js database seeding scripts (`seed.js`)<br>• Jest & Supertest<br>• React Testing Library<br>• Flutter Driver / Patrol<br>• Postman / Newman CLI<br>• Istanbul / NYC Coverage Reporter |
| **Team Member 3** | **Performance, Security & DevOps Test Specialist** | • **Section 3.1.4**: Performance Profiling<br>• **Section 3.1.5**: Load Testing<br>• **Section 3.1.6**: Security & Access Control Testing<br>• **Section 5**: Risks, Dependencies, Assumptions & Constraints<br>• **Section 6**: References | • Designing Kong API Gateway rate-limiting (300 req/min) and CORS policy tests.<br>• Constructing k6 / Locust load and stress test workloads for peak disaster simulation.<br>• Pen-testing JWT authentication, RBAC boundaries, and organization tenant isolation.<br>• Formulating risk mitigation matrices, contingency triggers, and formal academic references. | • k6 / Artillery<br>• Locust Load Tester<br>• OWASP ZAP / Burp Suite<br>• Kong Admin API & Access Logs<br>• GitHub Actions CI/CD |

---

### Table of Contents

1. [Evaluation Mission and Test Motivation](#1-evaluation-mission-and-test-motivation)
   - 1.1 Background and Problem Domain
   - 1.2 Evaluation Mission
   - 1.3 Key Quality Goals and Motivators
2. [Target Test Items](#2-target-test-items)
   - 2.1 Core Microservices (Target of Test)
   - 2.2 API Gateway and Network Infrastructure
   - 2.3 Database and Persistence Layer
   - 2.4 Client Interfaces (Web and Mobile)
   - 2.5 Shared Libraries and Cross-Cutting Concerns
   - 2.6 Target Test Items Classification & Priority Matrix
3. [Test Approach](#3-test-approach)
   - 3.1 Testing Techniques and Types
     - 3.1.1 Data and Database Integrity Testing
     - 3.1.2 Function Testing
     - 3.1.3 User Interface Testing
     - 3.1.4 Performance Profiling
     - 3.1.5 Load Testing
     - 3.1.6 Security and Access Control Testing
     - 3.1.7 Failover and Recovery Testing
     - 3.1.8 Configuration Testing
   - 3.2 Fault and Failure Models
4. [Deliverables](#4-deliverables)
   - 4.1 Test Evaluation Summaries
   - 4.2 Reporting on Test Coverage
   - 4.3 Incident and Defect Tracking Artifacts
5. [Risks, Dependencies, Assumptions, and Constraints](#5-risks-dependencies-assumptions-and-constraints)
   - 5.1 Risk Assessment and Mitigation Matrix
   - 5.2 Environmental and External Dependencies
   - 5.3 System Assumptions
   - 5.4 Operational and Architectural Constraints
6. [References](#6-references)

---

# 1. Evaluation Mission and Test Motivation

### 1.1 Background and Problem Domain
ResQ Hub is an enterprise-grade, multi-tenant community resilience and emergency resource coordination platform. During natural and human-induced humanitarian emergencies (such as urban flooding, monsoon landslides, and local community crises), disaster response operations frequently suffer from:
- Critical communication breakdowns between affected citizens and relief coordinators.
- Severe inventory visibility gaps, causing catastrophic over-allocation or stock exhaustion of critical provisions (water, medical supplies, dry rations).
- Disorganized, unverified volunteer dispatching that introduces civilian safety hazards and operational bottlenecks.
- Fraudulent or phantom donation claims and unverifiable relief aid distribution.

To eliminate these points of failure, ResQ Hub introduces a distributed microservices architecture consisting of **seven dedicated backend services** (`user-service`, `organization-service`, `resource-service`, `request-service`, `task-service`, `volunteer-service`, `notification-service`), fronted by **Kong API Gateway**, backed by an enterprise **PostgreSQL (Supabase)** database, and interfaced via a **React 18 Coordinator Dashboard** and a **Flutter Mobile Application** for field responders and citizens.

Because ResQ Hub is designated for life-critical disaster coordination where software crashes, security vulnerabilities, or data loss directly jeopardize humanitarian relief, testing must not be treated as a retrospective check. It must serve as a rigorous engineering validation mechanism verifying data correctness, operational resilience, and rapid recovery under extreme environmental strain.

### 1.2 Evaluation Mission
The primary mission of the Iteration 3 evaluation effort is to:
1. **Uncover Critical Architectural & Integration Defects:** Identify state synchronization failures across microservices, specifically around the request-task-inventory lifecycle (e.g., race conditions during task dispatch, double allocation of warehouse stock, and premature completion).
2. **Assess Perceived Quality & Operational Risks:** Determine the system's ability to maintain transactional consistency across multi-tenant boundaries and ensure that organization coordinators never access or alter cross-tenant records.
3. **Verify Compliance with Functional and Non-Functional Specifications:** Validate all implemented user stories against the approved Software Requirements Specification (SRS) and System Architecture Document (SAD).
4. **Certify Core Security & Anti-Fraud Mechanisms:** Ensure absolute verification of the dynamic 4-Digit Handover Security PIN (OTP) protocol between field volunteers, donors, and affected citizens before inventory transactions are permanently committed.
5. **Satisfy Stakeholder and Process Mandates:** Satisfy the quality criteria established by academic evaluation benchmarks (Semester 5 Software Engineering specifications), ISO/IEC/IEEE 29119 software testing standards, and Rational Unified Process (RUP) guidelines.

### 1.3 Key Quality Goals and Motivators
| Quality Dimension | Motivational Driver | Target Threshold |
| :--- | :--- | :--- |
| **Reliability & Data Integrity** | Zero data corruption or orphaned foreign references during concurrent transaction spikes. | 100% ACID compliance on Supabase database writes; 0 orphaned transaction logs. |
| **Security & Tenant Isolation** | Strict prevention of privilege escalation and cross-organization data leakage. | Zero unauthorized cross-tenant data leaks; 100% verification of JWT RBAC policies. |
| **Performance & Responsiveness** | Rapid UI feedback for coordinators handling emergency triage and volunteers on scene. | Gateway response time < 350 ms for 95% of standard requests under normal load. |
| **Availability & Fault Recovery** | Seamless recovery of mission status and volunteer locations following simulated crashes. | Mean Time to Recovery (MTTR) < 60 seconds; 0% unrecoverable data loss. |

---

# 2. Target Test Items

The listing below identifies all target test items across the ResQ Hub ecosystem. Testing encompasses custom application code, architectural gateways, hosted database infrastructure, and supporting external dependencies.

### 2.1 Core Microservices (Target of Test)
1. **User Service (`crp-user-service` :3001):** User authentication, password hashing, JWT token issuance, user profile CRUD, global roles (`USER`, `VOLUNTEER`, `SUPER_ADMIN`), and account state management (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING`).
2. **Organization Service (`crp-organization-service` :3002):** Multi-tenant organization onboarding, branch management, coordinator memberships, and role assignments (`COORDINATOR`, `ORGANIZATION_ADMIN`).
3. **Resource Service (`crp-resource-service` :3003):** Donation ingestion, donor verification, warehouse inventory management, stock level audits, real-time stock balance validation (`POST /check-stock`), and inventory ledger tracking (`inventory_transactions`).
4. **Request Service (`crp-request-service` :3004):** Citizen assistance requests, duplicate request filtration, urgency scoring (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), request lifecycle status transitions (`PENDING`, `VERIFIED`, `REJECTED`, `ASSIGNED`, `IN_PROGRESS`, `FULFILLED`, `CANCELLED`), and location tagging.
5. **Task Service (`crp-task-service` :3005):** Volunteer relief mission creation, exact tag binding (`[REQUEST_ID:uuid]`, `[DONATION_ID:uuid]`), mission progress state machine (0%, 50% En Route, 75% On Scene, 100% Completed), dynamic 4-Digit Handover Security PIN generation/verification, and automated inventory auto-crediting (`STOCK_IN`) and auto-deduction (`STOCK_OUT`).
6. **Volunteer Service (`crp-volunteer-service` :3006):** Volunteer registration, skill profiles, disaster certification records, live availability status (`AVAILABLE`, `BUSY`, `UNAVAILABLE`), and mission badge rewards.
7. **Notification Service (`crp-notification-service` :3007):** Real-time Socket.IO room dispatching, in-app notification status tracking (`UNREAD`, `READ`, `ARCHIVED`), and event broadcasting across web and mobile clients.

### 2.2 API Gateway and Network Infrastructure
1. **Kong API Gateway (`crp-kong` :3000):** Declarative configuration (`kong.yml`), dynamic route mapping (`/api/v1/*`), regex CORS validation (`origins: [".*"]`), rate-limiting enforcement (300 requests/minute), unique correlation ID generation (`X-Correlation-ID`), and JWT header forwarding.
2. **Docker Network Bridge (`crp-network`):** Inter-container DNS resolution, internal port isolation, and host port forwarding.

### 2.3 Database and Persistence Layer
1. **Supabase PostgreSQL Instance:** Database schema (`resource_coordination_platform_schema.sql`), custom ENUM types (`user_status`, `global_role`, `organization_role`, `request_status`, `urgency_level`, `task_status`, `delivery_method`, `inventory_transaction_type`), foreign key cascades, triggers, unique constraints, and PostgreSQL Row-Level Security (RLS) policies.

### 2.4 Client Interfaces (Web and Mobile)
1. **Coordinator Web Dashboard (`frontend` :5173):** React 18 + Vite SPA, TanStack Query state cache, TanStack Router, TailwindCSS UI components, 3-Tier Inventory Management Dashboard, Help Request triage console, and Donation Acceptance console.
2. **ResQ Hub Mobile Application (`resq_hub_mobile`):** Flutter multi-platform application (Android / Web), Dio HTTP client, secure token storage (`SharedPreferences`), 5-step citizen request wizard, donor tracking timeline, volunteer tactical mission console, and dynamic Handover Security PIN modal.

### 2.5 Shared Libraries and Cross-Cutting Concerns
1. **Shared Middleware Package (`@crp/shared-middleware`):** Reusable Express middleware for JWT decoding, cryptographic signature verification, role-based authorization (RBAC), organization tenant extraction (`x-organization-id`), and uniform error handling.

### 2.6 Target Test Items Classification & Priority Matrix

| Category | Item Name | Subsystem / Location | Criticality / Priority | Assigned Owner |
| :--- | :--- | :--- | :--- | :--- |
| **Microservice** | `task-service` | `services/task-service` | **Critical (P1)** | Team Member 1 |
| **Microservice** | `resource-service` | `services/resource-service` | **Critical (P1)** | Team Member 1 |
| **Microservice** | `request-service` | `services/request-service` | **High (P2)** | Team Member 2 |
| **Microservice** | `user-service` | `services/user-service` | **High (P2)** | Team Member 3 |
| **Microservice** | `organization-service`| `services/organization-service`| **High (P2)** | Team Member 1 |
| **Microservice** | `volunteer-service` | `services/volunteer-service` | **Medium (P3)** | Team Member 2 |
| **Microservice** | `notification-service`| `services/notification-service`| **Medium (P3)** | Team Member 3 |
| **Gateway** | Kong API Gateway | `api-gateway/kong` | **Critical (P1)** | Team Member 3 |
| **Database** | Supabase PostgreSQL | Remote Cloud / Schema SQL | **Critical (P1)** | Team Member 2 |
| **Client UI** | Coordinator Web App | `frontend/src` | **High (P2)** | Team Member 2 |
| **Client UI** | Mobile Flutter App | `resq_hub_mobile/lib` | **High (P2)** | Team Member 2 |
| **Shared Lib** | `@crp/shared-middleware`| `packages/shared-middleware` | **Critical (P1)** | Team Member 3 |

---

# 3. Test Approach

The testing approach presents the overarching strategy for validating the ResQ Hub platform across unit, integration, system, and acceptance tiers. Testing will combine automated test suites integrated into the developer workflow and CI/CD pipelines with structured manual scenario testing for exploratory, UI/UX, and failover validation.

All test procedures are driven by explicit **Pass/Fail Criteria**, concrete **Fault Models**, and verifiable **Oracles**. As defined in Section 10 of the Rational Unified Process, team responsibilities, environmental configs, and specialized tools are strictly aligned to each technique.

```
                           +-------------------------------------+
                           |      User Acceptance Testing        |
                           |   (Stakeholder & Field Scenarios)   |
                           +------------------+------------------+
                                              |
                               +--------------v---------------+
                               |   System & Security Testing   |
                               | (Load, Failover, OWASP ZAP)  |
                               +--------------+---------------+
                                              |
                               +--------------v---------------+
                               |  End-to-End API Integration  |
                               |  (Kong Gateway + Supertest)  |
                               +--------------+---------------+
                                              |
                               +--------------v---------------+
                               |     Service Unit Testing     |
                               | (Jest Mocks & Business Logic)|
                               +------------------------------+
```

---

## 3.1 Testing Techniques and Types

### 3.1.1 Data and Database Integrity Testing

The database and persistence mechanisms must be validated as an independent subsystem. Tests verify that constraints, cascading deletes, foreign keys, and PostgreSQL triggers function correctly without relying on client UI validation.

| Attribute | Specification |
| :--- | :--- |
| **Technique Objective** | Exercise database access methods, triggers, foreign key integrity, and RLS policies independent of the UI to observe and log schema constraint violations, unauthorized data leakage, or data corruption. |
| **Technique** | • Directly invoke Supabase/PostgreSQL stored functions and triggers using isolated database connection pools.<br>• Execute data-seeding scripts (`seed.js`) inserting valid and invalid records (e.g., negative quantities in `inventory`, invalid UUIDs, orphaned `organization_id` foreign keys).<br>• Verify that Row Level Security (RLS) properly isolates records when queried using the anon public key versus the privileged `service_role` key.<br>• Validate transactional atomicity: trigger concurrent updates to `inventory` and verify that parallel `STOCK_OUT` operations never result in negative stock balances. |
| **Oracles** | • SQL error codes `23503` (foreign_key_violation), `23505` (unique_violation), and `23514` (check_violation) raised upon invalid inserts.<br>• Supabase query snapshots verifying zero unlinked rows (`orphan records`) across `task_assignments`, `requests`, and `donations`.<br>• Database audit ledger (`inventory_transactions`) balances mathematically match the formula: `Opening_Balance + SUM(STOCK_IN) - SUM(STOCK_OUT) = Current_Stock`. |
| **Required Tools** | • PostgreSQL CLI (`psql`) & Supabase Management Studio<br>• DBeaver Enterprise / pgAdmin 4<br>• Custom database test seeders (`database/seeds/test_data.sql`)<br>• Jest with direct `pg` / `@supabase/supabase-js` client runners |
| **Success Criteria** | • 100% of defined schema constraints, check validations, and ENUM types reject invalid inputs.<br>• All multi-row updates across `tasks`, `requests`, and `inventory_transactions` execute atomically within an isolated transaction boundary. |
| **Special Considerations**| • Direct database manipulation must be executed on a dedicated staging database branch, never on the production Supabase instance.<br>• RLS bypass tests must explicitly test the architectural boundary between `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` to prevent recurrence of silent update rejections. |

---

### 3.1.2 Function Testing

Function testing focuses on black-box and grey-box verification of business logic, domain rules, and use-case scenarios traced directly to the SRS and Project Development Plan.

| Attribute | Specification |
| :--- | :--- |
| **Technique Objective** | Exercise target-of-test functionality across microservices, including request submission, coordinator triage, mission dispatching, Handover PIN verification, and inventory auto-crediting to observe and log system behavior. |
| **Technique** | • Execute automated API test suites using Jest and Supertest targeting both individual microservice endpoints and public Kong Gateway routes (`http://localhost:3000/api/v1/*`).<br>• Verify **Flow A (Citizen Help Request Lifecycle)**: Citizen submits request $\rightarrow$ Status `PENDING` $\rightarrow$ Coordinator reviews & verifies $\rightarrow$ Status `VERIFIED` $\rightarrow$ Task dispatched with `[REQUEST_ID:uuid]` $\rightarrow$ Volunteer claims mission $\rightarrow$ Status `ASSIGNED` $\rightarrow$ Milestones updated (50% En Route, 75% On Scene) $\rightarrow$ Handover 4-digit PIN generated $\rightarrow$ Volunteer inputs PIN $\rightarrow$ Task marked `COMPLETED`, Request marked `FULFILLED`, Inventory deducted (`STOCK_OUT`).<br>• Verify **Flow B (Donation Lifecycle)**: Donor submits offer $\rightarrow$ Coordinator accepts $\rightarrow$ Volunteer pickup task dispatched $\rightarrow$ Milestones reached $\rightarrow$ Handover PIN verified $\rightarrow$ Donation marked `COMPLETED` $\rightarrow$ Warehouse inventory auto-incremented (`STOCK_IN`).<br>• Verify **Flow C (Stock Sufficiency Rules)**: Validate that `POST /api/v1/inventory/check-stock` prevents task dispatch when requested quantity exceeds available warehouse stock. |
| **Oracles** | • HTTP status codes adhere to REST standards: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.<br>• Response payload structures conform exactly to OpenAPI specifications (`resource-coordination-api.yaml`).<br>• State machine transition validation: verify that illegal transitions (e.g., claiming a task directly from `COMPLETED` or completing without OTP verification) return `400 Bad Request`. |
| **Required Tools** | • Jest & Supertest automation test runners<br>• Postman Test Suites & Newman CLI for automated regression execution<br>• OpenAPI Validator for contract schema validation |
| **Success Criteria** | • 100% of core happy-path and negative-path functional use-cases pass without regression.<br>• All business rule boundaries (e.g., duplicate request detection, stock deficit blocking, exact tag matching) execute with zero false positives. |
| **Special Considerations**| • Functional tests must mock external third-party boundaries (such as Twilio SMS or external SMTP) while keeping the database persistence layer live in staging to verify cross-service data propagation. |

---

### 3.1.3 User Interface Testing

User Interface (UI) testing verifies that the web and mobile applications provide intuitive, standards-compliant, and error-tolerant navigation for coordinators, field volunteers, and citizens.

| Attribute | Specification |
| :--- | :--- |
| **Technique Objective** | Exercise navigation, input controls, dynamic form validations, modal state machines, and real-time UI components to observe standards conformance and responsive visual behavior. |
| **Technique** | • **React Web Coordinator Dashboard (`frontend`):** Execute component and integration tests on the Help Requests triage table, Donations approval modal, and 3-Tier Inventory Management Dashboard. Verify that the Stock Sufficiency badge updates dynamically (Green: `In Stock: X | Requested: Y`, Red: `Shortage: -Z` with disabled dispatch button).<br>• **Flutter Mobile App (`resq_hub_mobile`):** Execute Flutter widget and integration tests across Android and Web viewports. Validate the 5-step citizen request wizard, donor tracking timeline, volunteer mission feeds, and tactical console.<br>• **Handover Security PIN Card UI Behavior:** Verify that the 4-Digit Handover Security PIN Card appears on the requester/donor screen only upon volunteer arrival on scene (75% milestone), and is completely unmounted/removed (`SizedBox.shrink()`) once the mission reaches 100% completion. |
| **Oracles** | • Zero unhandled JavaScript console exceptions or Flutter rendering overflow errors (`RenderFlex overflowed`).<br>• UI components accurately mirror backend database states within 500 ms of update.<br>• Strict adherence to design tokens: color-coded status badges (`PENDING` = Amber, `VERIFIED` = Blue, `IN_PROGRESS` = Purple, `COMPLETED`/`FULFILLED` = Green, `REJECTED` = Red). |
| **Required Tools** | • React Testing Library & Vitest for Web Coordinator frontend<br>• Flutter Driver, Patrol, and Flutter Test SDK for mobile<br>• Chrome DevTools (Lighthouse & Mobile Device Emulation) |
| **Success Criteria** | • All critical UI workflows complete smoothly across mobile screen resolutions (360x640, 412x915) and desktop viewports (1280x720, 1920x1080).<br>• Zero visual regression on the Handover PIN modal and 3-Tier Inventory table. |
| **Special Considerations**| • Mobile testing must account for dynamic IP switching (`ApiClient.updateBaseUrl`) when testing on physical Android devices over local Wi-Fi versus the Android Emulator loopback (`10.0.2.2:3000`). |

---

### 3.1.4 Performance Profiling

Performance profiling measures endpoint latency, database query execution times, resource consumption, and gateway throughput under anticipated operating workloads.

| Attribute | Specification |
| :--- | :--- |
| **Technique Objective** | Profile response times, memory footprint, CPU utilization, and database query latency for mission-critical transactions under normal and peak disaster workloads to identify bottlenecks. |
| **Technique** | • Measure baseline single-user latency for primary API endpoints through Kong Gateway.<br>• Execute automated profiling scripts simulating 50 concurrent coordinators triaging requests while 100 field volunteers submit live tactical milestone updates.<br>• Monitor Node.js V8 heap allocation and garbage collection pauses across all microservice containers.<br>• Profile PostgreSQL query execution plans using `EXPLAIN ANALYZE` on heavily queried tables (`tasks`, `requests`, `inventory`, `inventory_transactions`). |
| **Oracles** | • 95th percentile (P95) response time under normal workload remains below 350 ms.<br>• 99th percentile (P99) response time remains below 800 ms.<br>• Node.js container memory consumption stabilizes without upward drift (indicating zero memory leaks in Socket.IO event listeners).<br>• Database index scans utilized for all filtered queries; zero sequential scans on primary tables with > 10,000 records. |
| **Required Tools** | • Node.js Clinic.js (Doctor, Flame, Bubbleprof)<br>• Autocannon HTTP benchmarking tool<br>• Docker Stats & cAdvisor<br>• Supabase Database Performance Insights & `pg_stat_statements` |
| **Success Criteria** | • All target microservices sustain target transaction rates without CPU throttling (> 80% sustained) or out-of-memory container restarts. |
| **Special Considerations**| • Performance benchmarks must be run on isolated machines with background OS processes minimized to prevent skewed latency measurements. |

---

### 3.1.5 Load Testing

Load testing subjects ResQ Hub to extreme, burst, and sustained traffic conditions simulating the immediate aftermath of a regional disaster event.

| Attribute | Specification |
| :--- | :--- |
| **Technique Objective** | Subject the Kong API Gateway and microservice cluster to varying workloads to measure scalability, stability, error rates, and system degradation thresholds beyond maximum anticipated loads. |
| **Technique** | • Construct traffic profiles representing three disaster coordination phases:<br>  1. **Baseline Load:** 50 virtual users (VU) performing steady request lookups and profile updates.<br>  2. **Peak Disaster Surge:** 500 VUs concurrently submitting assistance requests, searching inventory, and registering volunteer offers over 15 minutes.<br>  3. **Stress & Breaking Point:** Ramp up from 500 to 2,000 VUs over 5 minutes to identify gateway throttling boundaries and database connection pool exhaustion.<br>• Execute workloads against Kong Gateway (:3000) and monitor rate-limiting enforcement (`300 requests/minute/IP`). |
| **Oracles** | • Error rate remains strictly below 1.0% under Peak Disaster Surge (500 VUs).<br>• Kong Gateway gracefully returns HTTP `429 Too Many Requests` when rate limits are exceeded, without dropping connections or crashing backend microservices.<br>• Zero database connection dropouts (`FATAL: remaining connection slots are reserved for non-replication superuser connections`). |
| **Required Tools** | • k6 Open-Source Load Tester (JavaScript test scripts)<br>• Locust (Python distributed load testing framework)<br>• Grafana & Prometheus for live metric visualization |
| **Success Criteria** | • System sustains a throughput of at least 250 requests per second (RPS) with 0% unhandled internal server errors (`500 Internal Server Error`).<br>• Full recovery to baseline latency within 60 seconds after traffic surge subsides. |
| **Special Considerations**| • Load testing must utilize realistic data distributions (e.g., varying categories, realistic GPS coordinates, diverse payload sizes) to prevent synthetic database caching optimizations. |

---

### 3.1.6 Security and Access Control Testing

Security testing verifies multi-tenant isolation, role-based authorization (RBAC), API Gateway traffic filtering, authentication validity, and defense against malicious intrusion attempts.

| Attribute | Specification |
| :--- | :--- |
| **Technique Objective** | Exercise the target-of-test to verify that users can access only authorized functions and data within their designated tenant organization, and that unauthorized access attempts are blocked and logged. |
| **Technique** | • **Authentication & JWT Validation:** Test expired tokens, malformed signatures, altered claims, and tokens stripped of the `Bearer` prefix. Verify that Kong and `@crp/shared-middleware` enforce strict cryptographic validation.<br>• **Role-Based Access Control (RBAC):**<br>  - Verify that a standard `USER` or `VOLUNTEER` cannot invoke coordinator endpoints (e.g., `POST /api/v1/tasks`, `PATCH /api/v1/requests/:id/verify`).<br>  - Verify that an `ORGANIZATION_ADMIN` cannot access administrative endpoints belonging to another organization (`tenant_id` isolation).<br>  - Verify that `SUPER_ADMIN` actions are restricted to platform-level operations.<br>• **API Gateway Security Policies:** Verify that Kong enforces CORS policies, blocks unauthorized HTTP methods, sanitizes headers, and appends unique correlation IDs (`X-Correlation-ID`).<br>• **Input Validation & Injection Defense:** Execute SQL injection (SQLi) vectors, Cross-Site Scripting (XSS) payloads, and NoSQL/JSON schema parameter pollution attacks on all public input fields. |
| **Oracles** | • HTTP `401 Unauthorized` returned for missing or invalid JWT tokens.<br>• HTTP `403 Forbidden` returned whenever an authenticated user attempts to access resources outside their assigned role or organization boundary.<br>• OWASP ZAP automated scan yields zero High or Critical vulnerabilities.<br>• Database logs confirm zero execution of unsanitized SQL strings. |
| **Required Tools** | • OWASP ZAP (Zed Attack Proxy) automated security scanner<br>• Burp Suite Community Edition for manual request tampering<br>• Postman Security Test Suites (RBAC matrix runner)<br>• npm audit / Snyk for third-party dependency vulnerability scanning |
| **Success Criteria** | • Zero cross-tenant data leakage across all organization-scoped endpoints.<br>• 100% of negative RBAC access attempts successfully blocked. |
| **Special Considerations**| • Security probing must test both the public gateway interface (Port 3000) and internal Docker network bindings to confirm that backend services cannot be accessed directly from unauthorized external IPs. |

---

### 3.1.7 Failover and Recovery Testing

Failover and recovery testing ensures that ResQ Hub recovers gracefully from infrastructure, database, network, or microservice container crashes without loss of transaction integrity.

| Attribute | Specification |
| :--- | :--- |
| **Technique Objective** | Simulate catastrophic hardware, network, container, and database interruptions during active transactions, and exercise automated and manual recovery procedures to restore the system to a consistent, known state. |
| **Technique** | • **Microservice Container Termination:** Abruptly kill the `crp-task-service` or `crp-resource-service` container using `docker stop` / `docker kill` during an active Handover PIN verification transaction. Verify Docker Compose restart policies (`restart: unless-stopped`) and system reconciliation upon container reboot.<br>• **Network Partition Simulation:** Temporarily disconnect the Docker bridge network (`docker network disconnect crp-network crp-kong`) during active client traffic to simulate network server failure. Observe client retry behavior and gateway reconnection.<br>• **Database Severance Simulation:** Temporarily block outbound database connections to Supabase. Verify that microservices queue or gracefully reject requests with appropriate `503 Service Unavailable` error envelopes, without crashing Node.js runtime processes.<br>• **Incomplete Transaction Recovery:** Abort a task completion transaction midway (after PIN verification but before inventory deduction). Verify that rollback mechanics or compensation jobs maintain consistent states across `tasks` and `inventory_transactions`. |
| **Oracles** | • Zero corrupted or half-committed records in PostgreSQL.<br>• Docker containers automatically restart and re-establish database connection pools within 30 seconds.<br>• Frontend and mobile clients handle transient disconnects with informative error alerts rather than unhandled white-screen crashes. |
| **Required Tools** | • Docker CLI (`docker kill`, `docker pause`, `docker network disconnect`)<br>• Chaos testing scripts (Pumba / custom PowerShell disruption scripts)<br>• Supabase point-in-time recovery (PITR) tools & transaction log inspectors |
| **Success Criteria** | • System automatically recovers to full operational status within 60 seconds of container restoration.<br>• 100% data integrity verified: zero phantom task completions or untracked inventory deductions. |
| **Special Considerations**| • Failover testing is intrusive and must be executed strictly on a dedicated staging environment after normal development hours. |

---

### 3.1.8 Configuration Testing

Configuration testing verifies that ResQ Hub operates reliably across diverse operating systems, client browser versions, mobile device form factors, and container runtime environments.

| Attribute | Specification |
| :--- | :--- |
| **Technique Objective** | Exercise client applications and backend microservices across supported software, hardware, and environment configurations to observe target behavior and identify platform-specific defects. |
| **Technique** | • **Coordinator Web Dashboard Compatibility:** Execute automated UI test suites on latest stable versions of Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari across Windows 10/11 and macOS.<br>• **Mobile Client Device Compatibility:** Run the Flutter application on physical Android devices and emulators running Android versions 10.0 (API 29) through 14.0 (API 34), with screen densities ranging from mdpi to xxhdpi.<br>• **Environment Variable & Runtime Config Validation:** Execute backend microservices using alternate `.env` configurations (e.g., local Node.js process vs. Docker containerized execution; varying port configurations; staging vs. local Supabase instances).<br>• **Client Background App Switching:** Verify mobile app state persistence when switching between ResQ Hub and phone calls, camera, or mapping applications during active volunteer missions. |
| **Oracles** | • Web Coordinator Dashboard displays identical layouts, typography, and functional behavior across all supported desktop browsers.<br>• Flutter Mobile app preserves in-progress form inputs and tracking views across device orientation changes and background pauses.<br>• Services validate required environment variables on startup and exit immediately with descriptive errors if required configs are missing. |
| **Required Tools** | • BrowserStack / Chrome Device Mode for responsive web validation<br>• Android Virtual Devices (AVD) / Physical Android test devices<br>• Docker Desktop (Windows WSL2 engine) |
| **Success Criteria** | • Zero layout clipping, font distortion, or broken input components across any supported browser or mobile viewport.<br>• All services boot successfully across both direct Node.js (`npm run dev`) and Docker Compose environments. |
| **Special Considerations**| • Verify that mobile camera and location permission dialogs handle both 'Allow' and 'Deny' user choices gracefully without application crashes. |

---

## 3.2 Fault and Failure Models

To ensure thorough evaluation, tests will actively probe known distributed systems failure modes:
1. **Lost Updates & Concurrency Races:** Multiple coordinators attempting to assign different volunteer teams to the same request simultaneously.
2. **Double-Spend of Inventory:** Concurrent task completions demanding more stock than available warehouse inventory balances.
3. **Gateway Bypass Attempts:** Malicious clients attempting to reach internal service ports (`3001` - `3007`) directly from public networks.
4. **Stale State Machine Desynchronization:** Mobile clients reporting outdated progress percentages while a coordinator has cancelled the underlying mission.
5. **Partial Network Dropouts:** Volunteer submitting OTP verification in an area with intermittent cellular coverage.

---

# 4. Deliverables

The testing effort will generate formal, structured deliverables providing tangible visibility into software quality, defect density, and release readiness.

### 4.1 Test Evaluation Summaries
Test Evaluation Summaries provide project stakeholders, development team members, and academic evaluators with an executive assessment of test results, known defects, and quality trends.

| Attribute | Specification |
| :--- | :--- |
| **Summary Content** | • Total test cases executed, passed, failed, and blocked.<br>• Defect breakdown categorized by severity (Critical, Major, Minor, Cosmetic) and subsystem.<br>• Status of critical business workflows (Flow A, Flow B, Flow C).<br>• Performance metrics (average latency, P95, error percentage under load).<br>• Release recommendation (Go / No-Go decision with open risk justifications). |
| **Reporting Cadence** | • **Weekly Interim Summaries:** Produced at the end of each development sprint by Team Member 2.<br>• **Milestone Evaluation Summary:** Produced prior to iteration demo milestones.<br>• **Final Iteration Quality Report:** Comprehensive summary compiled for final academic project submission. |
| **Format** | Markdown executive summary published to `docs/testing/evaluation_summaries/` and linked in GitHub Release notes. |

### 4.2 Reporting on Test Coverage
Test coverage reports provide verifiable quantitative data measuring the extent of source code and requirements verified by automated test suites.

| Attribute | Specification |
| :--- | :--- |
| **Coverage Scope** | • **Backend Microservices:** Statement, branch, function, and line coverage measured across all seven microservices using Jest and Istanbul/NYC.<br>• **Shared Middleware:** 100% branch coverage required for `@crp/shared-middleware` auth and RBAC logic.<br>• **Web Coordinator Frontend:** Component test coverage measured using Vitest.<br>• **Requirements Traceability Matrix (RTM):** 100% mapping of functional requirements from SRS to automated or manual test cases. |
| **Target Thresholds** | • Minimum **80% overall line coverage** across microservice business logic layers (`services/*/src/services`).<br>• Minimum **85% branch coverage** across critical state machines (`task-service`, `resource-service`). |
| **Generation Cadence** | Generated automatically on every pull request via GitHub Actions CI pipeline and published as an interactive HTML coverage artifact. |

### 4.3 Incident and Defect Tracking Artifacts
All defects discovered during test execution are logged in the project issue repository (GitHub Issues / ClickUp) using a standardized defect template:
- **Unique Defect ID** (e.g., `DEF-TASK-042`)
- **Severity & Priority** (Critical / High / Medium / Low)
- **Subsystem / Microservice Affected**
- **Exact Steps to Reproduce**
- **Expected Result vs. Actual Result**
- **Attached Artifacts** (Console logs, network HAR files, screenshots, database query dumps)
- **Resolution Verification Sign-off** by the reporting QA engineer.

---

# 5. Risks, Dependencies, Assumptions, and Constraints

### 5.1 Risk Assessment and Mitigation Matrix

| Risk Identifier | Risk Description | Likelihood | Impact | Mitigation Strategy | Contingency Plan (If Realized) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | **Prerequisite Entry Criteria Not Met**<br>Backend microservices or Kong Gateway fail to boot cleanly in test environment. | Low | High | Establish automated Docker Compose health checks and verify container statuses before initiating test runs. | Halt test cycle; initiate immediate dev triage; log blocking defect and notify Team Member 1. |
| **RSK-02** | **Test Data Proves Inadequate or Corrupted**<br>Missing relational test fixtures prevent execution of complex end-to-end mission workflows. | Medium | High | Maintain automated, idempotent database seed scripts (`seed.js`) that populate complete organizations, users, and inventory fixtures. | Execute database reset script (`npm run db:reset`), re-seed isolated test datasets, and re-execute test suite. |
| **RSK-03** | **Database Requires Frequent Reset / Cloud Latency**<br>Shared Supabase instance undergoes schema mutations or experiences internet throttling. | Medium | Medium | Maintain local Dockerized PostgreSQL fallback instance configured with identical schema and extension sets. | Switch `.env` connection strings to local PostgreSQL fallback; resume testing offline. |
| **RSK-04** | **Third-Party Rate Limits on Remote Services**<br>Supabase free-tier connection limits or external notification gateways block test traffic. | High | Medium | Implement connection pooling (PgBouncer) and mock external notification providers during automated load tests. | Throttle test concurrency; enable service-level mocks for load execution; resume testing. |
| **RSK-05** | **Mobile Emulator Network / Dynamic IP Binding**<br>Flutter mobile app cannot connect to Kong Gateway due to local machine IP changes. | Medium | Low | Use dynamic IP configuration in `ApiClient` and document standardized network binding commands for Android emulators (`10.0.2.2`). | Update `.env` `API_URL` to current local subnet IP; rebuild mobile debug bundle. |
| **RSK-06** | **Flaky Asynchronous & Socket.IO Tests**<br>Real-time notification tests fail intermittently due to thread scheduling delays. | Medium | Medium | Use explicit polling assertions with timeouts rather than fixed sleep delays in test scripts. | Quarantine flaky tests; review event loop hooks; isolate Socket.IO mock fixtures. |

### 5.2 Environmental and External Dependencies
1. **Supabase Cloud Infrastructure:** Availability and responsiveness of the hosted PostgreSQL database instance and associated authentication APIs.
2. **Docker Desktop & Container Engine:** Stable container virtualization engine on host machines for orchestrating Kong Gateway and microservice containers.
3. **Local Wi-Fi Network Stability:** Reliable local subnet routing required for mobile device-to-gateway physical hardware testing.
4. **GitHub Actions Infrastructure:** Continuous Integration runners for executing automated test suites on pull requests.

### 5.3 System Assumptions
1. All testing activities will be conducted against staging database schemas with isolated test tenants, preventing exposure or alteration of production data.
2. Client mobile devices and emulator environments have access to network bandwidth of at least 1 Mbps to simulate standard field conditions.
3. User credentials and JWT secret keys used during test execution are strictly dedicated to testing and are never reused in production deployments.

### 5.4 Operational and Architectural Constraints
1. **Single Database Instance:** During the academic project phase, all microservices share a single PostgreSQL database instance; logical boundary enforcement must be maintained via service-level repository logic and RLS.
2. **Academic Timebox:** Test design, execution, and reporting must be completed within the Semester 5 Software Engineering schedule constraints.
3. **Hardware Limitations:** Performance and load testing will be conducted on available development workstations; maximum simulated load is constrained to 2,000 virtual users.

---

# 6. References

### 6.1 Standards and Process References
1. **ISO/IEC/IEEE 29119-1:2022**, *Software and systems engineering — Software testing — Part 1: General concepts*. IEEE Computer Society, 2022.
2. **ISO/IEC/IEEE 29119-2:2021**, *Software and systems engineering — Software testing — Part 2: Test processes*. IEEE Computer Society, 2021.
3. **ISO/IEC/IEEE 29119-3:2021**, *Software and systems engineering — Software testing — Part 3: Test documentation*. IEEE Computer Society, 2021.
4. **IBM Corporation**, *Rational Unified Process: Best Practices for Software Development Teams*, Rational Software White Paper, TP026B, Rev 11/01, 2001.

### 6.2 Textbooks and Academic Literature
5. R. S. Pressman and B. R. Maxim, *Software Engineering: A Practitioner's Approach*, 9th ed. New York, NY, USA: McGraw-Hill Education, 2020.
6. G. J. Myers, C. Sandler, and T. Badgett, *The Art of Software Testing*, 3rd ed. Hoboken, NJ, USA: John Wiley & Sons, 2011.
7. M. Fowler, *Patterns of Enterprise Application Architecture*. Boston, MA, USA: Addison-Wesley, 2002.
8. S. Newman, *Building Microservices: Designing Fine-Grained Systems*, 2nd ed. Sebastopol, CA, USA: O'Reilly Media, 2021.

### 6.3 Project Documentation References
9. ResQ Hub Development Team, *Software Requirements Specification (SRS) for Resource Coordination Platform for Community Resilience*, Project Report SRS_09_14, Semester 5, 2026.
10. ResQ Hub Development Team, *System Architecture Document (SAD) for Resource Coordination Platform for Community Resilience*, Project Report SAD_09_14, Semester 5, 2026.
11. ResQ Hub Development Team, *ResQ Hub Project Development Plan & Master Handover Document*, `docs/resQHub.md` and `PROGRESS.md`, 2026.
12. ResQ Hub Development Team, *OpenAPI REST Specification for Resource Coordination Platform*, `docs/API/resource-coordination-api.yaml`, 2026.

### 6.4 Testing Tools and Technology References
13. **Jest Testing Framework**, Available at: https://jestjs.io (Accessed on 24 September 2026).
14. **Supertest HTTP Testing Library**, Available at: https://github.com/ladjs/supertest (Accessed on 24 September 2026).
15. **k6 Load Testing Tool**, Grafana Labs, Available at: https://k6.io (Accessed on 24 September 2026).
16. **OWASP Zed Attack Proxy (ZAP)**, Open Web Application Security Project, Available at: https://www.zaproxy.org (Accessed on 24 September 2026).
17. **Postman & Newman CLI**, Postman Inc., Available at: https://www.postman.com (Accessed on 24 September 2026).
18. **Locust Distributed Load Testing Framework**, Available at: https://locust.io (Accessed on 24 September 2026).
19. **Flutter Testing and Driver Tools**, Google LLC, Available at: https://docs.flutter.dev/testing (Accessed on 24 September 2026).
20. **Kong API Gateway Documentation**, Kong Inc., Available at: https://docs.konghq.com (Accessed on 24 September 2026).
21. **Supabase PostgreSQL Platform**, Supabase Inc., Available at: https://supabase.com/docs (Accessed on 24 September 2026).
22. **Docker Engine and Docker Compose**, Docker Inc., Available at: https://docs.docker.com (Accessed on 24 September 2026).

---
*End of Master Test Plan Document — ResQ Hub Platform*
