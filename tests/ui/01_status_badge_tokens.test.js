import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mirror of design token mapping from frontend/src/components/status-badge.tsx
const TONE_MAP = {
  Pending: "pending",
  "Pending Verification": "pending",
  "Under Review": "pending",
  Assigned: "pending",
  Busy: "pending",
  Approved: "approved",
  Accepted: "approved",
  Active: "success",
  Available: "success",
  Fulfilled: "success",
  Completed: "success",
  "Partially Fulfilled": "approved",
  "In Progress": "approved",
  Rejected: "danger",
  Suspended: "danger",
  Critical: "danger",
  High: "pending",
  Medium: "approved",
  Low: "neutral",
  Cancelled: "neutral",
  Unavailable: "neutral",
  Disabled: "neutral",
};

const TONE_CLASS = {
  pending: "bg-status-pending-muted text-status-pending-foreground border-status-pending/30",
  approved: "bg-status-approved-muted text-status-approved-foreground border-status-approved/30",
  success: "bg-status-success-muted text-status-success-foreground border-status-success/30",
  danger: "bg-status-danger-muted text-status-danger-foreground border-status-danger/30",
  neutral: "bg-status-neutral-muted text-status-neutral-foreground border-status-neutral/30",
};

describe('UI Design Tokens & Status Badge Color Mapping', () => {

  it('maps PENDING and assigned statuses to amber/pending tone', () => {
    assert.strictEqual(TONE_MAP['Pending'], 'pending');
    assert.strictEqual(TONE_MAP['Pending Verification'], 'pending');
    assert.strictEqual(TONE_MAP['Assigned'], 'pending');
    assert.ok(TONE_CLASS['pending'].includes('text-status-pending-foreground'));
  });

  it('maps APPROVED and verified statuses to blue/approved tone', () => {
    assert.strictEqual(TONE_MAP['Approved'], 'approved');
    assert.strictEqual(TONE_MAP['Accepted'], 'approved');
    assert.strictEqual(TONE_MAP['In Progress'], 'approved');
    assert.ok(TONE_CLASS['approved'].includes('text-status-approved-foreground'));
  });

  it('maps COMPLETED, FULFILLED and ACTIVE to green/success tone', () => {
    assert.strictEqual(TONE_MAP['Completed'], 'success');
    assert.strictEqual(TONE_MAP['Fulfilled'], 'success');
    assert.strictEqual(TONE_MAP['Active'], 'success');
    assert.strictEqual(TONE_MAP['Available'], 'success');
    assert.ok(TONE_CLASS['success'].includes('text-status-success-foreground'));
  });

  it('maps REJECTED, SUSPENDED and CRITICAL to red/danger tone', () => {
    assert.strictEqual(TONE_MAP['Rejected'], 'danger');
    assert.strictEqual(TONE_MAP['Suspended'], 'danger');
    assert.strictEqual(TONE_MAP['Critical'], 'danger');
    assert.ok(TONE_CLASS['danger'].includes('text-status-danger-foreground'));
  });

  it('maps CANCELLED, LOW and UNAVAILABLE to neutral tone', () => {
    assert.strictEqual(TONE_MAP['Cancelled'], 'neutral');
    assert.strictEqual(TONE_MAP['Low'], 'neutral');
    assert.strictEqual(TONE_MAP['Unavailable'], 'neutral');
    assert.ok(TONE_CLASS['neutral'].includes('text-status-neutral-foreground'));
  });
});
