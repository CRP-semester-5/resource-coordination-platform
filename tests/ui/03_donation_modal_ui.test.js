import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Donations Acceptance & Approval Modal Logic', () => {

  const deliveryMethodLabels = {
    DONOR_DELIVERY: 'Donor Delivery to Warehouse',
    VOLUNTEER_PICKUP: 'Volunteer Pickup Required',
    ORGANIZATION_PICKUP: 'Organization Transport Dispatch'
  };

  it('renders correct descriptive labels for all delivery methods', () => {
    assert.strictEqual(deliveryMethodLabels.DONOR_DELIVERY, 'Donor Delivery to Warehouse');
    assert.strictEqual(deliveryMethodLabels.VOLUNTEER_PICKUP, 'Volunteer Pickup Required');
    assert.strictEqual(deliveryMethodLabels.ORGANIZATION_PICKUP, 'Organization Transport Dispatch');
  });

  it('validates that rejection requires a non-empty explanation reason', () => {
    const validateRejection = (reason) => {
      if (!reason || reason.trim().length < 5) {
        return { isValid: false, error: 'Rejection reason must be at least 5 characters long.' };
      }
      return { isValid: true, error: null };
    };

    const emptyResult = validateRejection('');
    assert.strictEqual(emptyResult.isValid, false);
    assert.ok(emptyResult.error.includes('at least 5 characters'));

    const shortResult = validateRejection('no');
    assert.strictEqual(shortResult.isValid, false);

    const validResult = validateRejection('Expired medicine cannot be distributed safely.');
    assert.strictEqual(validResult.isValid, true);
    assert.strictEqual(validResult.error, null);
  });

  it('formats donation intake quantities and category units for display', () => {
    const formatDonationSummary = (donation) => {
      return `${donation.quantity} ${donation.unit} of ${donation.resource_name} (${donation.category})`;
    };

    const formatted = formatDonationSummary({
      quantity: 100,
      unit: 'packs',
      resource_name: 'Thermal Blankets',
      category: 'Shelter'
    });

    assert.strictEqual(formatted, '100 packs of Thermal Blankets (Shelter)');
  });
});
