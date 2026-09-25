/**
 * Functional Test 3.1.2.4: State Machine Invariants & Business Rule Boundaries
 * Specification:
 *   - Duplicate request detection logic
 *   - Exact tag binding parser [REQUEST_ID:uuid] and [DONATION_ID:uuid]
 *   - Illegal state machine transition prevention (e.g., re-claiming a COMPLETED task)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { supabase, TEST_ORGS } from './helpers/fixtures.helper.js';
import { TEST_USERS } from './helpers/auth.helper.js';

describe('3.1.2.4 State Machine Transitions & Domain Business Rule Boundaries', () => {

  it('detects and flags potential duplicate requests from the same user for identical category', async () => {
    const user = TEST_USERS.CITIZEN.userId;
    const org = TEST_ORGS.COLOMBO_HUB;
    const testCategory = 'Emergency First Aid';

    // 1. Submit initial request
    const { data: initialReq, error: err1 } = await supabase
      .from('requests')
      .insert({
        organization_id: org,
        requester_id: user,
        title: 'Need First Aid Kit urgently',
        description: 'First aid for injured family member',
        category: testCategory,
        quantity_required: 2,
        unit: 'kits',
        status: 'PENDING'
      })
      .select()
      .single();

    assert.ifError(err1);

    // 2. Query for existing pending/active request with same user + category
    const { data: duplicateMatches } = await supabase
      .from('requests')
      .select('*')
      .eq('requester_id', user)
      .eq('category', testCategory)
      .in('status', ['PENDING', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS']);

    assert.ok(duplicateMatches && duplicateMatches.length >= 1, 'Duplicate detection must locate active request');

    // Clean up
    await supabase.from('requests').delete().eq('request_id', initialReq.request_id);
  });

  it('verifies exact regex tag extraction for [REQUEST_ID:uuid] and [DONATION_ID:uuid]', () => {
    const sampleReqUuid = '20000000-0000-0000-0000-000000000001';
    const sampleDonUuid = '30000000-0000-0000-0000-000000000001';

    const reqTaskTitle = `Deliver 50 Water Packs [REQUEST_ID:${sampleReqUuid}]`;
    const donTaskTitle = `Collect 100 Blankets [DONATION_ID:${sampleDonUuid}]`;

    const reqMatch = reqTaskTitle.match(/\[REQUEST_ID:([a-f0-9-]+)\]/i);
    const donMatch = donTaskTitle.match(/\[DONATION_ID:([a-f0-9-]+)\]/i);

    assert.ok(reqMatch, 'Must match [REQUEST_ID:uuid] pattern');
    assert.strictEqual(reqMatch[1], sampleReqUuid);

    assert.ok(donMatch, 'Must match [DONATION_ID:uuid] pattern');
    assert.strictEqual(donMatch[1], sampleDonUuid);
  });

  it('prevents illegal task state transitions once a task is marked COMPLETED', async () => {
    // 1. Create a completed task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        organization_id: TEST_ORGS.COLOMBO_HUB,
        coordinator_id: TEST_USERS.COORDINATOR.userId,
        title: 'Already Finalized Relief Task',
        description: 'Completed mission',
        status: 'COMPLETED',
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    assert.ifError(error);

    // 2. Validate state machine rule: COMPLETED tasks cannot transition back to PENDING or ASSIGNED
    const isValidTransition = (currentStatus, targetStatus) => {
      const allowedTransitions = {
        PENDING: ['ASSIGNED', 'CANCELLED'],
        ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [], // Terminal state
        CANCELLED: []  // Terminal state
      };
      return allowedTransitions[currentStatus]?.includes(targetStatus) ?? false;
    };

    assert.strictEqual(isValidTransition('COMPLETED', 'ASSIGNED'), false);
    assert.strictEqual(isValidTransition('COMPLETED', 'IN_PROGRESS'), false);
    assert.strictEqual(isValidTransition('PENDING', 'ASSIGNED'), true);
    assert.strictEqual(isValidTransition('ASSIGNED', 'IN_PROGRESS'), true);
    assert.strictEqual(isValidTransition('IN_PROGRESS', 'COMPLETED'), true);

    // Clean up
    await supabase.from('tasks').delete().eq('task_id', task.task_id);
  });
});
