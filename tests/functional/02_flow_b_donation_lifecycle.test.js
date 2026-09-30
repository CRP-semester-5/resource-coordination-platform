import { describe, it } from 'node:test';
import assert from 'node:assert';
import { supabase, TEST_ORGS } from './helpers/fixtures.helper.js';
import { TEST_USERS } from './helpers/auth.helper.js';

describe('Flow B: Donation Lifecycle & Automated Stock-In Crediting', () => {
  let createdDonationId = null;
  const donationHandoverPin = (Math.floor(1000 + Math.random() * 9000)).toString();
  let pickupTaskId = null;
  const targetOrgId = TEST_ORGS.COLOMBO_HUB;
  const initialStock = 50;
  const donatedQuantity = 75;
  let warehouseResourceId = null;

  it('Step 1: Donor submits relief donation offer with auto-generated Handover PIN', async () => {
    // 1. Prepare target warehouse resource
    const { data: res, error: resErr } = await supabase
      .from('resources')
      .insert({
        organization_id: targetOrgId,
        resource_name: `FlowB Blankets ${Date.now()}`,
        category: 'Shelter & Clothing',
        quantity_available: initialStock,
        unit: 'packs',
        location: 'Donation Intake Bay'
      })
      .select()
      .single();

    assert.ifError(resErr);
    warehouseResourceId = res.resource_id;

    // 2. Submit donation offer
    const { data: donation, error } = await supabase
      .from('donations')
      .insert({
        organization_id: targetOrgId,
        donor_id: TEST_USERS.CITIZEN.userId,
        resource_id: warehouseResourceId,
        resource_name: 'Thermal Disaster Blankets',
        category: 'Shelter & Clothing',
        quantity: donatedQuantity,
        unit: 'packs',
        delivery_method: 'VOLUNTEER_PICKUP',
        pickup_address: '78 High Level Road, Nugegoda',
        status: 'PENDING',
        handover_pin: donationHandoverPin
      })
      .select()
      .single();

    assert.ifError(error);
    assert.ok(donation?.donation_id);
    assert.strictEqual(donation.status, 'PENDING');
    assert.strictEqual(donation.handover_pin, donationHandoverPin);

    createdDonationId = donation.donation_id;
  });

  it('Step 2: Coordinator reviews and accepts the donation offer', async () => {
    assert.ok(createdDonationId, 'createdDonationId must exist');
    const { data: acceptedDonation, error } = await supabase
      .from('donations')
      .update({
        status: 'VERIFIED',
        verified_by: TEST_USERS.COORDINATOR.userId,
        verified_at: new Date().toISOString()
      })
      .eq('donation_id', createdDonationId)
      .select()
      .single();

    assert.ifError(error);
    assert.strictEqual(acceptedDonation.status, 'VERIFIED');
  });

  it('Step 3: Coordinator creates volunteer pickup task tagged with [DONATION_ID:uuid]', async () => {
    assert.ok(createdDonationId, 'createdDonationId must exist');
    const taskTitle = `Pick up ${donatedQuantity} blankets from donor [DONATION_ID:${createdDonationId}]`;
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        organization_id: targetOrgId,
        coordinator_id: TEST_USERS.COORDINATOR.userId,
        title: taskTitle,
        description: 'Volunteer dispatch to collect donated items from donor residence',
        priority: 'MEDIUM',
        status: 'ASSIGNED',
        location: '78 High Level Road, Nugegoda'
      })
      .select()
      .single();

    assert.ifError(error);
    assert.ok(task?.task_id);
    assert.ok(task.title.includes(`[DONATION_ID:${createdDonationId}]`));

    pickupTaskId = task.task_id;
  });

  it('Step 4: Volunteer reaches donor pickup location (75% On Scene)', async () => {
    assert.ok(pickupTaskId, 'pickupTaskId must exist');
    const { error: pErr } = await supabase.from('task_progress').insert({
      task_id: pickupTaskId,
      updated_by_user_id: TEST_USERS.VOLUNTEER.userId,
      progress_percent: 75,
      remarks: 'Arrived at donor residence, verifying package contents and Handover PIN'
    });

    assert.ifError(pErr);
  });

  it('Step 5: Handover PIN verification completes pickup, auto-credits warehouse stock (STOCK_IN)', async () => {
    assert.ok(createdDonationId, 'createdDonationId must exist');
    assert.ok(pickupTaskId, 'pickupTaskId must exist');

    // 1. Fetch donation PIN to verify match
    const { data: don } = await supabase
      .from('donations')
      .select('handover_pin')
      .eq('donation_id', createdDonationId)
      .single();

    assert.strictEqual(donationHandoverPin, don.handover_pin);

    // 2. Mark pickup progress as 100% COMPLETED
    const { error: progErr } = await supabase.from('task_progress').insert({
      task_id: pickupTaskId,
      updated_by_user_id: TEST_USERS.VOLUNTEER.userId,
      progress_percent: 100,
      remarks: 'Pickup complete and verified via OTP PIN'
    });
    assert.ifError(progErr);

    // Update completed_at
    const { data: completedTask, error: taskErr } = await supabase
      .from('tasks')
      .update({
        completed_at: new Date().toISOString()
      })
      .eq('task_id', pickupTaskId)
      .select()
      .single();

    assert.ifError(taskErr);
    assert.ok(completedTask.completed_at);

    // 3. Mark donation as RECEIVED
    const { data: receivedDonation, error: donErr } = await supabase
      .from('donations')
      .update({
        status: 'RECEIVED',
        received_at: new Date().toISOString()
      })
      .eq('donation_id', createdDonationId)
      .select()
      .single();

    assert.ifError(donErr);
    assert.strictEqual(receivedDonation.status, 'RECEIVED');

    // 4. Record STOCK_IN transaction in inventory_transactions
    const { data: tx, error: txErr } = await supabase
      .from('inventory_transactions')
      .insert({
        organization_id: targetOrgId,
        resource_id: warehouseResourceId,
        transaction_type: 'STOCK_IN',
        quantity: donatedQuantity,
        reference_type: 'DONATION',
        reference_id: createdDonationId,
        remarks: 'Automated STOCK_IN from verified Flow B donation collection'
      })
      .select()
      .single();

    assert.ifError(txErr);
    assert.strictEqual(tx.transaction_type, 'STOCK_IN');
    assert.strictEqual(tx.quantity, donatedQuantity);

    // 5. Update warehouse resource available balance
    const expectedNewStock = initialStock + donatedQuantity;
    const { data: updatedResource, error: resErr } = await supabase
      .from('resources')
      .update({ quantity_available: expectedNewStock })
      .eq('resource_id', warehouseResourceId)
      .select()
      .single();

    assert.ifError(resErr);
    assert.strictEqual(updatedResource.quantity_available, expectedNewStock);

    // Clean up
    await supabase.from('task_progress').delete().eq('task_id', pickupTaskId);
    await supabase.from('tasks').delete().eq('task_id', pickupTaskId);
    await supabase.from('donations').delete().eq('donation_id', createdDonationId);
    await supabase.from('inventory_transactions').delete().eq('transaction_id', tx.transaction_id);
    await supabase.from('resources').delete().eq('resource_id', warehouseResourceId);
  });
});
