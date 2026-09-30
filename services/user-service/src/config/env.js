import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Walk up: src/config/ -> src/ -> user-service/ -> services/ -> repo root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

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
