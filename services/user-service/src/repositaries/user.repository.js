import { supabase } from '../lib/supabase.js'

/**
 * Find a user by email.
 * Returns null (not an error) if the user doesn't exist.
 */
export async function findUserByEmail(email) {
    const { data, error } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, email, password_hash, status')
        .eq('email', email)
        .single()

    // PGRST116 = "no rows returned" — expected when email not found
    if (error && error.code !== 'PGRST116') throw error
    return data ?? null
}

/**
 * Insert a new user and return the created row (without password_hash).
 */
export async function createUser({ firstName, lastName, email, passwordHash }) {
    const { data, error } = await supabase
        .from('users')
        .insert({
            first_name: firstName,
            last_name: lastName,
            email,
            password_hash: passwordHash,
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
 * Fetch all ACTIVE memberships for a user across all organizations.
 * Returns: [{ org_id, role }, ...] — empty array for new users with no memberships.
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
