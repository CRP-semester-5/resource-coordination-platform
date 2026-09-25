/**
 * Test Suite 3.1.1.1: Schema Check Constraints & Domain Integrity
 * Target: Verify that invalid numeric, range, and ENUM values are strictly rejected (SQL error 23514 / 22P02).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { serviceClient, TEST_IDS } from './setup.js';

describe('3.1.1.1 Schema Constraints & Domain Boundary Validation', () => {

  it('rejects requests with quantity_required <= 0 (check_violation: 23514)', async () => {
    const invalidReq = {
      organization_id: TEST_IDS.ORG_1,
      requester_id: TEST_IDS.USER_CITIZEN,
      title: 'Invalid zero quantity request',
      description: 'Testing check constraint',
      category: 'Water & Sanitation',
      quantity_required: 0, // Must be > 0
      unit: 'bottles'
    };

    const { data, error } = await serviceClient.from('requests').insert(invalidReq);
    assert.ok(error, 'Expected insert to fail with constraint error');
    assert.strictEqual(error.code, '23514', `Expected error code 23514 (check_violation), got: ${error.code} (${error.message})`);
  });

  it('rejects resources with negative quantity_available (check_violation: 23514)', async () => {
    const invalidResource = {
      organization_id: TEST_IDS.ORG_1,
      resource_name: 'Negative Stock Item',
      category: 'Medical Supplies',
      quantity_available: -10, // Must be >= 0
      unit: 'boxes',
      location: 'Test Bay'
    };

    const { data, error } = await serviceClient.from('resources').insert(invalidResource);
    assert.ok(error, 'Expected insert to fail for negative quantity_available');
    assert.strictEqual(error.code, '23514');
  });

  it('rejects resources where quantity_reserved > quantity_available (check_violation: 23514)', async () => {
    const invalidResource = {
      organization_id: TEST_IDS.ORG_1,
      resource_name: 'Over-reserved Item',
      category: 'Shelter',
      quantity_available: 50,
      quantity_reserved: 100, // Violates check (quantity_reserved <= quantity_available)
      unit: 'tents',
      location: 'Warehouse C'
    };

    const { data, error } = await serviceClient.from('resources').insert(invalidResource);
    assert.ok(error, 'Expected insert to fail when reserved > available');
    assert.strictEqual(error.code, '23514');
  });

  it('rejects donations with quantity <= 0 (check_violation: 23514)', async () => {
    const invalidDonation = {
      organization_id: TEST_IDS.ORG_1,
      donor_id: TEST_IDS.USER_CITIZEN,
      resource_name: 'Blankets',
      quantity: -5, // Must be > 0
      unit: 'pieces',
      delivery_method: 'DONOR_DELIVERY'
    };

    const { data, error } = await serviceClient.from('donations').insert(invalidDonation);
    assert.ok(error, 'Expected insert to fail for negative donation quantity');
    assert.strictEqual(error.code, '23514');
  });

  it('rejects volunteer ratings outside the range [0.00, 5.00] (check_violation: 23514)', async () => {
    const invalidVolunteer = {
      organization_id: TEST_IDS.ORG_1,
      user_id: TEST_IDS.USER_COORDINATOR,
      experience_years: 1.0,
      rating: 6.50 // Rating must be between 0 and 5
    };

    const { data, error } = await serviceClient.from('volunteers').insert(invalidVolunteer);
    assert.ok(error, 'Expected insert to fail for rating > 5.00');
    assert.strictEqual(error.code, '23514');
  });

  it('rejects task progress percentage > 100 or < 0 (check_violation: 23514)', async () => {
    const invalidProgress = {
      task_id: '40000000-0000-0000-0000-000000000001',
      progress_percent: 150, // Must be between 0 and 100
      remarks: 'Impossible progress'
    };

    const { data, error } = await serviceClient.from('task_progress').insert(invalidProgress);
    assert.ok(error, 'Expected insert to fail for progress_percent > 100');
    assert.strictEqual(error.code, '23514');
  });
});
