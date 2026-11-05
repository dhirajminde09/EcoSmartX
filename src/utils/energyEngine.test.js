import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateApplianceEnergy,
  calculateFacilityMetrics,
  compareScenarios,
  generateForecast,
  detectAnomalies,
  runOptimizationEngine,
} from './energyEngine.js';

const mockTariff = {
  id: 'flat-standard',
  name: 'Commercial Flat Rate',
  type: 'flat',
  flatRate: 0.20,
  fixedMonthlyCharge: 50,
};

const mockAppliance = {
  id: 'app-1',
  name: 'Office LED Fixtures',
  category: 'lighting',
  roomId: 'room-1',
  ratedWatts: 1000,
  standbyWatts: 0,
  quantity: 1,
  operatingHoursPerDay: 10,
  operatingDaysPerWeek: 7,
  utilizationFactor: 1.0,
};

test('vanilla energy engine: 1000W for 10h/day = 10 kWh/day', () => {
  const result = calculateApplianceEnergy(mockAppliance, mockTariff, 0.5);
  assert.equal(result.dailyActiveKwh, 10);
  assert.equal(result.dailyTotalKwh, 10);
  assert.equal(result.weeklyTotalKwh, 70);
  assert.equal(result.annualTotalKwh, 3650);
  assert.equal(result.annualCost, 730);
  assert.equal(result.annualCo2Kg, 1825);
});

test('vanilla energy engine: standby power calculations', () => {
  const appWithStandby = {
    ...mockAppliance,
    ratedWatts: 500,
    standbyWatts: 50,
    operatingHoursPerDay: 8,
    operatingDaysPerWeek: 7,
  };
  const result = calculateApplianceEnergy(appWithStandby, mockTariff, 0.4);
  assert.equal(result.dailyActiveKwh, 4);
  assert.equal(result.dailyStandbyKwh, 0.8);
  assert.equal(result.dailyTotalKwh, 4.8);
});

test('vanilla energy engine: facility aggregation', () => {
  const mockFacility = {
    id: 'fac-1',
    name: 'Test Tech Park',
    type: 'commercial_office',
    location: 'Austin, TX',
    floorAreaSqM: 1000,
    occupancy: 50,
    floors: 1,
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/Chicago',
    emissionFactorKgCo2PerKwh: 0.40,
    tariff: mockTariff,
    rooms: [
      { id: 'room-1', name: 'Open Workspace', floor: 1, areaSqM: 1000, type: 'office', occupancyCapacity: 50 }
    ],
    appliances: [mockAppliance],
  };

  const metrics = calculateFacilityMetrics(mockFacility);
  assert.equal(metrics.facility.dailyTotalKwh, 10);
  assert.equal(metrics.facility.annualTotalKwh, 3650);
  assert.ok(metrics.facility.monthlyCost > 110 && metrics.facility.monthlyCost < 111);
  assert.ok(metrics.facility.energyIntensityKwhPerSqM >= 3.6 && metrics.facility.energyIntensityKwhPerSqM <= 3.7);
});

test('vanilla energy engine: scenario comparison', () => {
  const baselineFacility = {
    id: 'fac-1',
    name: 'Facility Baseline',
    floorAreaSqM: 500,
    emissionFactorKgCo2PerKwh: 0.40,
    tariff: mockTariff,
    rooms: [{ id: 'room-1', name: 'Main Room', floor: 1, areaSqM: 500 }],
    appliances: [{ ...mockAppliance, ratedWatts: 2000, operatingHoursPerDay: 10 }],
  };

  const scenarioFacility = {
    ...baselineFacility,
    appliances: [{ ...mockAppliance, ratedWatts: 1000, operatingHoursPerDay: 10 }],
  };

  const diff = compareScenarios(baselineFacility, scenarioFacility);
  assert.equal(diff.percentEnergySavings, 50);
  assert.ok(diff.deltaMonthlyKwh > 0);
  assert.ok(diff.annualCostSavings > 0);
  assert.ok(diff.equivalentTreesPlanted > 0);
});

test('vanilla energy engine: forecast generation & metrics', () => {
  const history = [120, 125, 118, 130, 122, 128, 124, 131];
  const res = generateForecast(history, 7);
  assert.equal(res.forecast.length, 7);
  assert.equal(res.metrics.sufficientData, true);
  assert.ok(res.metrics.mae >= 0);
  assert.ok(res.metrics.rmse >= 0);
  assert.ok(res.forecast[0].predictedKwh > 0);
});

test('vanilla energy engine: anomaly detection', () => {
  const facilityWithWaste = {
    id: 'fac-waste',
    name: 'Wasteful Facility',
    floorAreaSqM: 100,
    emissionFactorKgCo2PerKwh: 0.40,
    tariff: mockTariff,
    rooms: [{ id: 'r1', name: 'Lobby', floor: 1, areaSqM: 100 }],
    appliances: [
      {
        id: 'bad-vampire',
        name: 'Always-On Hot Water Urn',
        category: 'plug_load',
        roomId: 'r1',
        ratedWatts: 1500,
        standbyWatts: 120,
        quantity: 2,
        operatingHoursPerDay: 4,
        operatingDaysPerWeek: 7,
        utilizationFactor: 1.0,
      }
    ],
  };

  const anomalies = detectAnomalies(facilityWithWaste);
  assert.ok(anomalies.some(a => a.type === 'vampire_standby'));
});

test('vanilla energy engine: optimization engine', () => {
  const touTariff = {
    id: 'tou-commercial',
    name: 'Time of Use Commercial',
    type: 'tou',
    touPeriods: [
      { name: 'off_peak', rate: 0.08, startHour: 22, endHour: 6 },
      { name: 'peak', rate: 0.32, startHour: 13, endHour: 19 },
    ],
  };

  const shiftableFacility = {
    id: 'fac-opt',
    name: 'Industrial Laundry',
    floorAreaSqM: 400,
    emissionFactorKgCo2PerKwh: 0.45,
    tariff: touTariff,
    rooms: [{ id: 'wash-1', name: 'Wash Floor', floor: 1, areaSqM: 400 }],
    appliances: [
      {
        id: 'washer-1',
        name: 'Industrial Water Heater & Wash Units',
        category: 'machinery',
        roomId: 'wash-1',
        ratedWatts: 12000,
        quantity: 1,
        operatingHoursPerDay: 5,
        operatingDaysPerWeek: 7,
        utilizationFactor: 0.8,
        shiftable: true,
        operatingWindow: { startHour: 14, endHour: 19 },
      }
    ],
  };

  const opt = runOptimizationEngine(shiftableFacility);
  assert.equal(opt.feasible, true);
  assert.ok(opt.monthlySavings > 0);
  assert.ok(opt.shiftedAppliances.length > 0);
});
