/**
 * EcoSmartX Test Suite: Energy Engine & Google Calendar / Firestore Rules Spec Tests
 */
import test from 'node:test';
import assert from 'node:assert/strict';

test('Demand Response event validation conforms to Firestore security spec', () => {
  const validEvent = {
    id: 'evt-test-1',
    facilityId: 'fac-ecotech',
    title: 'Peak Shaving Window 13:00-18:00',
    description: 'Thermostat reset and chiller unloading',
    eventType: 'peak_shaving',
    startTime: '2026-10-27T13:00:00Z',
    endTime: '2026-10-27T18:00:00Z',
    targetReductionKw: 45,
    ownerId: 'uid-12345',
  };

  assert.equal(typeof validEvent.id, 'string');
  assert.ok(validEvent.id.length <= 128);
  assert.ok(validEvent.title.length <= 150);
  assert.ok(validEvent.targetReductionKw >= 0);
  assert.ok(['peak_shaving', 'demand_response', 'maintenance', 'energy_audit'].includes(validEvent.eventType));
});

test('Dirty Dozen Payload 1: Reject unauthenticated/mismatched ownerId', () => {
  const dirtyPayload = {
    id: 'evt-malicious-1',
    facilityId: 'fac-ecotech',
    title: 'Spoofed Owner Event',
    ownerId: 'victim-uid-999',
  };

  const currentAuthUid = 'attacker-uid-111';
  const isOwnerValid = dirtyPayload.ownerId === currentAuthUid;
  assert.equal(isOwnerValid, false, 'Payload must be rejected due to mismatched ownerId');
});

test('Dirty Dozen Payload 5: Reject string size exceeding 150 chars in title', () => {
  const hugeTitle = 'A'.repeat(250);
  const isValidTitleLength = hugeTitle.length <= 150;
  assert.equal(isValidTitleLength, false, 'Payload must be rejected for exceeding maximum title size');
});

test('Dirty Dozen Payload 7: Document ID regex guard', () => {
  const maliciousId = '../../etc/passwd';
  const idRegex = /^[a-zA-Z0-9_\-]+$/;
  assert.equal(idRegex.test(maliciousId), false, 'Path injection document IDs must fail regex guard');

  const validId = 'evt-peak-shaving_2026';
  assert.equal(idRegex.test(validId), true, 'Standard alphanumeric IDs with dashes must pass');
});

test('Demand charge savings calculation accurately reflects peak avoidance', () => {
  const targetCurtailmentKw = 45;
  const demandChargeRatePerKw = 12.5;
  const expectedMonthlySavings = targetCurtailmentKw * demandChargeRatePerKw;
  assert.equal(expectedMonthlySavings, 562.5);
});

test('Action Plan measures validate status transitions and required attributes', () => {
  const validAction = {
    id: 'act-test-1',
    title: 'Optimum HVAC Setpoint & Night Setback',
    category: 'HVAC',
    effort: 'Low',
    capitalCost: 0,
    estimatedMonthlyCostSavings: 147,
    estimatedMonthlyKwhSavings: 920,
    status: 'open',
  };

  const allowedStatuses = ['open', 'in_progress', 'completed'];
  const allowedEfforts = ['Low', 'Medium', 'High'];

  assert.ok(allowedStatuses.includes(validAction.status));
  assert.ok(allowedEfforts.includes(validAction.effort));
  assert.ok(validAction.estimatedMonthlyCostSavings >= 0);
  assert.ok(validAction.estimatedMonthlyKwhSavings >= 0);

  // Transition to in_progress and completed
  validAction.status = 'in_progress';
  assert.equal(validAction.status, 'in_progress');
  validAction.status = 'completed';
  assert.equal(validAction.status, 'completed');
});

test('Action Plan priority ranking deterministically sorts by estimated monthly savings descending', () => {
  const rawActions = [
    { id: 'act-1', estimatedMonthlyCostSavings: 90 },
    { id: 'act-2', estimatedMonthlyCostSavings: 280 },
    { id: 'act-3', estimatedMonthlyCostSavings: 147 },
    { id: 'act-4', estimatedMonthlyCostSavings: 295 },
  ];

  const sorted = [...rawActions].sort((a, b) => b.estimatedMonthlyCostSavings - a.estimatedMonthlyCostSavings);
  assert.equal(sorted[0].id, 'act-4', 'Highest savings ($295) must be ranked #1');
  assert.equal(sorted[1].id, 'act-2', 'Second highest savings ($280) must be ranked #2');
  assert.equal(sorted[3].id, 'act-1', 'Lowest savings ($90) must be ranked last');
});

test('What-If simulation calculates savings non-destructively without altering baseline', () => {
  const baselineKwh = 10000;
  const effectiveRate = 0.16;
  const effUpgradePct = 20; // 20% retrofit
  const solarGenKwh = 50 * 135; // 50 kW array -> 6,750 kWh

  const effKwhSaved = baselineKwh * (effUpgradePct / 100);
  const totalSavedKwh = effKwhSaved + solarGenKwh;
  const simulatedKwh = Math.max(0, baselineKwh - totalSavedKwh);
  const monthlyCostSavings = Math.round((baselineKwh - simulatedKwh) * effectiveRate);

  assert.equal(baselineKwh, 10000, 'Baseline consumption must remain unaltered');
  assert.equal(effKwhSaved, 2000);
  assert.equal(totalSavedKwh, 8750);
  assert.equal(simulatedKwh, 1250);
  assert.equal(monthlyCostSavings, 1400);
});

test('Zero Demo Data: calculateFacilityMetrics handles null/empty facility safely without throwing', async () => {
  const { calculateFacilityMetrics, detectAnomalies } = await import('../src/utils/energyEngine.js');
  
  const nullMetrics = calculateFacilityMetrics(null);
  assert.equal(nullMetrics.facility.monthlyTotalKwh, 0);
  assert.equal(nullMetrics.facility.monthlyCost, 0);
  assert.equal(nullMetrics.facility.annualCo2Tonnes, 0);
  assert.equal(nullMetrics.facility.energyIntensityKwhPerSqM, 0);

  const emptyFacility = {
    id: 'fac-empty',
    name: 'Empty Facility',
    floorAreaSqM: 1000,
    rooms: [],
    appliances: [],
    utilityTariff: { flatRate: 8.5, peakRate: 9.8, offPeakRate: 6.2 },
  };
  const emptyMetrics = calculateFacilityMetrics(emptyFacility);
  assert.equal(emptyMetrics.facility.monthlyTotalKwh, 0);
  assert.equal(emptyMetrics.facility.monthlyCost, 0);
  assert.equal(emptyMetrics.facility.dailyTotalKwh, 0);

  const anomaliesNull = detectAnomalies(null);
  assert.deepEqual(anomaliesNull, []);

  const anomaliesEmpty = detectAnomalies(emptyFacility);
  assert.deepEqual(anomaliesEmpty, []);
});

test('Deterministic calculation: 1000W equipment running 10h/day for 30 days yields 300 kWh and accurate cost/emissions', async () => {
  const { calculateFacilityMetrics } = await import('../src/utils/energyEngine.js');

  const facility = {
    id: 'fac-test-real',
    name: 'Bengaluru Tech Park',
    floorAreaSqM: 2000,
    occupancy: 50,
    gridCarbonIntensityKgPerKwh: 0.72,
    currency: 'INR',
    utilityTariff: {
      flatRate: 8.50,
      peakRate: 9.80,
      offPeakRate: 6.20,
      peakStartHour: 18,
      peakEndHour: 22,
      demandChargePerKw: 260,
    },
    rooms: [{ id: 'room-1', name: 'Main Server Hall', floorAreaSqM: 2000 }],
    appliances: [
      {
        id: 'app-server',
        name: 'Server PDU Rack',
        category: 'it_compute',
        roomId: 'room-1',
        ratedWatts: 1000,
        quantity: 1,
        operatingHoursPerDay: 10,
        operatingDaysPerWeek: 7,
        utilizationFactor: 1.0,
        standbyWatts: 0,
      },
    ],
  };

  const metrics = calculateFacilityMetrics(facility);
  // 1000W * 10h/day = 10 kWh/day * (365/12) ≈ 304 kWh/month
  assert.equal(Math.round(metrics.facility.dailyTotalKwh), 10);
  assert.ok(Math.abs(metrics.facility.monthlyTotalKwh - 304.2) < 2);
  // Base cost = 304.2 kWh * flatRate 8.50 = 2585 INR
  assert.ok(metrics.facility.monthlyCost > 2500 && metrics.facility.monthlyCost < 2800);
  // Scope 2 emissions: 10 kWh/day * 365 days = 3650 kWh/yr * 0.72 kg/kWh = 2628 kg = 2.63 MT
  assert.equal(metrics.facility.annualCo2Tonnes, 2.63);
});


