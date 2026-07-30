import { supabase } from '../lib/supabase.js'

// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find a user by email (returns null if not found — not an error).
 */
export async function findUserByEmail(email) {
    const { data, error } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, email, password_hash, status')
        .eq('email', email)
        .single()

    if (error && error.code !== 'PGRST116') throw error
    return data ?? null
}

/**
 * Insert a new user with PENDING status (awaiting email verification).
 * Returns the created row without password_hash.
 */
export async function createUser({ firstName, lastName, email, passwordHash }) {
    const { data, error } = await supabase
        .from('users')
        .insert({
            first_name: firstName,
            last_name: lastName,
            email,
            password_hash: passwordHash,
            status: 'PENDING',
        })
        .select('user_id, first_name, last_name, email, status, created_at')
        .single()

    if (error) throw error
    return data
}

/**
 * Get a user's full profile by UUID (no password_hash).
 */
export async function findUserById(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, email, phone, profile_image, status, created_at')
        .eq('user_id', userId)
        .single()

    if (error) throw error
    return data
}

/**
 * Update allowed profile fields for a user.
 * Only fields present in `fields` object are updated.
 */
export async function updateUser(userId, fields) {
    const { data, error } = await supabase
        .from('users')
        .update(fields)
        .eq('user_id', userId)
        .select('user_id, first_name, last_name, email, phone, profile_image, status, created_at')
        .single()

    if (error) throw error
    return data
}

/**
 * Fetch all ACTIVE memberships for a user across all organisations.
 * Returns: [{ org_id, role }, ...] — empty array for new users.
 */
export async function findUserMemberships(userId) {
    const { data, error } = await supabase
        .from('memberships')
        .select('organization_id, role')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')

    if (error) throw error
    return (data ?? []).map((m) => ({
        org_id: m.organization_id,
        role: m.role,
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// User Addresses
// ─────────────────────────────────────────────────────────────────────────────

export async function findUserAddresses(userId) {
    const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
}

export async function createAddress(userId, fields) {
    const { data, error } = await supabase
        .from('user_addresses')
        .insert({ user_id: userId, ...fields })
        .select('*')
        .single()

    if (error) throw error
    return data
}

export async function deleteAddress(addressId, userId) {
    const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('address_id', addressId)
        .eq('user_id', userId) // Ensures users can only delete their own addresses

    if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────────
// Email Verification Tokens
// ─────────────────────────────────────────────────────────────────────────────

export async function createVerificationToken(userId, token, expiresAt) {
    // Remove any existing tokens for this user before creating a new one
    await supabase.from('email_verification_tokens').delete().eq('user_id', userId)

    const { error } = await supabase
        .from('email_verification_tokens')
        .insert({ user_id: userId, token, expires_at: expiresAt.toISOString() })

    if (error) throw error
}

/**
 * Find a valid (non-expired) verification token.
 * Returns null if not found or expired.
 */
export async function findVerificationToken(token) {
    const { data, error } = await supabase
        .from('email_verification_tokens')
        .select('id, user_id, expires_at')
        .eq('token', token)
        .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    // Check expiry in application layer
    if (new Date(data.expires_at) < new Date()) return null

    return data
}

export async function consumeVerificationToken(token) {
    await supabase.from('email_verification_tokens').delete().eq('token', token)
}

// ─────────────────────────────────────────────────────────────────────────────
// Password Reset Tokens
// ─────────────────────────────────────────────────────────────────────────────

export async function createPasswordResetToken(userId, token, expiresAt) {
    // Remove any existing reset tokens for this user
    await supabase.from('password_reset_tokens').delete().eq('user_id', userId)

    const { error } = await supabase
        .from('password_reset_tokens')
        .insert({ user_id: userId, token, expires_at: expiresAt.toISOString() })

    if (error) throw error
}

/**
 * Find a valid (non-expired) password reset token.
 * Returns null if not found or expired.
 */
export async function findPasswordResetToken(token) {
    const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('id, user_id, expires_at')
        .eq('token', token)
        .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    if (new Date(data.expires_at) < new Date()) return null

    return data
}

export async function consumePasswordResetToken(token) {
    await supabase.from('password_reset_tokens').delete().eq('token', token)
}
