import { describe, it } from 'node:test';
import assert from 'node:assert';
import { serviceClient, TEST_IDS } from './setup.js';

describe('Foreign Key Integrity, Restricts & Cascades', () => {

  it('rejects insertion with non-existent foreign key UUID (foreign_key_violation: 23503)', async () => {
    const invalidFkReq = {
      organization_id: '99999999-9999-9999-9999-999999999999', // Non-existent org
      requester_id: TEST_IDS.USER_CITIZEN,
      title: 'Ghost Organization Request',
      description: 'Foreign key test',
      category: 'Food & Nutrition',
      quantity_required: 10,
      unit: 'packs'
    };

    const { data, error } = await serviceClient.from('requests').insert(invalidFkReq);
    assert.ok(error, 'Expected insert with invalid FK to fail');
    assert.strictEqual(error.code, '23503', `Expected 23503 (foreign_key_violation), got: ${error.code}`);
  });

  it('enforces ON DELETE RESTRICT on organization deletion when active requests exist', async () => {
    // Attempt to delete ORG_1 which has active requests and resources
    const { data, error } = await serviceClient
      .from('organizations')
      .delete()
      .eq('organization_id', TEST_IDS.ORG_1);

    assert.ok(error, 'Expected organization delete to be restricted by child records');
    assert.strictEqual(error.code, '23503');
  });

  it('enforces ON DELETE CASCADE on user deletion to automatically clean up addresses and roles', async () => {
    // 1. Create a temporary user
    const tempUserEmail = `temp.cascade.${Date.now()}@resqhub.test`;
    const { data: newUser, error: createErr } = await serviceClient
      .from('users')
      .insert({
        first_name: 'Cascade',
        last_name: 'TestUser',
        email: tempUserEmail,
        status: 'ACTIVE'
      })
      .select()
      .single();

    assert.ifError(createErr);
    assert.ok(newUser?.user_id);

    const tempUserId = newUser.user_id;

    // 2. Add address for the temporary user
    const { error: addrErr } = await serviceClient
      .from('user_addresses')
      .insert({
        user_id: tempUserId,
        address_line1: '123 Cascade St',
        city: 'Kandy'
      });

    assert.ifError(addrErr);

    // 3. Delete the temporary user
    const { error: delErr } = await serviceClient
      .from('users')
      .delete()
      .eq('user_id', tempUserId);

    assert.ifError(delErr);

    // 4. Verify user_addresses was cascaded
    const { data: addressRows, error: checkAddrErr } = await serviceClient
      .from('user_addresses')
      .select('*')
      .eq('user_id', tempUserId);

    assert.ifError(checkAddrErr);
    assert.strictEqual(addressRows.length, 0, 'Expected child user_addresses to be deleted via CASCADE');

    // 5. Verify user_roles was cascaded
    const { data: roleRows, error: checkRoleErr } = await serviceClient
      .from('user_roles')
      .select('*')
      .eq('user_id', tempUserId);

    assert.ifError(checkRoleErr);
    assert.strictEqual(roleRows.length, 0, 'Expected child user_roles to be deleted via CASCADE');
  });
});
