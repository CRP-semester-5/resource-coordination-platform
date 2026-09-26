CREATE OR REPLACE FUNCTION notify_task_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notifications (user_id, organization_id, type, message, reference_type, reference_id)
        VALUES (
            COALESCE(NEW.coordinator_id, (SELECT applicant_id FROM organizations WHERE organization_id = NEW.organization_id LIMIT 1)),
            NEW.organization_id,
            'TASK_STATUS_CHANGED',
            'Task "' || NEW.title || '" status changed to ' || NEW.status,
            'TASK',
            NEW.task_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
