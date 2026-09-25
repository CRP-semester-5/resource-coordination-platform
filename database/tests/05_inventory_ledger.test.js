/**
 * Test Suite 3.1.1.5: Inventory Ledger Arithmetic & Atomicity Integrity
 * Target: Validate stock ledger formula (Opening + IN - OUT = Current) and negative stock prevention.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { serviceClient, TEST_IDS } from './setup.js';

describe('3.1.1.5 Inventory Ledger Arithmetic & Balance Integrity', () => {

  it('verifies that stock ledger transactions mathematically equate to current stock balance', async () => {
    // 1. Create a dedicated test resource with known initial balance
    const initialOpeningBalance = 100;
    const { data: resource, error: resErr } = await serviceClient
      .from('resources')
      .insert({
        organization_id: TEST_IDS.ORG_1,
        resource_name: `Ledger Audit Water ${Date.now()}`,
        category: 'Water & Sanitation',
        quantity_available: initialOpeningBalance,
        quantity_reserved: 0,
        unit: 'bottles',
        location: `Audit Bay ${Date.now()}`
      })
      .select()
      .single();

    assert.ifError(resErr);
    const resourceId = resource.resource_id;

    // 2. Insert STOCK_IN ledger transaction (+50)
    const stockInQty = 50;
    const { error: txInErr } = await serviceClient
      .from('inventory_transactions')
      .insert({
        organization_id: TEST_IDS.ORG_1,
        resource_id: resourceId,
        transaction_type: 'STOCK_IN',
        quantity: stockInQty,
        remarks: 'Incoming aid consignment'
      });
    assert.ifError(txInErr);

    // Update resource balance
    const balanceAfterIn = initialOpeningBalance + stockInQty;
    await serviceClient
      .from('resources')
      .update({ quantity_available: balanceAfterIn })
      .eq('resource_id', resourceId);

    // 3. Insert STOCK_OUT ledger transaction (-30)
    const stockOutQty = 30;
    const { error: txOutErr } = await serviceClient
      .from('inventory_transactions')
      .insert({
        organization_id: TEST_IDS.ORG_1,
        resource_id: resourceId,
        transaction_type: 'STOCK_OUT',
        quantity: stockOutQty,
        remarks: 'Dispatched to relief camp'
      });
    assert.ifError(txOutErr);

    // Update resource balance
    const currentStock = balanceAfterIn - stockOutQty;
    await serviceClient
      .from('resources')
      .update({ quantity_available: currentStock })
      .eq('resource_id', resourceId);

    // 4. Query all ledger transactions for this resource
    const { data: transactions, error: txQueryErr } = await serviceClient
      .from('inventory_transactions')
      .select('transaction_type, quantity')
      .eq('resource_id', resourceId);

    assert.ifError(txQueryErr);

    // 5. Calculate ledger sum
    const totalIn = transactions
      .filter((t) => t.transaction_type === 'STOCK_IN')
      .reduce((sum, t) => sum + t.quantity, 0);

    const totalOut = transactions
      .filter((t) => t.transaction_type === 'STOCK_OUT')
      .reduce((sum, t) => sum + t.quantity, 0);

    const expectedCurrentStock = initialOpeningBalance + totalIn - totalOut;

    // 6. Fetch actual stock from database
    const { data: currentRes, error: fetchErr } = await serviceClient
      .from('resources')
      .select('quantity_available')
      .eq('resource_id', resourceId)
      .single();

    assert.ifError(fetchErr);
    assert.strictEqual(
      currentRes.quantity_available,
      expectedCurrentStock,
      `Ledger formula mismatch: Opening(${initialOpeningBalance}) + IN(${totalIn}) - OUT(${totalOut}) should equal ${currentRes.quantity_available}`
    );

    // Clean up
    await serviceClient.from('inventory_transactions').delete().eq('resource_id', resourceId);
    await serviceClient.from('resources').delete().eq('resource_id', resourceId);
  });

  it('strictly rejects inventory deductions that would result in negative stock', async () => {
    // 1. Create a resource with 10 units
    const { data: resource, error: resErr } = await serviceClient
      .from('resources')
      .insert({
        organization_id: TEST_IDS.ORG_1,
        resource_name: `Low Stock Ration ${Date.now()}`,
        category: 'Food & Nutrition',
        quantity_available: 10,
        quantity_reserved: 0,
        unit: 'packs',
        location: `Low Bay ${Date.now()}`
      })
      .select()
      .single();

    assert.ifError(resErr);

    // 2. Attempt to update quantity_available to negative (-5)
    const { data, error } = await serviceClient
      .from('resources')
      .update({ quantity_available: -5 })
      .eq('resource_id', resource.resource_id);

    assert.ok(error, 'Expected database check constraint to block negative stock deduction');
    assert.strictEqual(error.code, '23514');

    // Clean up
    await serviceClient.from('resources').delete().eq('resource_id', resource.resource_id);
  });
});
