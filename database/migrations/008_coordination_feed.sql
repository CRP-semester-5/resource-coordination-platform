-- ─────────────────────────────────────────────────────────────────────────────
--  ResQ Hub — Inter-Organization Coordination Feed (Chat)
--  Run this in Supabase SQL Editor (Project → SQL Editor → New Query)
--  Single table design with JSONB reactions for lightweight chat feed
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Feed Message Type
CREATE TYPE feed_message_type AS ENUM (
    'GENERAL',              -- Normal discussion message
    'CATEGORY_REQUEST',     -- Proposing a new resource category
    'RESOURCE_ALERT',       -- Alerting about stock shortage or surplus
    'ANNOUNCEMENT'          -- Admin broadcast / important notice
);

-- 2. Feed Message Status (for actionable posts like category requests)
CREATE TYPE feed_message_status AS ENUM (
    'OPEN',                 -- Active / awaiting response
    'ACKNOWLEDGED',         -- Admin has seen / "I'll do it"
    'RESOLVED',             -- Action completed (e.g., category created)
    'CLOSED'                -- Closed without action
);

-- 3. The Single Coordination Feed Table
CREATE TABLE coordination_feed (
    message_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Threading: NULL = top-level post, UUID = reply to that parent
    parent_id           UUID REFERENCES coordination_feed(message_id) ON DELETE CASCADE,

    -- Who posted it
    user_id             UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_name           VARCHAR(200) NOT NULL,          -- Denormalized for fast display
    user_role           VARCHAR(50) NOT NULL DEFAULT 'COORDINATOR',  -- 'COORDINATOR', 'SUPER_ADMIN'

    -- Which organization (NULL for Super Admin posts)
    organization_id     UUID REFERENCES organizations(organization_id) ON DELETE SET NULL,
    organization_name   VARCHAR(200),                   -- Denormalized for fast display

    -- Message content
    message_type        feed_message_type NOT NULL DEFAULT 'GENERAL',
    content             TEXT NOT NULL,
    status              feed_message_status NOT NULL DEFAULT 'OPEN',

    -- Category request fields (only used when message_type = 'CATEGORY_REQUEST')
    proposed_category   VARCHAR(100),       -- e.g., "Life Jackets & Rescue Boats"
    proposed_unit       VARCHAR(50),        -- e.g., "units"

    -- Reactions stored as JSONB: {"👍": ["user-id-1", "user-id-2"], "💡": ["user-id-3"]}
    reactions           JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update timestamp trigger
CREATE TRIGGER coordination_feed_updated
    BEFORE UPDATE ON coordination_feed
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes for fast queries
CREATE INDEX idx_feed_parent ON coordination_feed(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_feed_created ON coordination_feed(created_at DESC);
CREATE INDEX idx_feed_type ON coordination_feed(message_type) WHERE message_type != 'GENERAL';
CREATE INDEX idx_feed_status ON coordination_feed(status) WHERE status = 'OPEN';

-- Enable Supabase Realtime for live chat updates
ALTER PUBLICATION supabase_realtime ADD TABLE coordination_feed;

-- Done! Verify with:
-- SELECT * FROM coordination_feed ORDER BY created_at DESC LIMIT 10;
