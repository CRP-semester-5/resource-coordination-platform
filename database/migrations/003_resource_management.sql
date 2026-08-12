-- ─────────────────────────────────────────────────────────────────────────────
--  ResQ Hub — Logistics & Resource Management Migration
--  Run this in Supabase SQL Editor (Project → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Resource Categories (Global, managed by Super Admins)
CREATE TABLE resource_categories (
    category_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    unit_of_measure VARCHAR(50) NOT NULL, -- e.g., "boxes", "bottles", "kg", "units"
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER resource_categories_updated
    BEFORE UPDATE ON resource_categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 2. Inventory (Per-Organization stock levels)
CREATE TABLE inventory (
    inventory_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES resource_categories(category_id) ON DELETE RESTRICT,
    quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, category_id)
);
CREATE TRIGGER inventory_updated
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 3. Donations (Incoming public offers to organizations)
CREATE TYPE donation_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

CREATE TABLE donations (
    donation_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES resource_categories(category_id) ON DELETE RESTRICT,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    donor_name      VARCHAR(100) NOT NULL,
    donor_email     VARCHAR(255) NOT NULL,
    status          donation_status NOT NULL DEFAULT 'PENDING',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER donations_updated
    BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Done! Verify with:
-- SELECT * FROM resource_categories;
-- SELECT * FROM inventory;
-- SELECT * FROM donations;
