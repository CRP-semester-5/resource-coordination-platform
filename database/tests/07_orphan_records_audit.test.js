/**
 * Test Suite 3.1.1.7: Orphan Records Audit & Referential Snapshot
 * Target: Verify zero unlinked rows (orphaned foreign references) across dependent tables.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { serviceClient } from './setup.js';

describe('3.1.1.7 Orphan Records Audit & Relational Integrity', () => {

  it('audits task_assignments for orphaned task references', async () => {
    // Check that every task_assignment has a valid task in tasks table
    const { data: assignments, error: aErr } = await serviceClient
      .from('task_assignments')
      .select('task_id');

    assert.ifError(aErr);

    if (assignments && assignments.length > 0) {
      const taskIds = [...new Set(assignments.map((a) => a.task_id))];
      const { data: tasks, error: tErr } = await serviceClient
        .from('tasks')
        .select('task_id')
        .in('task_id', taskIds);

      assert.ifError(tErr);
      const existingTaskIds = new Set(tasks.map((t) => t.task_id));

      const orphaned = taskIds.filter((id) => !existingTaskIds.has(id));
      assert.strictEqual(
        orphaned.length,
        0,
        `Found orphaned task_assignments referencing non-existent tasks: ${orphaned.join(', ')}`
      );
    }
  });

  it('audits requests for orphaned organization references', async () => {
    const { data: requests, error: rErr } = await serviceClient
      .from('requests')
      .select('request_id, organization_id')
      .not('organization_id', 'is', null);

    assert.ifError(rErr);

    if (requests && requests.length > 0) {
      const orgIds = [...new Set(requests.map((r) => r.organization_id))];
      const { data: orgs, error: oErr } = await serviceClient
        .from('organizations')
        .select('organization_id')
        .in('organization_id', orgIds);

      assert.ifError(oErr);
      const existingOrgIds = new Set(orgs.map((o) => o.organization_id));

      const orphaned = requests.filter((r) => !existingOrgIds.has(r.organization_id));
      assert.strictEqual(
        orphaned.length,
        0,
        `Found orphaned requests referencing non-existent organizations: ${orphaned.map((r) => r.request_id).join(', ')}`
      );
    }
  });

  it('audits inventory_transactions for orphaned resource references', async () => {
    const { data: txs, error: txErr } = await serviceClient
      .from('inventory_transactions')
      .select('transaction_id, resource_id');

    assert.ifError(txErr);

    if (txs && txs.length > 0) {
      const resourceIds = [...new Set(txs.map((t) => t.resource_id))];
      const { data: resources, error: resErr } = await serviceClient
        .from('resources')
        .select('resource_id')
        .in('resource_id', resourceIds);

      assert.ifError(resErr);
      const existingResIds = new Set(resources.map((r) => r.resource_id));

      const orphaned = txs.filter((t) => !existingResIds.has(t.resource_id));
      assert.strictEqual(
        orphaned.length,
        0,
        `Found orphaned inventory_transactions referencing deleted resources: ${orphaned.map((t) => t.transaction_id).join(', ')}`
      );
    }
  });
});
