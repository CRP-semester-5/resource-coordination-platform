import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Help Requests Triage Table & Filter Component Logic', () => {

  const mockRequests = [
    {
      request_id: 'req-001',
      title: 'Emergency Medical Kit for Elderly Patient',
      category: 'Medical Supplies',
      urgency: 'CRITICAL',
      status: 'PENDING',
      location: 'Colombo 07',
      affected_people: 2
    },
    {
      request_id: 'req-002',
      title: 'Bottled Water for 50 Families',
      category: 'Water & Sanitation',
      urgency: 'HIGH',
      status: 'VERIFIED',
      location: 'Kolonnawa',
      affected_people: 50
    },
    {
      request_id: 'req-003',
      title: 'Dry Rations and Rice Packs',
      category: 'Food & Nutrition',
      urgency: 'MEDIUM',
      status: 'FULFILLED',
      location: 'Kaduwela',
      affected_people: 15
    },
    {
      request_id: 'req-004',
      title: 'Duplicate Aid Request',
      category: 'Food & Nutrition',
      urgency: 'LOW',
      status: 'REJECTED',
      location: 'Colombo 03',
      affected_people: 1
    }
  ];

  it('filters requests correctly by status tab selection', () => {
    const filterByStatus = (items, targetStatus) => {
      if (!targetStatus || targetStatus === 'ALL') return items;
      return items.filter((item) => item.status === targetStatus);
    };

    const pendingList = filterByStatus(mockRequests, 'PENDING');
    assert.strictEqual(pendingList.length, 1);
    assert.strictEqual(pendingList[0].request_id, 'req-001');

    const verifiedList = filterByStatus(mockRequests, 'VERIFIED');
    assert.strictEqual(verifiedList.length, 1);
    assert.strictEqual(verifiedList[0].request_id, 'req-002');

    const allList = filterByStatus(mockRequests, 'ALL');
    assert.strictEqual(allList.length, 4);
  });

  it('filters requests dynamically by search query across title, category, and location', () => {
    const searchFilter = (items, query) => {
      if (!query || query.trim() === '') return items;
      const q = query.toLowerCase().trim();
      return items.filter((item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    };

    const medicalResults = searchFilter(mockRequests, 'Medical');
    assert.strictEqual(medicalResults.length, 1);
    assert.strictEqual(medicalResults[0].request_id, 'req-001');

    const colomboResults = searchFilter(mockRequests, 'Colombo');
    assert.strictEqual(colomboResults.length, 2);
  });

  it('sorts requests correctly by urgency priority hierarchy (CRITICAL > HIGH > MEDIUM > LOW)', () => {
    const urgencyWeight = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };

    const sortedByUrgency = [...mockRequests].sort(
      (a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]
    );

    assert.strictEqual(sortedByUrgency[0].urgency, 'CRITICAL');
    assert.strictEqual(sortedByUrgency[1].urgency, 'HIGH');
    assert.strictEqual(sortedByUrgency[2].urgency, 'MEDIUM');
    assert.strictEqual(sortedByUrgency[3].urgency, 'LOW');
  });
});
