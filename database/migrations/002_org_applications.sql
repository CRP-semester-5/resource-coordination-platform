-- STEP 1: Add applicant_id column
ALTER TABLE organizations
ADD COLUMN applicant_id UUID REFERENCES users(user_id) ON DELETE SET NULL;

-- STEP 2: Update status check constraint
ALTER TABLE organizations
DROP CONSTRAINT organizations_status_check;

ALTER TABLE organizations
ADD CONSTRAINT organizations_status_check
CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'REJECTED'));

-- STEP 3: Change default status to PENDING for new applications
ALTER TABLE organizations
ALTER COLUMN status SET DEFAULT 'PENDING';

-- STEP 4: Backfill any existing organizations to have 'ACTIVE' status explicitly
-- (They probably already are, but just to be safe)
UPDATE organizations
SET status = 'ACTIVE'
WHERE status IS NULL OR status = '';
