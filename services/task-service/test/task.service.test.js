import test from 'node:test'
import assert from 'node:assert/strict'
import {
    assignTask,
    getTaskById,
    updateTask,
    addProgress
} from '../src/services/task.service.js'

test('task service exposes its public operations', () => {
    assert.equal(typeof assignTask, 'function')
    assert.equal(typeof getTaskById, 'function')
    assert.equal(typeof updateTask, 'function')
    assert.equal(typeof addProgress, 'function')
})

