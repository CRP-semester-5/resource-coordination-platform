import express from 'express'
import { authenticate } from '@crp/shared-middleware'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createInternalNotification
} from '../controllers/notification.controller.js'

const router = express.Router()


router.post('/internal', createInternalNotification)

router.use(authenticate)

router.get('/', getNotifications)
router.patch('/read-all', markAllAsRead)
router.patch('/:notificationId/read', markAsRead)

export default router