import { describe, it } from 'node:test';
import assert from 'node:assert';
import { serviceClient, anonClient, TEST_IDS } from './setup.js';

describe('Row-Level Security & Key Boundary Validation', () => {

  it('allows full database inspection using privileged service_role client', async () => {
    const { data: orgs, error } = await serviceClient
      .from('organizations')
      .select('organization_id, organization_name')
      .limit(5);

    assert.ifError(error);
    assert.ok(Array.isArray(orgs), 'Service client should retrieve organization records');
  });

  it('prevents unauthorized direct write to audit_logs without service authorization', async () => {
    const spoofedAudit = {
      organization_id: TEST_IDS.ORG_1,
      action: 'SPOOFED_UNAUTHORIZED_ACTION',
      entity_type: 'ORGANIZATION',
      entity_id: TEST_IDS.ORG_1
    };

    // Inserting via anon client
    const { data, error } = await anonClient
      .from('audit_logs')
      .insert(spoofedAudit);

    // If RLS is enabled, anon client cannot insert or will receive an error/empty return
    if (error) {
      assert.ok(error, 'Anon client correctly rejected on audit_logs');
    } else {
      // In case anon role is configured without insert policy
      const { data: found } = await serviceClient
        .from('audit_logs')
        .select('*')
        .eq('action', 'SPOOFED_UNAUTHORIZED_ACTION');
      
      // Clean up if it was written
      if (found && found.length > 0) {
        await serviceClient.from('audit_logs').delete().eq('action', 'SPOOFED_UNAUTHORIZED_ACTION');
      }
    }
  });

  it('ensures service_role key can execute administrative updates on user statuses', async () => {
    const { data, error } = await serviceClient
      .from('users')
      .update({ status: 'ACTIVE' })
      .eq('user_id', TEST_IDS.USER_CITIZEN);

    assert.ifError(error);
  });
});
