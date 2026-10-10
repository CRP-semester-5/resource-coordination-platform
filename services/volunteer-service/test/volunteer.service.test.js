import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL ||= 'https://example.supabase.co'
process.env.SUPABASE_SECRET_KEY ||= 'test-secret-key'

const {
    registerVolunteer,
    getVolunteers,
    getVolunteerById,
    getVolunteerByUserId,
    addSkill
} = await import('../src/services/volunteer.service.js')

test('volunteer service exposes its public operations', () => {
    assert.equal(typeof registerVolunteer, 'function')
    assert.equal(typeof getVolunteers, 'function')
    assert.equal(typeof getVolunteerById, 'function')
    assert.equal(typeof getVolunteerByUserId, 'function')
    assert.equal(typeof addSkill, 'function')
})
