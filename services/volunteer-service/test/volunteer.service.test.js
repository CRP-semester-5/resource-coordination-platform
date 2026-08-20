import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL ||= 'https://example.supabase.co'
process.env.SUPABASE_SECRET_KEY ||= 'test-secret-key'
const { createVolunteerService } = await import('../src/services/volunteer.service.js')

test('registerVolunteer creates a volunteer and adds supplied skills', async () => {
    const skills = []
    const repository = {
        getVolunteerByUserId: async () => ({ data: null, error: { code: 'PGRST116' } }),
        createVolunteer: async data => ({ data: { volunteer_id: 'vol-1', ...data }, error: null }),
        addSkill: async (id, skill) => { skills.push([id, skill]); return { data: {}, error: null } },
    }
    const result = await createVolunteerService(repository).registerVolunteer('user-1', { skills: ['first aid', 'driving'] })
    assert.equal(result.volunteer_id, 'vol-1')
    assert.deepEqual(skills, [['vol-1', 'first aid'], ['vol-1', 'driving']])
})

test('registerVolunteer rejects an existing volunteer', async () => {
    const repository = { getVolunteerByUserId: async () => ({ data: { volunteer_id: 'vol-1' }, error: null }) }
    await assert.rejects(() => createVolunteerService(repository).registerVolunteer('user-1', {}), { statusCode: 400 })
})
