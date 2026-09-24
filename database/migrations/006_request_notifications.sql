-- ─────────────────────────────────────────────────────────────────────────────
--  ResQ Hub — Restructure notifications table + add request notification types
--
--  Run this in Supabase SQL Editor.
--
--  What this does:
--    1. Drops the old notifications table (old schema had different columns)
--    2. Drops the old notification_status enum
--    3. Creates the notification_type enum with all values
--    4. Creates the new notifications table (matching 005_notifications.sql)
--    5. Re-adds Supabase Realtime publication, index, and task triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Drop old table (cascades to any dependent triggers/views)
DROP TABLE IF EXISTS notifications CASCADE;

-- Step 2: Drop old enum
DROP TYPE IF EXISTS notification_status;

-- Step 3: Create the correct notification_type enum
--         (includes task types from 005 + request types from this migration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'TASK_ASSIGNED',
            'TASK_STATUS_CHANGED',
            'NEW_DONATION',
            'DONATION_STATUS_CHANGED',
            'INVENTORY_ALERT',
            'REQUEST_STATUS_CHANGED',
            'NEW_REQUEST'
        );
    ELSE
        -- Enum already exists (e.g. 005 was run) — just add the new values
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'REQUEST_STATUS_CHANGED';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'NEW_REQUEST';
    END IF;
END$$;

-- Step 4: Create the new notifications table
CREATE TABLE notifications (
    notification_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    organization_id UUID        REFERENCES organizations(organization_id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    message         TEXT        NOT NULL,
    is_read         BOOLEAN     NOT NULL DEFAULT false,
    link            VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 5: Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Step 6: Index for fast unread queries per user
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

-- Step 7: Re-create task assignment trigger
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, organization_id, type, message, link)
    VALUES (
        (SELECT user_id FROM volunteers WHERE volunteer_id = NEW.volunteer_id),
        (SELECT organization_id FROM tasks WHERE task_id = NEW.task_id),
        'TASK_ASSIGNED',
        'You have been assigned a new task: ' || (SELECT title FROM tasks WHERE task_id = NEW.task_id),
        '/tasks/' || NEW.task_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_task_assigned ON task_assignments;
CREATE TRIGGER on_task_assigned
    AFTER INSERT ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION notify_task_assignment();

-- Step 8: Re-create task status change trigger
CREATE OR REPLACE FUNCTION notify_task_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notifications (user_id, organization_id, type, message, link)
        VALUES (
            NEW.created_by,
            NEW.organization_id,
            'TASK_STATUS_CHANGED',
            'Task "' || NEW.title || '" status changed to ' || NEW.status,
            '/tasks/' || NEW.task_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_task_status_changed ON tasks;
CREATE TRIGGER on_task_status_changed
    AFTER UPDATE OF status ON tasks
    FOR EACH ROW EXECUTE FUNCTION notify_task_status();
