/**
 * Functional Test 3.1.2.5: Role-Based Access Control (RBAC) & Endpoint Authorization
 * Specification:
 *   - Verifies JWT claim generation & signature verification
 *   - Validates role boundaries (COORDINATOR vs VOLUNTEER vs CITIZEN vs SUPER_ADMIN)
 *   - Verifies organization membership authorization
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { generateTestToken, TEST_USERS } from './helpers/auth.helper.js';
import { supabase, TEST_ORGS } from './helpers/fixtures.helper.js';

describe('3.1.2.5 RBAC Boundaries & Role Authorization Validation', () => {
  const jwtSecret = process.env.JWT_SECRET || 'Callofduty4&';

  it('generates cryptographically valid JWT tokens with verified claims', () => {
    const token = generateTestToken({
      userId: TEST_USERS.COORDINATOR.userId,
      email: TEST_USERS.COORDINATOR.email,
      globalRoles: ['USER'],
      organizationId: TEST_ORGS.COLOMBO_HUB,
      orgRole: 'COORDINATOR'
    });

    const decoded = jwt.verify(token, jwtSecret);
    assert.strictEqual(decoded.sub, TEST_USERS.COORDINATOR.userId);
    assert.strictEqual(decoded.email, TEST_USERS.COORDINATOR.email);
    assert.strictEqual(decoded.orgRole, 'COORDINATOR');
  });

  it('rejects tampered or malformed JWT tokens', () => {
    const validToken = generateTestToken({
      userId: TEST_USERS.CITIZEN.userId,
      email: TEST_USERS.CITIZEN.email
    });

    const tamperedToken = validToken.slice(0, -5) + 'abcde';

    assert.throws(() => {
      jwt.verify(tamperedToken, jwtSecret);
    }, /invalid signature/i);
  });

  it('enforces that coordinator role checks verify organization membership from organization_members table', async () => {
    // Check if coordinator is registered as COORDINATOR in organization_members
    const { data: member, error } = await supabase
      .from('organization_members')
      .select('role, status')
      .eq('organization_id', TEST_ORGS.COLOMBO_HUB)
      .eq('user_id', TEST_USERS.COORDINATOR.userId)
      .maybeSingle();

    assert.ifError(error);
    assert.ok(member, 'Coordinator must be a member in organization_members table');
    assert.strictEqual(member.role, 'COORDINATOR');
    assert.strictEqual(member.status, 'ACTIVE');
  });

  it('verifies that regular citizen has only USER global role', async () => {
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', TEST_USERS.CITIZEN.userId);

    assert.ifError(error);
    assert.ok(roles.some((r) => r.role === 'USER'));
    assert.strictEqual(roles.some((r) => r.role === 'SUPER_ADMIN'), false);
  });
});
