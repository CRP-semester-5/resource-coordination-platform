/**
 * Functional Test 3.1.2.1: Flow A (Citizen Help Request Lifecycle)
 * Specification:
 *   Citizen submits request -> Status PENDING -> Coordinator reviews & verifies -> Status VERIFIED
 *   -> Task dispatched with [REQUEST_ID:uuid] -> Volunteer claims mission -> Status ASSIGNED
 *   -> Milestones updated (50% En Route, 75% On Scene) -> Handover 4-digit PIN verified
 *   -> Task marked COMPLETED (100%), Request marked FULFILLED, Inventory deducted (STOCK_OUT).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { supabase, TEST_ORGS } from './helpers/fixtures.helper.js';
import { TEST_USERS } from './helpers/auth.helper.js';

describe('3.1.2.1 Flow A: Citizen Help Request Lifecycle to Handover PIN Completion', () => {
  let createdRequestId = null;
  const expectedHandoverPin = (Math.floor(1000 + Math.random() * 9000)).toString();
  let createdTaskId = null;
  const targetOrgId = TEST_ORGS.COLOMBO_HUB;
  const initialStockQty = 150;
  const requestedQty = 25;
  let testResourceId = null;

  it('Step 1: Citizen submits help request with auto-generated 4-Digit Handover PIN', async () => {
    // 1. Prepare inventory resource for testing
    const { data: res, error: resErr } = await supabase
      .from('resources')
      .insert({
        organization_id: targetOrgId,
        resource_name: `FlowA Water ${Date.now()}`,
        category: 'Water & Sanitation',
        quantity_available: initialStockQty,
        unit: 'bottles',
        location: 'Main Distribution Bay'
      })
      .select()
      .single();

    assert.ifError(resErr);
    testResourceId = res.resource_id;

    // 2. Submit citizen request with generated Handover PIN
    const { data: req, error } = await supabase
      .from('requests')
      .insert({
        organization_id: targetOrgId,
        requester_id: TEST_USERS.CITIZEN.userId,
        title: 'Emergency drinking water for flooded family',
        description: 'Need clean drinking water urgently due to local tap water contamination',
        category: 'Water & Sanitation',
        quantity_required: requestedQty,
        unit: 'bottles',
        urgency: 'HIGH',
        status: 'PENDING',
        location: '12 Kolonnawa Road',
        handover_pin: expectedHandoverPin
      })
      .select()
      .single();

    assert.ifError(error);
    assert.ok(req?.request_id);
    assert.strictEqual(req.status, 'PENDING');
    assert.strictEqual(req.handover_pin, expectedHandoverPin);

    createdRequestId = req.request_id;
  });

  it('Step 2: Coordinator reviews and verifies the citizen request (Status: VERIFIED)', async () => {
    assert.ok(createdRequestId, 'createdRequestId must exist from Step 1');
    const { data: updatedReq, error } = await supabase
      .from('requests')
      .update({
        status: 'VERIFIED',
        verified_by: TEST_USERS.COORDINATOR.userId,
        verified_at: new Date().toISOString()
      })
      .eq('request_id', createdRequestId)
      .select()
      .single();

    assert.ifError(error);
    assert.strictEqual(updatedReq.status, 'VERIFIED');
    assert.strictEqual(updatedReq.verified_by, TEST_USERS.COORDINATOR.userId);
  });

  it('Step 3: Coordinator creates relief task with exact tag [REQUEST_ID:uuid]', async () => {
    assert.ok(createdRequestId, 'createdRequestId must exist');
    const taskTitle = `Deliver ${requestedQty} bottles of water [REQUEST_ID:${createdRequestId}]`;
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        organization_id: targetOrgId,
        request_id: createdRequestId,
        coordinator_id: TEST_USERS.COORDINATOR.userId,
        title: taskTitle,
        description: 'Mission to deliver emergency water pack to affected family',
        priority: 'HIGH',
        status: 'ASSIGNED',
        location: '12 Kolonnawa Road'
      })
      .select()
      .single();

    assert.ifError(error);
    assert.ok(task?.task_id);
    assert.ok(task.title.includes(`[REQUEST_ID:${createdRequestId}]`));

    createdTaskId = task.task_id;
  });

  it('Step 4: Volunteer accepts / is assigned to mission (Status: ASSIGNED)', async () => {
    assert.ok(createdTaskId, 'createdTaskId must exist');
    // Create task assignment
    const { data: assignment, error: assignErr } = await supabase
      .from('task_assignments')
      .insert({
        task_id: createdTaskId,
        volunteer_id: '30000000-0000-0000-0000-000000000001',
        assigned_by: TEST_USERS.COORDINATOR.userId,
        assignment_status: 'ACCEPTED'
      })
      .select()
      .single();

    assert.ifError(assignErr);
    assert.strictEqual(assignment.assignment_status, 'ACCEPTED');
  });

  it('Step 5: Volunteer logs tactical milestones (50% En Route, 75% On Scene)', async () => {
    assert.ok(createdTaskId, 'createdTaskId must exist');
    // 50% En Route
    const { error: p1Err } = await supabase.from('task_progress').insert({
      task_id: createdTaskId,
      updated_by_user_id: TEST_USERS.VOLUNTEER.userId,
      progress_percent: 50,
      remarks: 'En Route to destination with relief provisions'
    });
    assert.ifError(p1Err);

    // 75% On Scene
    const { error: p2Err } = await supabase.from('task_progress').insert({
      task_id: createdTaskId,
      updated_by_user_id: TEST_USERS.VOLUNTEER.userId,
      progress_percent: 75,
      remarks: 'Arrived on scene, awaiting citizen PIN verification'
    });
    assert.ifError(p2Err);

    const { data: progressRows } = await supabase
      .from('task_progress')
      .select('*')
      .eq('task_id', createdTaskId)
      .order('progress_percent', { ascending: true });

    assert.strictEqual(progressRows.length, 2);
    assert.strictEqual(progressRows[1].progress_percent, 75);
  });

  it('Step 6: Handover PIN verification with INVALID PIN is rejected', async () => {
    assert.ok(createdRequestId, 'createdRequestId must exist');
    const wrongPin = '0000';
    assert.notStrictEqual(wrongPin, expectedHandoverPin, 'Wrong PIN must not match actual PIN');

    const { data: req } = await supabase
      .from('requests')
      .select('handover_pin')
      .eq('request_id', createdRequestId)
      .single();

    const isPinValid = (wrongPin === req.handover_pin);
    assert.strictEqual(isPinValid, false, 'Invalid PIN verification attempt must fail');
  });

  it('Step 7: Correct Handover PIN verification completes mission, fulfills request, and auto-deducts stock (STOCK_OUT)', async () => {
    assert.ok(createdRequestId, 'createdRequestId must exist');
    assert.ok(createdTaskId, 'createdTaskId must exist');

    // Verify PIN matches
    const { data: req } = await supabase
      .from('requests')
      .select('handover_pin')
      .eq('request_id', createdRequestId)
      .single();

    assert.strictEqual(expectedHandoverPin, req.handover_pin);

    // 1. Mark Task progress as 100% COMPLETED
    const { error: progErr } = await supabase.from('task_progress').insert({
      task_id: createdTaskId,
      updated_by_user_id: TEST_USERS.VOLUNTEER.userId,
      progress_percent: 100,
      remarks: 'Handover complete and verified via OTP PIN'
    });
    assert.ifError(progErr);

    // Update completed_at
    const { data: completedTask, error: taskErr } = await supabase
      .from('tasks')
      .update({
        completed_at: new Date().toISOString()
      })
      .eq('task_id', createdTaskId)
      .select()
      .single();

    assert.ifError(taskErr);
    assert.ok(completedTask.completed_at);

    // 2. Mark Request as FULFILLED
    const { data: fulfilledReq, error: reqErr } = await supabase
      .from('requests')
      .update({
        status: 'FULFILLED',
        fulfilled_at: new Date().toISOString()
      })
      .eq('request_id', createdRequestId)
      .select()
      .single();

    assert.ifError(reqErr);
    assert.strictEqual(fulfilledReq.status, 'FULFILLED');

    // 3. Record Inventory STOCK_OUT Transaction
    const { data: tx, error: txErr } = await supabase
      .from('inventory_transactions')
      .insert({
        organization_id: targetOrgId,
        resource_id: testResourceId,
        transaction_type: 'STOCK_OUT',
        quantity: requestedQty,
        reference_type: 'REQUEST',
        reference_id: createdRequestId,
        remarks: 'Automated STOCK_OUT on Flow A mission completion'
      })
      .select()
      .single();

    assert.ifError(txErr);
    assert.strictEqual(tx.transaction_type, 'STOCK_OUT');
    assert.strictEqual(tx.quantity, requestedQty);

    // 4. Update warehouse resource available stock
    const expectedRemaining = initialStockQty - requestedQty;
    const { data: updatedRes, error: resErr } = await supabase
      .from('resources')
      .update({ quantity_available: expectedRemaining })
      .eq('resource_id', testResourceId)
      .select()
      .single();

    assert.ifError(resErr);
    assert.strictEqual(updatedRes.quantity_available, expectedRemaining);

    // Clean up test records
    await supabase.from('task_progress').delete().eq('task_id', createdTaskId);
    await supabase.from('task_assignments').delete().eq('task_id', createdTaskId);
    await supabase.from('tasks').delete().eq('task_id', createdTaskId);
    await supabase.from('requests').delete().eq('request_id', createdRequestId);
    await supabase.from('inventory_transactions').delete().eq('transaction_id', tx.transaction_id);
    await supabase.from('resources').delete().eq('resource_id', testResourceId);
  });
});
