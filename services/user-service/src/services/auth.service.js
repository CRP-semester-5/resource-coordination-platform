import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as userRepo from '../repositaries/user.repository.js'
import * as emailService from './email.service.js'
import { generateToken, tokenExpiresAt } from '../utils/token.js'
import { env } from '../config/env.js'

const SALT_ROUNDS = 12

// ─────────────────────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register a new user.
 * - Checks for duplicate email
 * - Hashes password with bcrypt
 * - Creates user with PENDING status
 * - Sends email verification email
 * - Returns created user row (no password)
 */
export async function register({ firstName, lastName, email, password }) {
    const existing = await userRepo.findUserByEmail(email)
    if (existing) {
        const err = new Error('Email already registered')
        err.status = 409
        throw err
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await userRepo.createUser({ firstName, lastName, email, passwordHash })

    // Safety-net: assign the USER global role.
    // The DB trigger does this automatically, but we do it here too
    // in case the trigger hasn't been applied to the Supabase instance yet.
    await userRepo.assignDefaultRole(user.user_id)

    // Generate and store email verification token
    const token = generateToken()
    const expiresAt = tokenExpiresAt(env.emailVerificationExpiresMinutes)
    await userRepo.createVerificationToken(user.user_id, token, expiresAt)

    // Send verification email (non-blocking — don't fail registration if email fails)
    emailService.sendVerificationEmail(email, token).catch((err) => {
        console.error(`[email] Failed to send verification email to ${email}:`, err.message)
    })

    return user
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify Email
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify a user's email address using the token from the verification email.
 * - Validates the token (exists + not expired)
 * - Activates the user account (PENDING → ACTIVE)
 * - Consumes the token so it cannot be reused
 */
export async function verifyEmail(token) {
    const record = await userRepo.findVerificationToken(token)
    if (!record) {
        const err = new Error('Invalid or expired verification token')
        err.status = 400
        throw err
    }

    // Activate the user
    await userRepo.updateUser(record.user_id, { status: 'ACTIVE' })

    // Consume the token — one-time use
    await userRepo.consumeVerificationToken(token)
}

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Login a user.
 * - Validates credentials
 * - Blocks PENDING (unverified), SUSPENDED, INACTIVE accounts
 * - Fetches global roles from user_roles table
 * - Signs and returns a JWT with globalRoles in the payload
 *
 * JWT payload:
 *   { sub: uuid, email, globalRoles: ['USER', 'VOLUNTEER'], iat, exp }
 *
 * Organization roles (COORDINATOR, ORGANIZATION_ADMIN) are NOT embedded in
 * the JWT. They are checked from the organization_members table by each
 * service's authorization middleware on every request. This ensures that
 * role changes (e.g. removing a coordinator) take effect immediately.
 */
export async function login({ email, password }) {
    const user = await userRepo.findUserByEmail(email)
    if (!user) {
        const err = new Error('Invalid credentials')
        err.status = 401
        throw err
    }

    if (user.status === 'PENDING') {
        const err = new Error('Please verify your email address before logging in')
        err.status = 403
        throw err
    }

    if (user.status === 'SUSPENDED') {
        const err = new Error('Account is suspended. Please contact support.')
        err.status = 403
        throw err
    }

    if (user.status === 'INACTIVE') {
        const err = new Error('Account is inactive.')
        err.status = 403
        throw err
    }

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
        const err = new Error('Invalid credentials')
        err.status = 401
        throw err
    }

    // Fetch global roles from user_roles table
    // (org roles like COORDINATOR are checked from DB per request, not in JWT)
    const globalRoles = await userRepo.findUserGlobalRoles(user.user_id)

    const payload = {
        sub:         user.user_id,
        email:       user.email,
        globalRoles, // e.g. ['USER'] or ['USER', 'VOLUNTEER']
    }

    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })

    return {
        token,
        user: {
            user_id:    user.user_id,
            email:      user.email,
            first_name: user.first_name,
            last_name:  user.last_name,
            globalRoles,
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Forgot Password
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initiate the password reset flow.
 * - Looks up user by email
 * - Generates a short-lived reset token
 * - Sends reset email
 *
 * Always returns success — we never reveal whether an email is registered
 * (prevents user enumeration attacks).
 */
export async function forgotPassword(email) {
    const user = await userRepo.findUserByEmail(email)

    if (user && user.status === 'ACTIVE') {
        const token = generateToken()
        const expiresAt = tokenExpiresAt(env.passwordResetExpiresMinutes)
        await userRepo.createPasswordResetToken(user.user_id, token, expiresAt)

        emailService.sendPasswordResetEmail(email, token).catch((err) => {
            console.error(`[email] Failed to send reset email to ${email}:`, err.message)
        })
    }

    // Always return the same message — do not leak whether the email exists
    return {
        message: 'If an account with that email exists, a reset link has been sent.',
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset Password
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complete the password reset flow.
 * - Validates the reset token (exists + not expired)
 * - Hashes the new password
 * - Updates the user's password
 * - Consumes the token
 */
export async function resetPassword(token, newPassword) {
    const record = await userRepo.findPasswordResetToken(token)
    if (!record) {
        const err = new Error('Invalid or expired reset token')
        err.status = 400
        throw err
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await userRepo.updateUser(record.user_id, { password_hash: passwordHash })
    await userRepo.consumePasswordResetToken(token)
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Profile (used by auth/profile endpoint)
// ─────────────────────────────────────────────────────────────────────────────

export async function getProfile(userId) {
    return userRepo.findUserById(userId)
}
