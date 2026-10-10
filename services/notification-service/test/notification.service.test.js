import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} from '../src/services/notification.service.js'

test('notification service exposes its public operations', () => {
    assert.equal(typeof getNotifications, 'function')
    assert.equal(typeof getUnreadCount, 'function')
    assert.equal(typeof markAsRead, 'function')
    assert.equal(typeof markAllAsRead, 'function')
})

