/**
 * env.js — Centralised, fail-fast environment variable access.
 *
 * Import from here instead of reading process.env directly in service files.
 * The module validates required vars at startup so misconfiguration is caught
 * immediately, not at the first request that touches a missing value.
 */

const required = (name) => {
    const value = process.env[name]
    if (!value) throw new Error(`Missing required environment variable: ${name}`)
    return value
}

const optional = (name, defaultValue = '') => process.env[name] ?? defaultValue

export const env = {
    // ── Runtime ────────────────────────────────────────────────────
    nodeEnv: optional('NODE_ENV', 'development'),
    port: parseInt(optional('USER_SERVICE_PORT', '3001'), 10),

    // ── Database / Supabase ────────────────────────────────────────
    supabaseUrl: required('SUPABASE_URL'),
    supabaseSecretKey: required('SUPABASE_SECRET_KEY'),

    // ── JWT ────────────────────────────────────────────────────────
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),

    // ── Email ──────────────────────────────────────────────────────
    smtpHost: optional('SMTP_HOST', 'smtp.ethereal.email'),
    smtpPort: parseInt(optional('SMTP_PORT', '587'), 10),
    smtpUser: optional('SMTP_USER', ''),
    smtpPass: optional('SMTP_PASS', ''),
    emailFrom: optional('EMAIL_FROM', 'ResQ Hub <noreply@resqhub.local>'),

    // ── App ────────────────────────────────────────────────────────
    frontendUrl: optional('FRONTEND_URL', 'http://localhost:5173'),
    emailVerificationExpiresMinutes: parseInt(
        optional('EMAIL_VERIFICATION_EXPIRES_MINUTES', '60'),
        10
    ),
    passwordResetExpiresMinutes: parseInt(
        optional('PASSWORD_RESET_EXPIRES_MINUTES', '15'),
        10
    ),
}
