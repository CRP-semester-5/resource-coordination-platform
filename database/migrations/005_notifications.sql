-- ─────────────────────────────────────────────────────────────────────────────
--  ResQ Hub — Real-Time Notifications Migration
--  Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE notification_type AS ENUM ('TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'NEW_DONATION', 'DONATION_STATUS_CHANGED', 'INVENTORY_ALERT');

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Who gets notified
    organization_id UUID REFERENCES organizations(organization_id) ON DELETE CASCADE, -- Optional context
    type            notification_type NOT NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    link            VARCHAR(255), -- Optional link to the resource
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Supabase Realtime for notifications
-- (Requires turning on publication in Supabase UI, or via SQL if possible)
-- For Supabase, to enable realtime on a table:
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create an index for faster queries by user
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

-- Auto-generate notifications for TASK ASSIGNMENTS
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

CREATE TRIGGER on_task_assigned
    AFTER INSERT ON task_assignments
    FOR EACH ROW EXECUTE FUNCTION notify_task_assignment();

-- Auto-generate notifications for TASK STATUS CHANGES
CREATE OR REPLACE FUNCTION notify_task_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Notify the coordinator who created the task (or the org)
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

CREATE TRIGGER on_task_status_changed
    AFTER UPDATE OF status ON tasks
    FOR EACH ROW EXECUTE FUNCTION notify_task_status();
