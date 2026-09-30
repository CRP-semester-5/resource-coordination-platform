import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('3-Tier Inventory Dashboard & Dynamic Stock Sufficiency Badge', () => {

  const computeStockSufficiencyBadge = ({ available, requested }) => {
    if (available >= requested) {
      return {
        tone: 'success',
        colorClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
        label: `In Stock: ${available} | Requested: ${requested}`,
        canDispatch: true,
        deficit: 0
      };
    } else {
      const shortage = requested - available;
      return {
        tone: 'danger',
        colorClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
        label: `Shortage: -${shortage} (Available: ${available} / Requested: ${requested})`,
        canDispatch: false,
        deficit: shortage
      };
    }
  };

  it('renders a green badge and enables dispatch button when warehouse stock is sufficient', () => {
    const badge = computeStockSufficiencyBadge({ available: 100, requested: 40 });

    assert.strictEqual(badge.tone, 'success');
    assert.strictEqual(badge.canDispatch, true);
    assert.strictEqual(badge.label, 'In Stock: 100 | Requested: 40');
    assert.ok(badge.colorClass.includes('emerald'));
    assert.strictEqual(badge.deficit, 0);
  });

  it('renders a red shortage badge and disables dispatch button when warehouse stock is insufficient', () => {
    const badge = computeStockSufficiencyBadge({ available: 15, requested: 50 });

    assert.strictEqual(badge.tone, 'danger');
    assert.strictEqual(badge.canDispatch, false);
    assert.strictEqual(badge.label, 'Shortage: -35 (Available: 15 / Requested: 50)');
    assert.ok(badge.colorClass.includes('rose'));
    assert.strictEqual(badge.deficit, 35);
  });

  it('flags low stock alert when available stock falls below or equals the reorder level', () => {
    const checkLowStockAlert = (available, reorderLevel) => {
      return {
        isLowStock: available <= reorderLevel,
        alertType: available <= reorderLevel ? 'WARNING_REORDER_REQUIRED' : 'NORMAL'
      };
    };

    const alert1 = checkLowStockAlert(10, 20);
    assert.strictEqual(alert1.isLowStock, true);
    assert.strictEqual(alert1.alertType, 'WARNING_REORDER_REQUIRED');

    const alert2 = checkLowStockAlert(50, 20);
    assert.strictEqual(alert2.isLowStock, false);
    assert.strictEqual(alert2.alertType, 'NORMAL');
  });
});
