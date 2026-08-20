import test from 'node:test'
import assert from 'node:assert/strict'
import { registerSchema, loginSchema, verifyEmailSchema } from '../src/validators/auth.validators.js'

test('user registration accepts a valid payload', () => {
    const result = registerSchema.validate({ first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', phone: '1234567890', password: 'Password1' })
    assert.equal(result.error, undefined)
})

test('user registration rejects a weak password', () => {
    const result = registerSchema.validate({ first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', phone: '1234567890', password: 'password' })
    assert.ok(result.error)
})

test('email verification requires a 64-character hex token', () => {
    assert.equal(verifyEmailSchema.validate({ token: 'a'.repeat(64) }).error, undefined)
    assert.ok(verifyEmailSchema.validate({ token: 'not-a-token' }).error)
    assert.equal(loginSchema.validate({ email: 'invalid', password: 'secret' }).error.details[0].path[0], 'email')
})
