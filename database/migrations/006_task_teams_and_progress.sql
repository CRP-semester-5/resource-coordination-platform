-- ==============================================================================
-- ResQ Hub - Multi-Volunteer Teams & Task Capacity Migration
-- Run in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Add task_type and volunteers_required to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL';

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS volunteers_required INTEGER NOT NULL DEFAULT 1 
CHECK (volunteers_required > 0);

-- 2. Add assignment_status to task_assignments if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' AND column_name = 'assignment_status'
    ) THEN
        ALTER TABLE task_assignments 
        ADD COLUMN assignment_status VARCHAR(50) NOT NULL DEFAULT 'ACCEPTED';
    END IF;
END $$;

-- 3. Ensure task_progress table exists
CREATE TABLE IF NOT EXISTS task_progress (
    progress_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id             UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    updated_by_user_id  UUID REFERENCES users(user_id) ON DELETE SET NULL,
    progress_percent    INTEGER NOT NULL CHECK (progress_percent BETWEEN 0 AND 100),
    remarks             TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient task progress querying
CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON task_progress(task_id, updated_at DESC);
