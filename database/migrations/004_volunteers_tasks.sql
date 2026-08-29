-- ─────────────────────────────────────────────────────────────────────────────
--  ResQ Hub — Volunteer & Task Management Migration
--  Run this in Supabase SQL Editor (Project → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Volunteers Profile (Extends the User profile)
CREATE TABLE volunteers (
    volunteer_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    phone_number    VARCHAR(20),
    is_available    BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);
CREATE TRIGGER volunteers_updated
    BEFORE UPDATE ON volunteers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Volunteer Skills (e.g., 'First Aid', 'Driver', 'Plumber')
CREATE TABLE volunteer_skills (
    skill_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id    UUID NOT NULL REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    skill_name      VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(volunteer_id, skill_name)
);

-- 3. Tasks (Created by Organization Coordinators)
CREATE TYPE task_status AS ENUM ('UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE tasks (
    task_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    required_skill  VARCHAR(100), -- Optional skill requirement
    status          task_status NOT NULL DEFAULT 'UNASSIGNED',
    priority        task_priority NOT NULL DEFAULT 'MEDIUM',
    created_by      UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER tasks_updated
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Task Assignments (Mapping tasks to volunteers)
CREATE TABLE task_assignments (
    assignment_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    volunteer_id    UUID NOT NULL REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(task_id, volunteer_id)
);

-- Done! Verify with:
-- SELECT * FROM volunteers;
-- SELECT * FROM tasks;
