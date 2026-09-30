import { describe, it } from 'node:test';
import assert from 'node:assert';
import { serviceClient } from './setup.js';

describe('PostgreSQL Triggers & Automated Procedures', () => {

  it('executes assign_default_user_role() trigger upon new user creation', async () => {
    const uniqueEmail = `trigger.test.${Date.now()}@resqhub.test`;
    
    // 1. Insert user
    const { data: user, error: userErr } = await serviceClient
      .from('users')
      .insert({
        first_name: 'Trigger',
        last_name: 'Tester',
        email: uniqueEmail,
        status: 'ACTIVE'
      })
      .select()
      .single();

    assert.ifError(userErr);
    assert.ok(user?.user_id);

    // 2. Query user_roles directly to assert trigger execution
    const { data: roles, error: roleErr } = await serviceClient
      .from('user_roles')
      .select('*')
      .eq('user_id', user.user_id);

    assert.ifError(roleErr);
    assert.ok(roles.length > 0, 'Trigger must automatically insert a role');
    assert.strictEqual(roles[0].role, 'USER', 'Default role must be USER');

    // Clean up
    await serviceClient.from('users').delete().eq('user_id', user.user_id);
  });

  it('executes set_updated_at() trigger on row update', async () => {
    const uniqueEmail = `updatedat.test.${Date.now()}@resqhub.test`;

    // 1. Insert user
    const { data: user, error: createErr } = await serviceClient
      .from('users')
      .insert({
        first_name: 'Initial',
        last_name: 'Name',
        email: uniqueEmail,
        status: 'ACTIVE'
      })
      .select()
      .single();

    assert.ifError(createErr);
    const initialUpdatedAt = new Date(user.updated_at).getTime();

    // Sleep 100ms to guarantee timestamp advancement
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 2. Update user
    const { data: updatedUser, error: updateErr } = await serviceClient
      .from('users')
      .update({ first_name: 'Modified' })
      .eq('user_id', user.user_id)
      .select()
      .single();

    assert.ifError(updateErr);
    const newUpdatedAt = new Date(updatedUser.updated_at).getTime();

    assert.ok(
      newUpdatedAt > initialUpdatedAt,
      `Expected updated_at to advance after update. Initial: ${user.updated_at}, New: ${updatedUser.updated_at}`
    );

    // Clean up
    await serviceClient.from('users').delete().eq('user_id', user.user_id);
  });
});
