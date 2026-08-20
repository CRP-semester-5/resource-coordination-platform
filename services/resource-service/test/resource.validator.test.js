import test from 'node:test'
import assert from 'node:assert/strict'
import { createResourceSchema, updateResourceSchema } from '../src/validators/resource.validator.js'

const validResource = { organization_id: '11111111-1111-4111-8111-111111111111', resource_name: 'Water', category: 'Supplies', unit: 'liters' }

test('resource validation applies quantity defaults', () => {
    const result = createResourceSchema.validate(validResource)
    assert.equal(result.error, undefined)
    assert.equal(result.value.quantity_available, 0)
    assert.equal(result.value.quantity_reserved, 0)
})

test('resource update requires at least one field', () => {
    assert.ok(updateResourceSchema.validate({}).error)
    assert.equal(updateResourceSchema.validate({ unit: 'boxes' }).error, undefined)
})
