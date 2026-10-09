import test from 'node:test'
import assert from 'node:assert/strict'
import { createNotificationService } from '../src/services/notification.service.js'

test('notification service returns unread count and marks all as read', async () => {
    let markedUser
    const repository = {
        getUnreadCount: async () => ({ count: 3, error: null }),
        markAllAsRead: async userId => { markedUser = userId; return { error: null } },
    }
    const service = createNotificationService(repository)
    assert.deepEqual(await service.getUnreadCount('user-1'), { count: 3 })
    assert.deepEqual(await service.markAllAsRead('user-1'), { success: true })
    assert.equal(markedUser, 'user-1')
})

test('markAsRead maps missing notifications to not found', async () => {
    const repository = { markAsRead: async () => ({ data: null, error: null }) }
    await assert.rejects(() => createNotificationService(repository).markAsRead('notification-1', 'user-1'), { statusCode: 404 })
})

test('markAsRead returns the updated notification', async () => {
    const notification = { notification_id: 'notification-1', is_read: true }
    const repository = {
        markAsRead: async (notificationId, userId) => {
            assert.equal(notificationId, 'notification-1')
            assert.equal(userId, 'user-1')
            return { data: notification, error: null }
        },
    }
    assert.deepEqual(await createNotificationService(repository).markAsRead('notification-1', 'user-1'), notification)
})

test('getUnreadCount propagates repository errors', async () => {
    const repository = { getUnreadCount: async () => ({ count: null, error: { message: 'database unavailable' } }) }
    await assert.rejects(() => createNotificationService(repository).getUnreadCount('user-1'), { message: 'database unavailable' })
})
