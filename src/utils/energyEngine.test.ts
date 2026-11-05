import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateApplianceEnergy,
  calculateFacilityMetrics,
  compareScenarios,
  generateForecast,
  detectAnomalies,
  runOptimizationEngine,
  Appliance,
  Facility,
  TariffRate,
} from './energyEngine';

const mockTariff: TariffRate = {
  id: 'flat-standard',
  name: 'Commercial Flat Rate',
  type: 'flat',
  flatRate: 0.20, // $0.20 per kWh
  fixedMonthlyCharge: 50,
};

const mockAppliance: Appliance = {
  id: 'app-1',
  name: 'Office LED Fixtures',
  category: 'lighting',
  roomId: 'room-1',
  ratedWatts: 1000, // 1000 W = 1 kW
  standbyWatts: 0,
  quantity: 1,
  operatingHoursPerDay: 10,
  operatingDaysPerWeek: 7,
  utilizationFactor: 1.0,
};

test('deterministic appliance energy: 1000W for 10h/day = 10 kWh/day', () => {
  const result = calculateApplianceEnergy(mockAppliance, mockTariff, 0.5);
  // active kWh per day = 1000 * 1 * 10 * 1.0 / 1000 = 10 kWh
  assert.equal(result.dailyActiveKwh, 10);
  assert.equal(result.dailyTotalKwh, 10);
  assert.equal(result.weeklyTotalKwh, 70);
  // Annual kWh = 10 * 365 = 3650 kWh
  assert.equal(result.annualTotalKwh, 3650);
  // Annual cost at $0.20/kWh = $730
  assert.equal(result.annualCost, 730);
  // Annual CO2 at 0.5 kg/kWh = 1825 kg
  assert.equal(result.annualCo2Kg, 1825);
});

test('appliance standby calculation works as expected', () => {
  const appWithStandby: Appliance = {
    ...mockAppliance,
    ratedWatts: 500,
    standbyWatts: 50,
    operatingHoursPerDay: 8,
    operatingDaysPerWeek: 7,
  };
  const result = calculateApplianceEnergy(appWithStandby, mockTariff, 0.4);
  // active: 500 * 1 * 8 * 1 / 1000 = 4 kWh
  assert.equal(result.dailyActiveKwh, 4);
  // standby: 50 * 1 * 16 / 1000 = 0.8 kWh
  assert.equal(result.dailyStandbyKwh, 0.8);
  assert.equal(result.dailyTotalKwh, 4.8);
});

test('facility metrics aggregate correctly across rooms and appliances', () => {
  const mockFacility: Facility = {
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
  // Annual cost = monthlyCost * 12. Monthly kWh = 10 * (365/12) = 304.1666...
  // Base monthly cost = 304.1666 * 0.20 = $60.8333... + $50 fixed = $110.83
  assert.ok(metrics.facility.monthlyCost > 110 && metrics.facility.monthlyCost < 111);
  // Energy intensity = 3650 / 1000 = 3.65 kWh/m2 (rounded to 3.7 or 3.6)
  assert.ok(metrics.facility.energyIntensityKwhPerSqM >= 3.6 && metrics.facility.energyIntensityKwhPerSqM <= 3.7);
});

test('scenario comparison calculates deltas and savings accurately', () => {
  const baselineFacility: Facility = {
    id: 'fac-1',
    name: 'Facility Baseline',
    type: 'commercial_office',
    location: 'Austin, TX',
    floorAreaSqM: 500,
    occupancy: 25,
    floors: 1,
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/Chicago',
    emissionFactorKgCo2PerKwh: 0.40,
    tariff: mockTariff,
    rooms: [{ id: 'room-1', name: 'Main Room', floor: 1, areaSqM: 500, type: 'office', occupancyCapacity: 25 }],
    appliances: [
      { ...mockAppliance, ratedWatts: 2000, operatingHoursPerDay: 10 } // 20 kWh/day
    ],
  };

  const scenarioFacility: Facility = {
    ...baselineFacility,
    appliances: [
      { ...mockAppliance, ratedWatts: 1000, operatingHoursPerDay: 10 } // 10 kWh/day (50% reduction)
    ],
  };

  const diff = compareScenarios(baselineFacility, scenarioFacility);
  assert.equal(diff.percentEnergySavings, 50);
  assert.ok(diff.deltaMonthlyKwh > 0);
  assert.ok(diff.annualCostSavings > 0);
  assert.ok(diff.equivalentTreesPlanted > 0);
});

test('forecast handles minimum history and produces positive predictions', () => {
  const history = [120, 125, 118, 130, 122, 128, 124, 131];
  const res = generateForecast(history, 7);
  assert.equal(res.forecast.length, 7);
  assert.equal(res.metrics.sufficientData, true);
  assert.ok(res.metrics.mae >= 0);
  assert.ok(res.metrics.rmse >= 0);
  assert.ok(res.forecast[0].predictedKwh > 0);
  assert.ok(res.forecast[0].upperBoundKwh >= res.forecast[0].predictedKwh);
});

test('anomaly detector spots vampire standby waste', () => {
  const facilityWithWaste: Facility = {
    id: 'fac-waste',
    name: 'Wasteful Facility',
    type: 'commercial_office',
    location: 'Chicago, IL',
    floorAreaSqM: 100,
    occupancy: 10,
    floors: 1,
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/Chicago',
    emissionFactorKgCo2PerKwh: 0.40,
    tariff: mockTariff,
    rooms: [{ id: 'r1', name: 'Lobby', floor: 1, areaSqM: 100, type: 'common', occupancyCapacity: 10 }],
    appliances: [
      {
        id: 'bad-vampire',
        name: 'Always-On Hot Water Urn',
        category: 'plug_load',
        roomId: 'r1',
        ratedWatts: 1500,
        standbyWatts: 120, // heavy vampire standby
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

test('optimization engine proposes feasible load shifting savings', () => {
  const touTariff: TariffRate = {
    id: 'tou-commercial',
    name: 'Time of Use Commercial',
    type: 'tou',
    touPeriods: [
      { name: 'off_peak', rate: 0.08, startHour: 22, endHour: 6 },
      { name: 'peak', rate: 0.32, startHour: 13, endHour: 19 },
    ],
  };

  const shiftableFacility: Facility = {
    id: 'fac-opt',
    name: 'Industrial Laundry',
    type: 'manufacturing',
    location: 'Dallas, TX',
    floorAreaSqM: 400,
    occupancy: 15,
    floors: 1,
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/Chicago',
    emissionFactorKgCo2PerKwh: 0.45,
    tariff: touTariff,
    rooms: [{ id: 'wash-1', name: 'Wash Floor', floor: 1, areaSqM: 400, type: 'warehouse', occupancyCapacity: 15 }],
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
        operatingWindow: { startHour: 14, endHour: 19 }, // Currently in peak
      }
    ],
  };

  const opt = runOptimizationEngine(shiftableFacility);
  assert.equal(opt.feasible, true);
  assert.ok(opt.monthlySavings > 0);
  assert.ok(opt.shiftedAppliances.length > 0);
});
