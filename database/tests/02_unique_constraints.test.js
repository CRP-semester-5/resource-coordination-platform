/**
 * Test Suite 3.1.1.2: Unique Constraint & Candidate Key Validation
 * Target: Verify that duplicate unique values/keys are rejected with SQL error 23505 (unique_violation).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { serviceClient, TEST_IDS } from './setup.js';

describe('3.1.1.2 Unique Constraint Validation', () => {

  it('rejects duplicate user email addresses (unique_violation: 23505)', async () => {
    const duplicateUser = {
      first_name: 'Imposter',
      last_name: 'Coordinator',
      email: 'kasun.coordinator@resqhub.test', // Already assigned to TEST_IDS.USER_COORDINATOR
      phone: '+94779999999'
    };

    const { data, error } = await serviceClient.from('users').insert(duplicateUser);
    assert.ok(error, 'Expected insert to fail due to duplicate email');
    assert.strictEqual(error.code, '23505', `Expected error 23505 (unique_violation), got: ${error.code} (${error.message})`);
  });

  it('rejects duplicate organization member assignment for same org (unique_violation: 23505)', async () => {
    // Ensure initial member exists
    await serviceClient.from('organization_members').upsert({
      organization_id: TEST_IDS.ORG_1,
      user_id: TEST_IDS.USER_COORDINATOR,
      role: 'COORDINATOR',
      status: 'ACTIVE'
    }, { onConflict: 'organization_id,user_id' });

    // Attempt to insert duplicate organization member
    const duplicateMember = {
      organization_id: TEST_IDS.ORG_1,
      user_id: TEST_IDS.USER_COORDINATOR,
      role: 'ORGANIZATION_ADMIN',
      status: 'ACTIVE'
    };

    const { data, error } = await serviceClient.from('organization_members').insert(duplicateMember);
    assert.ok(error, 'Expected insert to fail due to composite unique constraint (organization_id, user_id)');
    assert.strictEqual(error.code, '23505');
  });

  it('rejects duplicate volunteer assignment on the same task (unique_violation: 23505)', async () => {
    // Ensure task and volunteer exist
    const taskId = '40000000-0000-0000-0000-000000000001';
    const volunteerId = '30000000-0000-0000-0000-000000000001';

    // Ensure initial assignment exists
    await serviceClient.from('task_assignments').upsert({
      task_id: taskId,
      volunteer_id: volunteerId,
      assigned_by: TEST_IDS.USER_COORDINATOR,
      assignment_status: 'ACCEPTED'
    }, { onConflict: 'task_id,volunteer_id' });

    // Attempt duplicate assignment insert
    const duplicateAssignment = {
      task_id: taskId,
      volunteer_id: volunteerId,
      assigned_by: TEST_IDS.USER_COORDINATOR,
      assignment_status: 'ACCEPTED'
    };

    const { data, error } = await serviceClient.from('task_assignments').insert(duplicateAssignment);
    assert.ok(error, 'Expected insert to fail for duplicate task assignment');
    assert.strictEqual(error.code, '23505');
  });

  it('rejects duplicate resource in the same organization and location (unique_violation: 23505)', async () => {
    const duplicateResource = {
      organization_id: TEST_IDS.ORG_1,
      resource_name: 'Mineral Water 5L',
      category: 'Water & Sanitation',
      quantity_available: 100,
      unit: 'bottles',
      location: 'Warehouse Bay A1' // Same org, name, unit, location as seeded resource
    };

    const { data, error } = await serviceClient.from('resources').insert(duplicateResource);
    assert.ok(error, 'Expected insert to fail for duplicate resource unique composite key');
    assert.strictEqual(error.code, '23505');
  });
});
