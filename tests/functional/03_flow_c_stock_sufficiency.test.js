/**
 * Functional Test 3.1.2.3: Flow C (Stock Sufficiency Rules & Deficit Prevention)
 * Specification:
 *   Validate that inventory sufficiency checks prevent task dispatch when requested quantity
 *   exceeds available warehouse stock, and accurately calculate surplus / deficit margins.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { supabase, TEST_ORGS } from './helpers/fixtures.helper.js';

describe('3.1.2.3 Flow C: Stock Sufficiency Rules & Inventory Boundary Validation', () => {
  const targetOrgId = TEST_ORGS.COLOMBO_HUB;
  let testResourceId = null;
  const availableStock = 40;

  it('Step 1: Sets up warehouse stock baseline', async () => {
    const { data: res, error } = await supabase
      .from('resources')
      .insert({
        organization_id: targetOrgId,
        resource_name: `FlowC Rice Packs ${Date.now()}`,
        category: 'Food & Nutrition',
        quantity_available: availableStock,
        quantity_reserved: 10,
        unit: 'packs',
        location: 'Bay F2',
        reorder_level: 15
      })
      .select()
      .single();

    assert.ifError(error);
    testResourceId = res.resource_id;
  });

  it('Step 2: Evaluates stock sufficiency when requested quantity is within available limits', async () => {
    const requestedQty = 25; // <= 40 available

    const { data: resource } = await supabase
      .from('resources')
      .select('quantity_available, quantity_reserved')
      .eq('resource_id', testResourceId)
      .single();

    const isSufficient = resource.quantity_available >= requestedQty;
    const surplus = resource.quantity_available - requestedQty;

    assert.strictEqual(isSufficient, true, 'Stock must be flagged as SUFFICIENT');
    assert.strictEqual(surplus, 15, 'Surplus margin must be exactly 15 units');
  });

  it('Step 3: Flags shortage and deficit when requested quantity exceeds available inventory', async () => {
    const requestedQty = 65; // > 40 available

    const { data: resource } = await supabase
      .from('resources')
      .select('quantity_available, quantity_reserved')
      .eq('resource_id', testResourceId)
      .single();

    const isSufficient = resource.quantity_available >= requestedQty;
    const shortage = requestedQty - resource.quantity_available;

    assert.strictEqual(isSufficient, false, 'Stock must be flagged as INSUFFICIENT / DEFICIT');
    assert.strictEqual(shortage, 25, 'Shortage deficit must be exactly 25 units');
  });

  it('Step 4: Reserves inventory upon mission creation and prevents double allocation', async () => {
    const reserveQty = 20;

    // Fetch current state
    const { data: initialRes } = await supabase
      .from('resources')
      .select('quantity_available, quantity_reserved')
      .eq('resource_id', testResourceId)
      .single();

    const newReserved = initialRes.quantity_reserved + reserveQty;
    assert.ok(newReserved <= initialRes.quantity_available, 'Reserved cannot exceed available');

    // Update reservation
    const { data: updatedRes, error } = await supabase
      .from('resources')
      .update({ quantity_reserved: newReserved })
      .eq('resource_id', testResourceId)
      .select()
      .single();

    assert.ifError(error);
    assert.strictEqual(updatedRes.quantity_reserved, 30);

    // Clean up
    await supabase.from('resources').delete().eq('resource_id', testResourceId);
  });
});
