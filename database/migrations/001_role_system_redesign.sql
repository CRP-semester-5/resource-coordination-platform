-- ─────────────────────────────────────────────────────────────────────────────
--  ResQ Hub — Role System Migration
--  Run this in Supabase SQL Editor (Project → SQL Editor → New Query)
--
--  This replaces the single `memberships` table with:
--    - user_roles          (global platform roles: USER, VOLUNTEER, SUPER_ADMIN)
--    - organization_members (org-specific staff: COORDINATOR, ORGANIZATION_ADMIN)
-- ─────────────────────────────────────────────────────────────────────────────

-- STEP 1: Drop the old memberships system
-- (CASCADE removes any dependent objects like indexes/triggers automatically)
DROP TABLE  IF EXISTS memberships CASCADE;
DROP TYPE   IF EXISTS membership_role CASCADE;
DROP TYPE   IF EXISTS membership_status CASCADE;


-- STEP 2: Global roles — platform-wide, no org context required
CREATE TYPE global_role AS ENUM ('USER', 'VOLUNTEER', 'SUPER_ADMIN');

CREATE TABLE user_roles (
    user_id     UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role        global_role NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);


-- STEP 3: Organization-specific staff roles
CREATE TYPE organization_role AS ENUM ('COORDINATOR', 'ORGANIZATION_ADMIN');

CREATE TABLE organization_members (
    organization_member_id  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID              NOT NULL REFERENCES organizations(organization_id) ON DELETE RESTRICT,
    user_id                 UUID              NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    role                    organization_role NOT NULL,
    status                  VARCHAR(20)       NOT NULL DEFAULT 'ACTIVE'
                                              CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE')),
    invited_by              UUID              REFERENCES users(user_id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON organization_members(user_id, status);
CREATE INDEX idx_org_members_org  ON organization_members(organization_id, status);

-- Auto-update updated_at (reuses the existing set_updated_at function)
CREATE TRIGGER org_members_updated
    BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- STEP 4: Auto-assign USER role when a new user registers
CREATE OR REPLACE FUNCTION assign_default_user_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'USER')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_assign_default_role
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_user_role();


-- STEP 5: Backfill USER role for any existing users
-- (They won't have been auto-assigned by the trigger above since they existed before it)
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'USER'
FROM   users
ON CONFLICT DO NOTHING;


-- Done! Verify with:
-- SELECT * FROM user_roles;
-- SELECT * FROM organization_members;
