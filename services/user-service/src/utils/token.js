import crypto from 'crypto'

/**
 * Generate a cryptographically secure random hex token.
 * Default 32 bytes → 64-character hex string.
 */
export function generateToken(byteLength = 32) {
    return crypto.randomBytes(byteLength).toString('hex')
}

/**
 * Returns a Date object N minutes from now — used for token expiry.
 */
export function tokenExpiresAt(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000)
}
