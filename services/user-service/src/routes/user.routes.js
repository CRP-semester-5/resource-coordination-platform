import { Router } from 'express'
import {
    getMe,
    updateMe,
    getUserById,
    getMyAddresses,
    addAddress,
    deleteAddress,
} from '../controllers/user.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { updateProfileSchema, addAddressSchema } from '../validators/user.validators.js'

const router = Router()

// All user routes require authentication
router.use(authenticate)

// ── Own profile ───────────────────────────────────────────────────────────────
router.get('/me', getMe)
router.patch('/me', validate(updateProfileSchema), updateMe)

// ── Own addresses ─────────────────────────────────────────────────────────────
router.get('/me/addresses', getMyAddresses)
router.post('/me/addresses', validate(addAddressSchema), addAddress)
router.delete('/me/addresses/:addressId', deleteAddress)

// ── User lookup (inter-service / admin) ───────────────────────────────────────
// NOTE: This route must come AFTER /me routes to avoid :userId matching "me"
router.get('/:userId', getUserById)

export default router
