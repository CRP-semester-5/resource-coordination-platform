import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Handover Security PIN Card UI Lifecycle & Display Rules', () => {

  const determinePinCardVisibility = ({ progressPercent, missionStatus, handoverPin }) => {
    // Hidden if mission not yet on scene (< 75%) or completed (100% / COMPLETED)
    if (progressPercent < 75 || missionStatus === 'COMPLETED' || progressPercent >= 100) {
      return {
        isMounted: false,
        renderComponent: 'SizedBox.shrink()', // Flutter unmounted widget / React null
        visiblePin: null
      };
    }

    // Mounted when volunteer is on scene (>= 75% and < 100%)
    return {
      isMounted: true,
      renderComponent: 'HandoverSecurityPinCard',
      visiblePin: handoverPin,
      helperText: 'Show this 4-Digit Security PIN to the volunteer upon handover'
    };
  };

  it('keeps PIN card HIDDEN while volunteer is En Route (progress = 50%)', () => {
    const cardState = determinePinCardVisibility({
      progressPercent: 50,
      missionStatus: 'IN_PROGRESS',
      handoverPin: '4821'
    });

    assert.strictEqual(cardState.isMounted, false);
    assert.strictEqual(cardState.renderComponent, 'SizedBox.shrink()');
    assert.strictEqual(cardState.visiblePin, null);
  });

  it('MOUNTS and DISPLAYS PIN card when volunteer arrives on scene (progress = 75%)', () => {
    const cardState = determinePinCardVisibility({
      progressPercent: 75,
      missionStatus: 'IN_PROGRESS',
      handoverPin: '4821'
    });

    assert.strictEqual(cardState.isMounted, true);
    assert.strictEqual(cardState.renderComponent, 'HandoverSecurityPinCard');
    assert.strictEqual(cardState.visiblePin, '4821');
    assert.ok(cardState.helperText.includes('Show this 4-Digit Security PIN'));
  });

  it('COMPLETELY UNMOUNTS PIN card once mission reaches 100% completion', () => {
    const cardState = determinePinCardVisibility({
      progressPercent: 100,
      missionStatus: 'COMPLETED',
      handoverPin: '4821'
    });

    assert.strictEqual(cardState.isMounted, false);
    assert.strictEqual(cardState.renderComponent, 'SizedBox.shrink()');
    assert.strictEqual(cardState.visiblePin, null);
  });
});
