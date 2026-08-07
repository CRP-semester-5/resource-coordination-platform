import { NotificationRepository } from '../repositories/notification.repository.js'
import { sendNotificationToUser } from '../sockets/socketManager.js'
import { createNotificationSchema } from '../validators/notification.validator.js'

export const getNotifications = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id']
    const userId = req.user.sub

    const notifications = await NotificationRepository.getUserNotifications(userId, organizationId)
    res.json({ notifications })
  } catch (err) {
    next(err)
  }
}

export const markAsRead = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id']
    const userId = req.user.sub
    const { notificationId } = req.params

    const notification = await NotificationRepository.markAsRead(notificationId, userId, organizationId)
    res.json({ message: 'Notification marked as read', notification })
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Notification not found' })
    }
    next(err)
  }
}

export const markAllAsRead = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id']
    const userId = req.user.sub

    const notifications = await NotificationRepository.markAllAsRead(userId, organizationId)
    res.json({ message: 'All notifications marked as read', notifications })
  } catch (err) {
    next(err)
  }
}

//(Task Service, Request Service) to generate and push a notification
export const createInternalNotification = async (req, res, next) => {
  try {
    const { error, value } = createNotificationSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const notification = await NotificationRepository.createNotification(value)

    sendNotificationToUser(value.user_id, notification)

    res.status(201).json({ message: 'Notification created and dispatched', notification })
  } catch (err) {
    next(err)
  }
}
