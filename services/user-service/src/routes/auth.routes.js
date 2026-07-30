import { Router } from 'express'
import {
    register,
    login,
    verifyEmail,
    verifyEmailGet,
    forgotPassword,
    resetPassword,
    logout,
} from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import {
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from '../validators/auth.validators.js'

const router = Router()

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
// POST — called directly by API clients / Postman
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail)

// GET — handles clicks from the verification email link
// e.g. http://localhost:3001/api/v1/auth/verify-email?token=abc123...
router.get('/verify-email', verifyEmailGet)
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), resetPassword)

// ── Protected ─────────────────────────────────────────────────────────────────
router.post('/logout', authenticate, logout)

export default router
