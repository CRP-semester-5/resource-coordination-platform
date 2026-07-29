import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as userRepo from '../repositaries/user.repository.js'

const SALT_ROUNDS = 12
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/**
 * Register a new user.
 * - Checks for duplicate email
 * - Hashes password with bcrypt
 * - Returns created user row (no password)
 */
export async function register({ firstName, lastName, email, password }) {
    if (!JWT_SECRET) throw new Error('JWT_SECRET env variable is not set')

    const existing = await userRepo.findUserByEmail(email)
    if (existing) {
        const err = new Error('Email already registered')
        err.status = 409
        throw err
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await userRepo.createUser({ firstName, lastName, email, passwordHash })
    return user
}

/**
 * Login a user.
 * - Validates credentials
 * - Fetches all active org memberships for multi-tenant role context
 * - Signs and returns a JWT embedding all roles
 *
 * JWT payload:
 *   { sub: uuid, email, roles: [{ org_id, role }, ...], iat, exp }
 *
 * NOTE: roles is [] for newly registered users with no org membership yet.
 */
export async function login({ email, password }) {
    if (!JWT_SECRET) throw new Error('JWT_SECRET env variable is not set')

    // 1. Find user
    const user = await userRepo.findUserByEmail(email)
    if (!user) {
        const err = new Error('Invalid credentials')
        err.status = 401
        throw err
    }

    // 2. Check account status
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

    // 3. Verify password
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
        const err = new Error('Invalid credentials')
        err.status = 401
        throw err
    }

    // 4. Fetch all active org memberships (multi-tenant roles)
    const roles = await userRepo.findUserMemberships(user.user_id)

    // 5. Sign JWT
    const payload = {
        sub: user.user_id,
        email: user.email,
        roles,  // [{ org_id, role }, ...] — [] for brand-new users
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    return {
        token,
        userId: user.user_id,
        roles,
    }
}

/**
 * Get profile for the authenticated user by their UUID.
 */
export async function getProfile(userId) {
    return userRepo.findUserById(userId)
}
