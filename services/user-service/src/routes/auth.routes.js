import { Router } from 'express'
import { register, login, getProfile } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = Router()

// Public — no auth required
router.post('/register', register)
router.post('/login', login)

// Protected — valid JWT required
router.get('/profile', authenticate, getProfile)

export default router
