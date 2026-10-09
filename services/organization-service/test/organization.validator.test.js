import test from 'node:test'
import assert from 'node:assert/strict'
import { createOrganizationSchema } from '../src/validators/organization.validator.js'

test('organization validation accepts required fields and optional contact data', () => {
    const result = createOrganizationSchema.validate({ organization_name: 'Community Aid', email: 'aid@example.com', phone: '+1 555 123 4567' })
    assert.equal(result.error, undefined)
})

test('organization validation rejects names shorter than three characters', () => {
    const result = createOrganizationSchema.validate({ organization_name: 'Aid' .slice(0, 2) })
    assert.equal(result.error.details[0].type, 'string.min')
})

test('organization validation rejects invalid contact details', () => {
    assert.ok(createOrganizationSchema.validate({ organization_name: 'Community Aid', email: 'invalid' }).error)
    assert.ok(createOrganizationSchema.validate({ organization_name: 'Community Aid', phone: 'abc' }).error)
})

test('organization validation trims the organization name', () => {
    const result = createOrganizationSchema.validate({ organization_name: '  Community Aid  ' })
    assert.equal(result.error, undefined)
    assert.equal(result.value.organization_name, 'Community Aid')
})
