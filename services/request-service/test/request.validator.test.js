import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequestSchema, updateRequestSchema } from '../src/validators/request.validator.js'

const validRequest = { organization_id: '11111111-1111-4111-8111-111111111111', requester_id: '22222222-2222-4222-8222-222222222222', title: 'Urgent water', description: 'Need water for families', category: 'Supplies', location: 'North district', quantity_required: 10, unit: 'liters' }

test('request validation defaults urgency and personal flag', () => {
    const result = createRequestSchema.validate(validRequest)
    assert.equal(result.error, undefined)
    assert.equal(result.value.urgency, 'MEDIUM')
    assert.equal(result.value.is_personal, false)
})

test('request update rejects empty updates and invalid urgency', () => {
    assert.ok(updateRequestSchema.validate({}).error)
    assert.ok(updateRequestSchema.validate({ urgency: 'IMMEDIATE' }).error)
})
