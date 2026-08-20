import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL ||= 'https://example.supabase.co'
process.env.SUPABASE_SECRET_KEY ||= 'test-secret-key'
const { createTaskService } = await import('../src/services/task.service.js')

test('assignTask assigns a volunteer and moves an unassigned task to assigned', async () => {
    const calls = []
    const repository = {
        getTaskById: async () => ({ data: { task_id: 'task-1', status: 'UNASSIGNED' }, error: null }),
        assignTask: async (taskId, volunteerId) => { calls.push(['assign', taskId, volunteerId]); return { data: { taskId, volunteerId }, error: null } },
        updateTask: async (taskId, data) => { calls.push(['update', taskId, data]); return { data: { taskId, ...data }, error: null } },
    }
    const result = await createTaskService(repository).assignTask('task-1', 'volunteer-1')
    assert.deepEqual(result, { taskId: 'task-1', volunteerId: 'volunteer-1' })
    assert.deepEqual(calls, [['assign', 'task-1', 'volunteer-1'], ['update', 'task-1', { status: 'ASSIGNED' }]])
})

test('assignTask maps duplicate assignments to a conflict error', async () => {
    const repository = { getTaskById: async () => ({ data: { status: 'ASSIGNED' }, error: null }), assignTask: async () => ({ data: null, error: { code: '23505', message: 'duplicate' } }) }
    await assert.rejects(() => createTaskService(repository).assignTask('task-1', 'volunteer-1'), { statusCode: 409, message: 'Volunteer already assigned to this task' })
})
