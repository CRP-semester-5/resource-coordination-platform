-- ─────────────────────────────────────────────────────────────────────────────
--  ResQ Hub — Elevate User to Super Admin
--  Run this in Supabase SQL Editor to bootstrap your first SUPER_ADMIN account.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Replace 'your.email@example.com' with the email you registered with.
-- 2. Run the query.
-- 3. Log out and log back in to get your new token.

INSERT INTO user_roles (user_id, role)
SELECT user_id, 'SUPER_ADMIN'
FROM users
WHERE email = 'your.email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- To verify:
SELECT * FROM user_roles 
WHERE role = 'SUPER_ADMIN';
