-- ==============================================================================
-- ResQ Hub - Database Integrity Test Seed Data Fixture
-- Purpose: Standardized relational seed records for Section 3.1.1 test execution
-- ==============================================================================

-- 1. Organizations
INSERT INTO organizations (organization_id, tenant_id, organization_name, description, email, phone, status)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Red Cross Colombo Hub', 'Emergency disaster response and medical aid division', 'colombo@redcross.org', '+94112345678', 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Sarvodaya Relief Foundation', 'Community volunteer coordination and dry ration relief', 'relief@sarvodaya.org', '+94112345679', 'ACTIVE')
ON CONFLICT (organization_id) DO UPDATE 
SET organization_name = EXCLUDED.organization_name, status = EXCLUDED.status;

-- 2. Users (Coordinators, Citizens, Volunteers, Admins)
INSERT INTO users (user_id, first_name, last_name, email, phone, status)
VALUES 
  ('c0000000-0000-0000-0000-000000000001', 'Kasun', 'Perera', 'kasun.coordinator@resqhub.test', '+94771234567', 'ACTIVE'),
  ('c0000000-0000-0000-0000-000000000002', 'Nuwan', 'Silva', 'nuwan.citizen@resqhub.test', '+94772345678', 'ACTIVE'),
  ('c0000000-0000-0000-0000-000000000003', 'Amara', 'Fernando', 'amara.volunteer@resqhub.test', '+94773456789', 'ACTIVE'),
  ('c0000000-0000-0000-0000-000000000004', 'Dilshan', 'Jayaweera', 'dilshan.donor@resqhub.test', '+94774567890', 'ACTIVE'),
  ('c0000000-0000-0000-0000-000000000005', 'Admin', 'Root', 'superadmin@resqhub.test', '+94775678901', 'ACTIVE')
ON CONFLICT (user_id) DO UPDATE 
SET first_name = EXCLUDED.first_name, email = EXCLUDED.email;

-- 3. User Roles
INSERT INTO user_roles (user_id, role)
VALUES 
  ('c0000000-0000-0000-0000-000000000001', 'USER'),
  ('c0000000-0000-0000-0000-000000000002', 'USER'),
  ('c0000000-0000-0000-0000-000000000003', 'VOLUNTEER'),
  ('c0000000-0000-0000-0000-000000000004', 'USER'),
  ('c0000000-0000-0000-0000-000000000005', 'SUPER_ADMIN')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Organization Members
INSERT INTO organization_members (organization_member_id, organization_id, user_id, role, status)
VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'COORDINATOR', 'ACTIVE')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 5. User Addresses
INSERT INTO user_addresses (address_id, user_id, address_type, address_line1, city, district, province, is_primary)
VALUES 
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'HOME', '45 Galle Road', 'Colombo 03', 'Colombo', 'Western Province', TRUE)
ON CONFLICT (address_id) DO NOTHING;

-- 6. Resources (Warehouse Inventory)
INSERT INTO resources (resource_id, organization_id, resource_name, category, quantity_available, quantity_reserved, unit, location, reorder_level)
VALUES 
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Mineral Water 5L', 'Water & Sanitation', 250, 50, 'bottles', 'Warehouse Bay A1', 50),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Dry Ration Pack (Family)', 'Food & Nutrition', 120, 20, 'packs', 'Warehouse Bay B3', 30),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'First Aid Emergency Kit', 'Medical Supplies', 40, 0, 'kits', 'Warehouse Medical Cage', 10)
ON CONFLICT (organization_id, resource_name, unit, location) DO UPDATE
SET quantity_available = EXCLUDED.quantity_available, quantity_reserved = EXCLUDED.quantity_reserved;

-- 7. Inventory Transactions Ledger
INSERT INTO inventory_transactions (transaction_id, organization_id, resource_id, transaction_type, quantity, remarks)
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'STOCK_IN', 300, 'Initial bulk disaster shipment'),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'STOCK_OUT', 50, 'Dispatched to Wellawatte flood relief center')
ON CONFLICT (transaction_id) DO NOTHING;

-- 8. Requests
INSERT INTO requests (request_id, organization_id, requester_id, title, description, category, quantity_required, unit, urgency, status, location, handover_pin)
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Urgent drinking water for flood victims', '20 families stranded in Kolonnawa community center without potable water', 'Water & Sanitation', 40, 'bottles', 'HIGH', 'VERIFIED', 'Kolonnawa Community Center', '4821')
ON CONFLICT (request_id) DO NOTHING;

-- 9. Volunteers
INSERT INTO volunteers (volunteer_id, organization_id, user_id, availability_status, experience_years, rating, verification_status)
VALUES 
  ('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'AVAILABLE', 2.5, 4.85, 'VERIFIED')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 10. Tasks
INSERT INTO tasks (task_id, organization_id, request_id, coordinator_id, title, description, priority, status, location)
VALUES 
  ('40000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Deliver 40 bottles of drinking water to Kolonnawa', 'Immediate dispatch mission with Handover PIN verification required', 'HIGH', 'ASSIGNED', 'Kolonnawa')
ON CONFLICT (task_id) DO NOTHING;

-- 11. Task Assignments
INSERT INTO task_assignments (assignment_id, task_id, volunteer_id, assigned_by, assignment_status)
VALUES 
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'ACCEPTED')
ON CONFLICT (task_id, volunteer_id) DO NOTHING;

-- 12. Task Progress
INSERT INTO task_progress (progress_id, task_id, updated_by_user_id, progress_percent, remarks)
VALUES 
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 50, 'En route with supply vehicle')
ON CONFLICT (progress_id) DO NOTHING;
