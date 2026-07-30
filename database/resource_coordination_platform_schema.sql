-- Resource Coordination Platform for Community Resilience
-- PostgreSQL / Supabase schema
-- Full schema generated from the reviewed ER design.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_status AS ENUM ('ACTIVE','INACTIVE','SUSPENDED','PENDING');
CREATE TYPE membership_role AS ENUM ('SUPER_ADMIN','ORGANIZATION_ADMIN','COORDINATOR','COMMUNITY_MEMBER','DONOR','VOLUNTEER');
CREATE TYPE membership_status AS ENUM ('ACTIVE','INACTIVE','PENDING');
CREATE TYPE request_status AS ENUM ('PENDING','VERIFIED','REJECTED','ASSIGNED','IN_PROGRESS','FULFILLED','CANCELLED');
CREATE TYPE urgency_level AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
CREATE TYPE task_status AS ENUM ('PENDING','ASSIGNED','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED');
CREATE TYPE assignment_status AS ENUM ('PENDING','ACCEPTED','REJECTED','CANCELLED','COMPLETED');
CREATE TYPE donation_status AS ENUM ('PENDING','VERIFIED','REJECTED','RECEIVED','DISTRIBUTED','CANCELLED');
CREATE TYPE delivery_method AS ENUM ('DONOR_DELIVERY','ORGANIZATION_PICKUP','VOLUNTEER_PICKUP');
CREATE TYPE inventory_transaction_type AS ENUM ('STOCK_IN','STOCK_OUT','ADJUSTMENT','RESERVATION','RELEASE');
CREATE TYPE availability_status AS ENUM ('AVAILABLE','BUSY','UNAVAILABLE');
CREATE TYPE verification_status AS ENUM ('PENDING','VERIFIED','REJECTED');
CREATE TYPE notification_status AS ENUM ('UNREAD','READ','ARCHIVED');

CREATE TABLE organizations (
 organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 organization_name VARCHAR(200) NOT NULL,
 description TEXT, email VARCHAR(255), phone VARCHAR(30), address TEXT,
 status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','INACTIVE','SUSPENDED')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
 user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL,
 email VARCHAR(255) NOT NULL UNIQUE, password_hash TEXT, phone VARCHAR(30),
 profile_image TEXT, status user_status NOT NULL DEFAULT 'ACTIVE',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE memberships (
 membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE RESTRICT,
 user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 role membership_role NOT NULL DEFAULT 'COMMUNITY_MEMBER',
 status membership_status NOT NULL DEFAULT 'PENDING',
 joined_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(organization_id,user_id)
);

CREATE TABLE user_addresses (
 address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
 address_type VARCHAR(30) NOT NULL DEFAULT 'HOME',
 address_line1 VARCHAR(255) NOT NULL, address_line2 VARCHAR(255),
 city VARCHAR(100), district VARCHAR(100), province VARCHAR(100),
 postal_code VARCHAR(20), latitude DECIMAL(9,6), longitude DECIMAL(9,6),
 is_primary BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_verification_tokens (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
 token VARCHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
 token VARCHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE requests (
 request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE RESTRICT,
 requester_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 title VARCHAR(255) NOT NULL, description TEXT NOT NULL, category VARCHAR(100) NOT NULL,
 quantity_required INTEGER NOT NULL CHECK(quantity_required>0), unit VARCHAR(50) NOT NULL,
 urgency urgency_level NOT NULL DEFAULT 'MEDIUM',
 status request_status NOT NULL DEFAULT 'PENDING',
 location VARCHAR(255), latitude DECIMAL(9,6), longitude DECIMAL(9,6),
 verified_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
 verified_at TIMESTAMPTZ, rejection_reason TEXT, fulfilled_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE request_attachments (
 attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id UUID NOT NULL REFERENCES requests(request_id) ON DELETE CASCADE,
 organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE RESTRICT,
 file_name VARCHAR(255) NOT NULL, file_type VARCHAR(100), file_url TEXT NOT NULL,
 uploaded_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
 uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE volunteers (
 volunteer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE RESTRICT,
 user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 availability_status availability_status NOT NULL DEFAULT 'UNAVAILABLE',
 experience_years NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK(experience_years>=0),
 rating NUMERIC(3,2) CHECK(rating>=0 AND rating<=5),
 verification_status verification_status NOT NULL DEFAULT 'PENDING',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(organization_id,user_id)
);

CREATE TABLE volunteer_availability (
 availability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 volunteer_id UUID NOT NULL REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
 available_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL,
 status availability_status NOT NULL DEFAULT 'AVAILABLE',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(end_time>start_time)
);

CREATE TABLE skills (
 skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 skill_name VARCHAR(150) NOT NULL UNIQUE, description TEXT
);

CREATE TABLE volunteer_skills (
 volunteer_id UUID NOT NULL REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
 skill_id UUID NOT NULL REFERENCES skills(skill_id) ON DELETE RESTRICT,
 proficiency_level VARCHAR(30) NOT NULL DEFAULT 'BEGINNER'
 CHECK(proficiency_level IN ('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT')),
 PRIMARY KEY(volunteer_id,skill_id)
);

CREATE TABLE certifications (
 certification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 volunteer_id UUID NOT NULL REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
 certificate_name VARCHAR(255) NOT NULL, issuing_organization VARCHAR(255),
 issue_date DATE, expiry_date DATE, certificate_url TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(expiry_date IS NULL OR issue_date IS NULL OR expiry_date>=issue_date)
);

CREATE TABLE resources (
 resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE RESTRICT,
 resource_name VARCHAR(200) NOT NULL, category VARCHAR(100) NOT NULL,
 quantity_available INTEGER NOT NULL DEFAULT 0 CHECK(quantity_available>=0),
 quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK(quantity_reserved>=0),
 unit VARCHAR(50) NOT NULL, location VARCHAR(255),
 reorder_level INTEGER NOT NULL DEFAULT 0 CHECK(reorder_level>=0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(quantity_reserved<=quantity_available),
 UNIQUE(organization_id,resource_name,unit,location)
);

CREATE TABLE donations (
 donation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE RESTRICT,
 donor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 resource_id UUID REFERENCES resources(resource_id) ON DELETE SET NULL,
 resource_name VARCHAR(200) NOT NULL, category VARCHAR(100),
 quantity INTEGER NOT NULL CHECK(quantity>0), unit VARCHAR(50) NOT NULL,
 delivery_method delivery_method NOT NULL, pickup_address TEXT, donation_notes TEXT,
 status donation_status NOT NULL DEFAULT 'PENDING',
 verified_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
 verified_at TIMESTAMPTZ, rejection_reason TEXT, received_at TIMESTAMPTZ,
 distributed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_transactions (
 transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE RESTRICT,
 resource_id UUID NOT NULL REFERENCES resources(resource_id) ON DELETE RESTRICT,
 transaction_type inventory_transaction_type NOT NULL,
 quantity INTEGER NOT NULL CHECK(quantity>0), reference_type VARCHAR(50), reference_id UUID,
 created_by UUID REFERENCES users(user_id) ON DELETE SET NULL, remarks TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
 task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE RESTRICT,
 request_id UUID NOT NULL REFERENCES requests(request_id) ON DELETE RESTRICT,
 coordinator_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 title VARCHAR(255) NOT NULL, description TEXT,
 priority urgency_level NOT NULL DEFAULT 'MEDIUM',
 status task_status NOT NULL DEFAULT 'PENDING',
 location VARCHAR(255), latitude DECIMAL(9,6), longitude DECIMAL(9,6),
 start_date TIMESTAMPTZ, due_date TIMESTAMPTZ, completed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(due_date IS NULL OR start_date IS NULL OR due_date>=start_date)
);

CREATE TABLE task_assignments (
 assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
 volunteer_id UUID NOT NULL REFERENCES volunteers(volunteer_id) ON DELETE RESTRICT,
 assigned_by UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 assignment_status assignment_status NOT NULL DEFAULT 'PENDING',
 assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), responded_at TIMESTAMPTZ,
 completed_at TIMESTAMPTZ, UNIQUE(task_id,volunteer_id)
);

CREATE TABLE task_progress (
 progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
 updated_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
 progress_percent INTEGER NOT NULL CHECK(progress_percent BETWEEN 0 AND 100),
 remarks TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
 notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE RESTRICT,
 user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
 title VARCHAR(255) NOT NULL, message TEXT NOT NULL,
 type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
 status notification_status NOT NULL DEFAULT 'UNREAD',
 reference_type VARCHAR(50), reference_id UUID, read_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
 audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID REFERENCES organizations(organization_id) ON DELETE SET NULL,
 user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
 action VARCHAR(100) NOT NULL, entity_type VARCHAR(100) NOT NULL, entity_id UUID,
 old_values JSONB, new_values JSONB, ip_address INET,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Important indexes
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_org_status ON memberships(organization_id,status);
CREATE INDEX idx_requests_org_status ON requests(organization_id,status);
CREATE INDEX idx_requests_org_created ON requests(organization_id,created_at DESC);
CREATE INDEX idx_requests_requester ON requests(requester_id);
CREATE INDEX idx_volunteers_org_availability ON volunteers(organization_id,availability_status);
CREATE INDEX idx_resources_org_category ON resources(organization_id,category);
CREATE INDEX idx_donations_org_status ON donations(organization_id,status);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_inventory_resource_created ON inventory_transactions(resource_id,created_at DESC);
CREATE INDEX idx_tasks_org_status ON tasks(organization_id,status);
CREATE INDEX idx_tasks_request ON tasks(request_id);
CREATE INDEX idx_task_assignments_volunteer ON task_assignments(volunteer_id,assignment_status);
CREATE INDEX idx_notifications_user ON notifications(user_id,status,created_at DESC);
CREATE INDEX idx_audit_org_created ON audit_logs(organization_id,created_at DESC);

-- Automatically maintain updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at=NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER memberships_updated BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER addresses_updated BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER requests_updated BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER volunteers_updated BEFORE UPDATE ON volunteers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER availability_updated BEFORE UPDATE ON volunteer_availability FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER resources_updated BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER donations_updated BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
