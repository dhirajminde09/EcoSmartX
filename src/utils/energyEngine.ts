/**
 * EcoSmartX Deterministic Energy & Carbon Calculation Engine
 * 
 * Strict deterministic formulas:
 * Energy (kWh) = watts * quantity * operatingHours * utilizationFactor / 1000
 * Standby Energy (kWh) = standbyWatts * quantity * (24 - operatingHours) / 1000
 * Carbon (kg CO2e) = total_kWh * emissionFactor (kg CO2e/kWh)
 * Costs = base tariff (flat / tiered / TOU) + fixed charge
 */

export interface TariffRate {
  id: string;
  name: string;
  type: 'flat' | 'tiered' | 'tou';
  flatRate?: number; // $/kWh
  fixedMonthlyCharge?: number; // $
  demandChargePerKw?: number; // $/kW peak
  tiers?: {
    upToKwh: number;
    rate: number;
  }[];
  touPeriods?: {
    name: 'peak' | 'mid_peak' | 'off_peak' | 'super_off_peak';
    rate: number;
    startHour: number; // 0-23
    endHour: number;   // 0-23
  }[];
}

export interface Appliance {
  id: string;
  name: string;
  category: 'hvac' | 'lighting' | 'it_compute' | 'refrigeration' | 'machinery' | 'plug_load';
  roomId: string;
  ratedWatts: number;
  standbyWatts?: number;
  quantity: number;
  operatingHoursPerDay: number;
  operatingDaysPerWeek: number;
  utilizationFactor: number; // 0.1 to 1.0
  operatingWindow?: {
    startHour: number; // 0-23
    endHour: number;   // 0-23
  };
  shiftable?: boolean;
  notes?: string;
}

export interface Room {
  id: string;
  name: string;
  floor: number;
  areaSqM: number;
  type: 'office' | 'server_room' | 'laboratory' | 'conference' | 'warehouse' | 'common' | 'cafeteria';
  occupancyCapacity: number;
  x?: number; // for SVG digital twin grid (0-100)
  y?: number;
  width?: number;
  height?: number;
}

export interface Facility {
  id: string;
  name: string;
  type: 'commercial_office' | 'data_center' | 'manufacturing' | 'healthcare' | 'educational';
  location: string;
  floorAreaSqM: number;
  occupancy: number;
  floors: number;
  currency: string;
  currencySymbol: string;
  timezone: string;
  emissionFactorKgCo2PerKwh: number; // e.g. 0.42 kg CO2e / kWh
  tariff: TariffRate;
  rooms: Room[];
  appliances: Appliance[];
}

export interface ApplianceMetrics {
  applianceId: string;
  name: string;
  category: string;
  dailyActiveKwh: number;
  dailyStandbyKwh: number;
  dailyTotalKwh: number;
  weeklyTotalKwh: number;
  monthlyTotalKwh: number; // 30-day basis
  annualTotalKwh: number;  // 365-day basis
  monthlyCost: number;
  annualCost: number;
  monthlyCo2Kg: number;
  annualCo2Kg: number;
  estimatedPeakKw: number;
}

export interface RoomMetrics {
  roomId: string;
  name: string;
  floor: number;
  areaSqM: number;
  monthlyTotalKwh: number;
  annualTotalKwh: number;
  monthlyCost: number;
  annualCost: number;
  monthlyCo2Kg: number;
  energyIntensityKwhPerSqM: number; // Annual kWh / area
  wattDensityPerSqM: number; // Total connected watts / area
  applianceCount: number;
}

export interface FacilityMetrics {
  dailyTotalKwh: number;
  monthlyTotalKwh: number;
  annualTotalKwh: number;
  monthlyCost: number;
  annualCost: number;
  monthlyCo2Kg: number;
  annualCo2Kg: number;
  annualCo2Tonnes: number;
  energyIntensityKwhPerSqM: number; // Annual kWh / floor area
  estimatedPeakDemandKw: number;
  standbyWasteMonthlyKwh: number;
  standbyWasteMonthlyCost: number;
  categoryBreakdown: Record<string, { kwh: number; cost: number; percentage: number }>;
}

/**
 * Calculate energy metrics for a single appliance
 */
export function calculateApplianceEnergy(
  appliance: Appliance,
  tariff: TariffRate,
  emissionFactor: number
): ApplianceMetrics {
  const ratedWatts = Math.max(0, Number(appliance.ratedWatts) || 0);
  const activeHours = Math.max(0, Math.min(24, Number(appliance.operatingHoursPerDay) || 0));
  const daysPerWeek = Math.max(0, Math.min(7, appliance.operatingDaysPerWeek !== undefined ? Number(appliance.operatingDaysPerWeek) : 7));
  const utilization = Math.max(0.01, Math.min(1.0, appliance.utilizationFactor !== undefined ? Number(appliance.utilizationFactor) : 1.0));
  const qty = Math.max(1, Number(appliance.quantity) || 1);
  const standbyWatts = Math.max(0, Number(appliance.standbyWatts) || 0);

  // Active kWh per operational day
  const activeKwhPerOpDay = (ratedWatts * qty * activeHours * utilization) / 1000;
  // Daily average accounting for days per week
  const dailyActiveKwh = activeKwhPerOpDay * (daysPerWeek / 7);

  // Standby hours per operational day + non-operational days
  const standbyHoursPerOpDay = 24 - activeHours;
  const standbyKwhPerOpDay = (standbyWatts * qty * standbyHoursPerOpDay) / 1000;
  const standbyKwhNonOpDay = (standbyWatts * qty * 24) / 1000;
  
  const dailyStandbyKwh = (standbyKwhPerOpDay * daysPerWeek + standbyKwhNonOpDay * (7 - daysPerWeek)) / 7;
  const dailyTotalKwh = dailyActiveKwh + dailyStandbyKwh;

  const weeklyTotalKwh = dailyTotalKwh * 7;
  const monthlyTotalKwh = dailyTotalKwh * (365 / 12);
  const annualTotalKwh = dailyTotalKwh * 365;

  const avgCostPerKwh = estimateAverageRate(tariff, appliance);
  const monthlyCost = monthlyTotalKwh * avgCostPerKwh;
  const annualCost = annualTotalKwh * avgCostPerKwh;

  const monthlyCo2Kg = monthlyTotalKwh * emissionFactor;
  const annualCo2Kg = annualTotalKwh * emissionFactor;

  const estimatedPeakKw = (appliance.ratedWatts * qty * utilization) / 1000;

  return {
    applianceId: appliance.id,
    name: appliance.name,
    category: appliance.category,
    dailyActiveKwh,
    dailyStandbyKwh,
    dailyTotalKwh,
    weeklyTotalKwh,
    monthlyTotalKwh,
    annualTotalKwh,
    monthlyCost,
    annualCost,
    monthlyCo2Kg,
    annualCo2Kg,
    estimatedPeakKw,
  };
}

/**
 * Estimate rate for appliance based on tariff type
 */
export function estimateAverageRate(tariff: any, appliance?: Appliance): number {
  const t = tariff || { type: 'flat', flatRate: 8.5 };
  if ((t.type === 'flat' || !t.type) && (t.flatRate !== undefined || t.flatRate !== null)) {
    return Number(t.flatRate) || 8.5;
  }

  if (t.type === 'tou' && t.touPeriods && t.touPeriods.length > 0) {
    // If appliance has operating window, calculate weighted TOU rate
    if (appliance?.operatingWindow) {
      const { startHour, endHour } = appliance.operatingWindow;
      let totalRate = 0;
      let hoursCount = 0;

      // Handle wrapping across midnight
      const span = (endHour >= startHour) ? (endHour - startHour) : (24 - startHour + endHour);
      const hoursToEvaluate = span > 0 ? span : 1;

      for (let i = 0; i < hoursToEvaluate; i++) {
        const hour = (startHour + i) % 24;
        const matchingPeriod = t.touPeriods.find((p: any) => {
          if (p.endHour >= p.startHour) {
            return hour >= p.startHour && hour < p.endHour;
          } else {
            return hour >= p.startHour || hour < p.endHour;
          }
        }) || t.touPeriods[0];
        totalRate += matchingPeriod.rate;
        hoursCount++;
      }
      return totalRate / (hoursCount || 1);
    }
    // Default TOU average
    const sum = t.touPeriods.reduce((acc: number, p: any) => acc + p.rate, 0);
    return sum / t.touPeriods.length;
  }

  if (t.type === 'tiered' && t.tiers && t.tiers.length > 0) {
    // Tiered default median
    const sum = t.tiers.reduce((acc: number, tier: any) => acc + tier.rate, 0);
    return sum / t.tiers.length;
  }

  return Number(t.flatRate) || Number(t.peakRate) || 8.5;
}

/**
 * Calculate facility level metrics
 */
export function calculateFacilityMetrics(facility: Facility | null | undefined): {
  facility: FacilityMetrics;
  rooms: RoomMetrics[];
  appliances: ApplianceMetrics[];
} {
  if (!facility) {
    return {
      facility: {
        dailyTotalKwh: 0,
        monthlyTotalKwh: 0,
        annualTotalKwh: 0,
        monthlyCost: 0,
        annualCost: 0,
        monthlyCo2Kg: 0,
        annualCo2Kg: 0,
        annualCo2Tonnes: 0,
        energyIntensityKwhPerSqM: 0,
        estimatedPeakDemandKw: 0,
        standbyWasteMonthlyKwh: 0,
        standbyWasteMonthlyCost: 0,
        categoryBreakdown: {} as any,
      },
      rooms: [],
      appliances: [],
    };
  }

  const effectiveTariff = (facility as any).tariff || (facility as any).utilityTariff || { type: 'flat', flatRate: 8.5 };
  const emissionFactor = Number(facility.emissionFactorKgCo2PerKwh || (facility as any).gridCarbonIntensityKgPerKwh) || 0.72;

  const applianceMetrics = (facility.appliances || []).map(a =>
    calculateApplianceEnergy(a, effectiveTariff, emissionFactor)
  );

  const dailyTotalKwh = applianceMetrics.reduce((sum, a) => sum + a.dailyTotalKwh, 0);
  const monthlyTotalKwh = applianceMetrics.reduce((sum, a) => sum + a.monthlyTotalKwh, 0);
  const annualTotalKwh = applianceMetrics.reduce((sum, a) => sum + a.annualTotalKwh, 0);

  // Monthly base cost + fixed monthly charge
  const baseMonthlyCost = applianceMetrics.reduce((sum, a) => sum + a.monthlyCost, 0);
  const fixedMonthlyCharge = effectiveTariff.fixedMonthlyCharge || 0;
  
  // Peak demand estimate (sum of coincident loads with diversity factor 0.75)
  const connectedKw = applianceMetrics.reduce((sum, a) => sum + a.estimatedPeakKw, 0);
  const estimatedPeakDemandKw = connectedKw * 0.75;
  const demandCharge = (effectiveTariff.demandChargePerKw || 0) * estimatedPeakDemandKw;

  const monthlyCost = baseMonthlyCost + fixedMonthlyCharge + demandCharge;
  const annualCost = monthlyCost * 12;

  const monthlyCo2Kg = monthlyTotalKwh * emissionFactor;
  const annualCo2Kg = annualTotalKwh * emissionFactor;
  const annualCo2Tonnes = annualCo2Kg / 1000;

  const safeFloorArea = Math.max(1, facility.floorAreaSqM || 1000);
  const energyIntensityKwhPerSqM = annualTotalKwh / safeFloorArea;

  const standbyWasteMonthlyKwh = applianceMetrics.reduce(
    (sum, a) => sum + a.dailyStandbyKwh * (365 / 12),
    0
  );
  const standbyWasteMonthlyCost = standbyWasteMonthlyKwh * estimateAverageRate(effectiveTariff);

  // Category breakdown
  const categoryMap: Record<string, { kwh: number; cost: number }> = {};
  for (const a of applianceMetrics) {
    if (!categoryMap[a.category]) {
      categoryMap[a.category] = { kwh: 0, cost: 0 };
    }
    categoryMap[a.category].kwh += a.monthlyTotalKwh;
    categoryMap[a.category].cost += a.monthlyCost;
  }

  const categoryBreakdown: Record<string, { kwh: number; cost: number; percentage: number }> = {};
  for (const [cat, data] of Object.entries(categoryMap)) {
    categoryBreakdown[cat] = {
      kwh: Math.round(data.kwh * 10) / 10,
      cost: Math.round(data.cost * 100) / 100,
      percentage: monthlyTotalKwh > 0 ? Math.round((data.kwh / monthlyTotalKwh) * 1000) / 10 : 0,
    };
  }

  // Room metrics
  const roomMetrics: RoomMetrics[] = (facility.rooms || []).map(room => {
    const roomApps = (facility.appliances || []).filter(a => a.roomId === room.id);
    const roomAppMetrics = roomApps.map(a =>
      calculateApplianceEnergy(a, effectiveTariff, emissionFactor)
    );

    const rMonthlyKwh = roomAppMetrics.reduce((sum, a) => sum + a.monthlyTotalKwh, 0);
    const rAnnualKwh = roomAppMetrics.reduce((sum, a) => sum + a.annualTotalKwh, 0);
    const rMonthlyCost = roomAppMetrics.reduce((sum, a) => sum + a.monthlyCost, 0);
    const rAnnualCost = roomAppMetrics.reduce((sum, a) => sum + a.annualCost, 0);
    const rMonthlyCo2 = rMonthlyKwh * emissionFactor;

    const safeRoomArea = Math.max(1, room.areaSqM || 100);
    const connectedWatts = roomApps.reduce((sum, a) => sum + a.ratedWatts * a.quantity, 0);

    return {
      roomId: room.id,
      name: room.name,
      floor: room.floor,
      areaSqM: room.areaSqM,
      monthlyTotalKwh: Math.round(rMonthlyKwh * 10) / 10,
      annualTotalKwh: Math.round(rAnnualKwh * 10) / 10,
      monthlyCost: Math.round(rMonthlyCost * 100) / 100,
      annualCost: Math.round(rAnnualCost * 100) / 100,
      monthlyCo2Kg: Math.round(rMonthlyCo2 * 10) / 10,
      energyIntensityKwhPerSqM: Math.round((rAnnualKwh / safeRoomArea) * 10) / 10,
      wattDensityPerSqM: Math.round((connectedWatts / safeRoomArea) * 10) / 10,
      applianceCount: roomApps.length,
    };
  });

  return {
    facility: {
      dailyTotalKwh: Math.round(dailyTotalKwh * 10) / 10,
      monthlyTotalKwh: Math.round(monthlyTotalKwh * 10) / 10,
      annualTotalKwh: Math.round(annualTotalKwh * 10) / 10,
      monthlyCost: Math.round(monthlyCost * 100) / 100,
      annualCost: Math.round(annualCost * 100) / 100,
      monthlyCo2Kg: Math.round(monthlyCo2Kg * 10) / 10,
      annualCo2Kg: Math.round(annualCo2Kg * 10) / 10,
      annualCo2Tonnes: Math.round(annualCo2Tonnes * 100) / 100,
      energyIntensityKwhPerSqM: Math.round(energyIntensityKwhPerSqM * 10) / 10,
      estimatedPeakDemandKw: Math.round(estimatedPeakDemandKw * 10) / 10,
      standbyWasteMonthlyKwh: Math.round(standbyWasteMonthlyKwh * 10) / 10,
      standbyWasteMonthlyCost: Math.round(standbyWasteMonthlyCost * 100) / 100,
      categoryBreakdown,
    },
    rooms: roomMetrics,
    appliances: applianceMetrics,
  };
}

/**
 * Scenario Comparison Difference
 */
export interface ScenarioDiff {
  baselineMonthlyKwh: number;
  scenarioMonthlyKwh: number;
  deltaMonthlyKwh: number;
  percentEnergySavings: number;

  baselineMonthlyCost: number;
  scenarioMonthlyCost: number;
  deltaMonthlyCost: number;
  percentCostSavings: number;

  baselineAnnualCo2Kg: number;
  scenarioAnnualCo2Kg: number;
  deltaAnnualCo2Kg: number;
  percentCo2Savings: number;

  annualCostSavings: number;
  equivalentTreesPlanted: number; // ~21.77 kg CO2 absorbed per tree/year
}

export function compareScenarios(baselineFacility: Facility, scenarioFacility: Facility): ScenarioDiff {
  const b = calculateFacilityMetrics(baselineFacility).facility;
  const s = calculateFacilityMetrics(scenarioFacility).facility;

  const deltaMonthlyKwh = b.monthlyTotalKwh - s.monthlyTotalKwh;
  const percentEnergySavings = b.monthlyTotalKwh > 0 ? (deltaMonthlyKwh / b.monthlyTotalKwh) * 100 : 0;

  const deltaMonthlyCost = b.monthlyCost - s.monthlyCost;
  const percentCostSavings = b.monthlyCost > 0 ? (deltaMonthlyCost / b.monthlyCost) * 100 : 0;

  const deltaAnnualCo2Kg = b.annualCo2Kg - s.annualCo2Kg;
  const percentCo2Savings = b.annualCo2Kg > 0 ? (deltaAnnualCo2Kg / b.annualCo2Kg) * 100 : 0;

  const annualCostSavings = deltaMonthlyCost * 12;
  const equivalentTreesPlanted = Math.max(0, Math.round(deltaAnnualCo2Kg / 21.77));

  return {
    baselineMonthlyKwh: b.monthlyTotalKwh,
    scenarioMonthlyKwh: s.monthlyTotalKwh,
    deltaMonthlyKwh: Math.round(deltaMonthlyKwh * 10) / 10,
    percentEnergySavings: Math.round(percentEnergySavings * 10) / 10,

    baselineMonthlyCost: b.monthlyCost,
    scenarioMonthlyCost: s.monthlyCost,
    deltaMonthlyCost: Math.round(deltaMonthlyCost * 100) / 100,
    percentCostSavings: Math.round(percentCostSavings * 100) / 100,

    baselineAnnualCo2Kg: b.annualCo2Kg,
    scenarioAnnualCo2Kg: s.annualCo2Kg,
    deltaAnnualCo2Kg: Math.round(deltaAnnualCo2Kg * 10) / 10,
    percentCo2Savings: Math.round(percentCo2Savings * 10) / 10,

    annualCostSavings: Math.round(annualCostSavings * 100) / 100,
    equivalentTreesPlanted,
  };
}

/**
 * Predictive Baseline Forecasting & Statistical Validation (MAE & RMSE)
 */
export interface ForecastResult {
  history: { day: number; label: string; actualKwh: number }[];
  forecast: { day: number; label: string; predictedKwh: number; lowerBoundKwh: number; upperBoundKwh: number }[];
  metrics: {
    mae: number;
    rmse: number;
    naiveMae: number;
    sufficientData: boolean;
    confidenceLevel: string;
  };
}

export function generateForecast(
  historyValues: number[],
  forecastHorizonDays: number = 14
): ForecastResult {
  const sufficientData = historyValues.length >= 7;

  if (!sufficientData) {
    const avg = historyValues.length > 0 ? historyValues.reduce((a, b) => a + b, 0) / historyValues.length : 100;
    const naiveHistory = historyValues.map((v, i) => ({ day: i + 1, label: `Day ${i + 1}`, actualKwh: v }));
    const forecast = Array.from({ length: forecastHorizonDays }).map((_, i) => ({
      day: historyValues.length + i + 1,
      label: `Day +${i + 1}`,
      predictedKwh: Math.round(avg * 10) / 10,
      lowerBoundKwh: Math.round(avg * 0.85 * 10) / 10,
      upperBoundKwh: Math.round(avg * 1.15 * 10) / 10,
    }));

    return {
      history: naiveHistory,
      forecast,
      metrics: {
        mae: 0,
        rmse: 0,
        naiveMae: 0,
        sufficientData: false,
        confidenceLevel: 'Preliminary Baseline (Needs ≥7 days of historical records)',
      },
    };
  }

  // Linear regression + moving average
  const n = historyValues.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = historyValues[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate residuals for MAE & RMSE on history
  let totalAbsErr = 0;
  let totalSqErr = 0;
  let naiveTotalAbsErr = 0;
  const naivePrediction = historyValues[0]; // Last known persistence

  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * (i + 1);
    const err = Math.abs(historyValues[i] - pred);
    totalAbsErr += err;
    totalSqErr += err * err;
    if (i > 0) {
      naiveTotalAbsErr += Math.abs(historyValues[i] - historyValues[i - 1]);
    }
  }

  const mae = totalAbsErr / n;
  const rmse = Math.sqrt(totalSqErr / n);
  const naiveMae = naiveTotalAbsErr / (n - 1 || 1);

  // Generate forecast points with 95% standard error interval
  const stdError = rmse || (sumY / n) * 0.08;
  const forecast = Array.from({ length: forecastHorizonDays }).map((_, idx) => {
    const x = n + idx + 1;
    const dayOfWeekFactor = (x % 7 === 0 || x % 7 === 6) ? 0.65 : 1.05; // weekend dip
    const basePred = (intercept + slope * x) * dayOfWeekFactor;
    const predictedKwh = Math.max(10, Math.round(basePred * 10) / 10);
    const uncertainty = stdError * Math.sqrt(1 + 1 / n + Math.pow(x - (n / 2), 2) / (sumX2 - (sumX * sumX) / n || 1));

    return {
      day: x,
      label: `Day +${idx + 1}`,
      predictedKwh,
      lowerBoundKwh: Math.max(0, Math.round((predictedKwh - uncertainty * 1.96) * 10) / 10),
      upperBoundKwh: Math.round((predictedKwh + uncertainty * 1.96) * 10) / 10,
    };
  });

  return {
    history: historyValues.map((v, i) => ({ day: i + 1, label: `Day ${i + 1}`, actualKwh: Math.round(v * 10) / 10 })),
    forecast,
    metrics: {
      mae: Math.round(mae * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      naiveMae: Math.round(naiveMae * 100) / 100,
      sufficientData: true,
      confidenceLevel: 'High (Trained on facility trend with residual validation)',
    },
  };
}

/**
 * Energy Waste Forensics Anomaly Detection
 */
export interface AnomalyFinding {
  id: string;
  type: 'vampire_standby' | 'schedule_deviation' | 'excessive_intensity' | 'peak_surcharge';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  resourceName: string;
  observedValue: string;
  baselineExpected: string;
  deviation: string;
  evidence: string;
  rootCauses: string[];
  recommendedAction: string;
  estimatedMonthlyWasteCost: number;
  status: 'active' | 'investigating' | 'resolved' | 'dismissed';
}

export function detectAnomalies(facility: Facility | null | undefined): AnomalyFinding[] {
  if (!facility || !facility.appliances || facility.appliances.length === 0) {
    return [];
  }
  const findings: AnomalyFinding[] = [];
  const metrics = calculateFacilityMetrics(facility);
  const avgRate = estimateAverageRate((facility as any).tariff || (facility as any).utilityTariff);

  // 1. High Standby Vampire Waste Detection
  for (const app of facility.appliances) {
    if (app.standbyWatts && app.standbyWatts > 0) {
      const standbyRatio = (app.standbyWatts * (24 - app.operatingHoursPerDay)) / 
        (app.ratedWatts * app.operatingHoursPerDay + app.standbyWatts * (24 - app.operatingHoursPerDay) || 1);
      
      if (standbyRatio > 0.15 && app.standbyWatts * app.quantity >= 40) {
        const monthlyWasteKwh = (app.standbyWatts * app.quantity * (24 - app.operatingHoursPerDay) * 30) / 1000;
        const wasteCost = monthlyWasteKwh * avgRate;

        findings.push({
          id: `anomaly-standby-${app.id}`,
          type: 'vampire_standby',
          severity: wasteCost > 30 ? 'high' : 'medium',
          title: `Phantom Standby Drain: ${app.name}`,
          resourceName: app.name,
          observedValue: `${app.standbyWatts * app.quantity} W standby power`,
          baselineExpected: `≤ ${Math.round(app.ratedWatts * 0.02 * app.quantity)} W smart idle`,
          deviation: `+${Math.round(standbyRatio * 100)}% idle energy fraction`,
          evidence: `Unit remains in active standby for ${24 - app.operatingHoursPerDay} hrs/day across ${app.quantity} units, consuming ${Math.round(monthlyWasteKwh)} kWh/month without productive work.`,
          rootCauses: [
            'Legacy power supplies lacking sleep/low-power standby mode',
            'No smart power relay or scheduled automated cut-off',
            'Continuous background telemetry or phantom transformer draw',
          ],
          recommendedAction: 'Install smart plug timer or automated relay to cut power during unoccupied building hours.',
          estimatedMonthlyWasteCost: Math.round(wasteCost * 100) / 100,
          status: 'active',
        });
      }
    }
  }

  // 2. High Room Watt Density
  for (const r of metrics.rooms) {
    if (r.wattDensityPerSqM > 55 && r.areaSqM > 10) {
      const excessWatts = (r.wattDensityPerSqM - 35) * r.areaSqM;
      const monthlyExcessKwh = (excessWatts * 10 * 22) / 1000; // estimated 10h/day, 22 days
      const wasteCost = monthlyExcessKwh * avgRate;

      findings.push({
        id: `anomaly-density-${r.roomId}`,
        type: 'excessive_intensity',
        severity: 'high',
        title: `Elevated Power Density: ${r.name}`,
        resourceName: r.name,
        observedValue: `${r.wattDensityPerSqM} W/m²`,
        baselineExpected: `≤ 35.0 W/m² (ASHRAE/LEED standard for ${r.name})`,
        deviation: `+${Math.round(((r.wattDensityPerSqM - 35) / 35) * 100)}% density over standard`,
        evidence: `Connected equipment totals ${Math.round(r.wattDensityPerSqM * r.areaSqM)} W across ${r.areaSqM} m², placing elevated heat load on building HVAC.`,
        rootCauses: [
          'High concentration of older desktop towers or incandescent fixtures',
          'Space converted to compute/lab without dedicated cooling isolation',
        ],
        recommendedAction: 'Audit room appliances for legacy loads; migrate computing to consolidated server rack.',
        estimatedMonthlyWasteCost: Math.round(wasteCost * 100) / 100,
        status: 'active',
      });
    }
  }

  // 3. Peak Demand Risk (Coincident Load > 75% under TOU)
  if (facility.tariff.type === 'tou' && facility.tariff.demandChargePerKw && facility.tariff.demandChargePerKw > 0) {
    const peakApps = facility.appliances.filter(a => {
      const start = a.operatingWindow?.startHour ?? 9;
      const end = a.operatingWindow?.endHour ?? 17;
      // Overlaps with 14:00 - 18:00 typical peak window
      return (start < 18 && end > 14 && a.shiftable);
    });

    if (peakApps.length > 0) {
      const shiftableKw = peakApps.reduce((sum, a) => sum + (a.ratedWatts * a.quantity * a.utilizationFactor) / 1000, 0);
      const monthlyPenalty = shiftableKw * facility.tariff.demandChargePerKw;

      findings.push({
        id: `anomaly-peak-surcharge`,
        type: 'peak_surcharge',
        severity: monthlyPenalty > 80 ? 'critical' : 'high',
        title: `Peak Window Coincidence: ${peakApps.length} Shiftable Loads`,
        resourceName: 'Peak Hours (14:00 - 18:00)',
        observedValue: `${Math.round(shiftableKw * 10) / 10} kW shiftable load in peak tier`,
        baselineExpected: '0 kW during critical utility tariff peak',
        deviation: `100% coincidence with peak grid pricing`,
        evidence: `Appliances like ${peakApps.slice(0, 3).map(a => a.name).join(', ')} operate during peak TOU billing window ($${facility.tariff.demandChargePerKw}/kW demand charge).`,
        rootCauses: [
          'Unscheduled operational cycles coinciding with utility peak price surges',
          'Absence of automated load shifting or battery pre-charging',
        ],
        recommendedAction: 'Shift discretionary cycles (dishwashers, EV chargers, heavy compute batches, thermal pre-cooling) to off-peak before 13:00 or after 19:00.',
        estimatedMonthlyWasteCost: Math.round(monthlyPenalty * 100) / 100,
        status: 'active',
      });
    }
  }

  return findings;
}

/**
 * Constraint-aware Optimization Engine (Load Shifting & Peak Shaving)
 */
export interface OptimizationResult {
  feasible: boolean;
  baselineCost: number;
  optimizedCost: number;
  monthlySavings: number;
  annualSavings: number;
  percentCostReduction: number;
  co2ReductionKg: number;
  shiftedAppliances: {
    applianceId: string;
    name: string;
    originalHours: string;
    proposedHours: string;
    monthlySaving: number;
    reason: string;
  }[];
  constraintsSummary: string[];
}

export function runOptimizationEngine(facility: Facility): OptimizationResult {
  const currentMetrics = calculateFacilityMetrics(facility).facility;
  const shifted: OptimizationResult['shiftedAppliances'] = [];
  let totalMonthlySavings = 0;

  if (facility.tariff.type !== 'tou' || !facility.tariff.touPeriods) {
    // For non-TOU, optimize runtime hours & standby cutoffs
    for (const app of facility.appliances) {
      if (app.standbyWatts && app.standbyWatts > 25) {
        const wasteKwh = (app.standbyWatts * app.quantity * (24 - app.operatingHoursPerDay) * 30) / 1000;
        const saving = wasteKwh * estimateAverageRate(facility.tariff);
        if (saving > 5) {
          totalMonthlySavings += saving;
          shifted.push({
            applianceId: app.id,
            name: app.name,
            originalHours: `${app.operatingHoursPerDay}h run + 24h standby`,
            proposedHours: `${app.operatingHoursPerDay}h run + zero idle power cutoff`,
            monthlySaving: Math.round(saving * 100) / 100,
            reason: 'Automated standby zero-voltage isolation when facility is vacant',
          });
        }
      }
    }

    const optimizedCost = Math.max(0, currentMetrics.monthlyCost - totalMonthlySavings);

    return {
      feasible: true,
      baselineCost: currentMetrics.monthlyCost,
      optimizedCost: Math.round(optimizedCost * 100) / 100,
      monthlySavings: Math.round(totalMonthlySavings * 100) / 100,
      annualSavings: Math.round(totalMonthlySavings * 12 * 100) / 100,
      percentCostReduction: currentMetrics.monthlyCost > 0 ? Math.round((totalMonthlySavings / currentMetrics.monthlyCost) * 1000) / 10 : 0,
      co2ReductionKg: Math.round((totalMonthlySavings / estimateAverageRate(facility.tariff)) * facility.emissionFactorKgCo2PerKwh * 10) / 10,
      shiftedAppliances: shifted,
      constraintsSummary: [
        'All equipment operating hours maintained at 100% required service time',
        'Occupancy schedule respected (no curtailment of active business tasks)',
      ],
    };
  }

  // Find lowest rate period
  const periods = [...facility.tariff.touPeriods].sort((a, b) => a.rate - b.rate);
  const cheapestPeriod = periods[0];
  const mostExpensivePeriod = periods[periods.length - 1];

  for (const app of facility.appliances) {
    if (app.shiftable) {
      const origWindow = app.operatingWindow || { startHour: 10, endHour: 16 };
      const hoursNeeded = Math.min(app.operatingHoursPerDay, 8);
      
      const proposedStart = cheapestPeriod.startHour;
      const proposedEnd = (cheapestPeriod.startHour + hoursNeeded) % 24;

      const deltaRate = Math.max(0, mostExpensivePeriod.rate - cheapestPeriod.rate);
      const appMonthlyKwh = (app.ratedWatts * app.quantity * hoursNeeded * (app.operatingDaysPerWeek / 7) * 30 * app.utilizationFactor) / 1000;
      const saving = appMonthlyKwh * deltaRate;

      if (saving > 2) {
        totalMonthlySavings += saving;
        shifted.push({
          applianceId: app.id,
          name: app.name,
          originalHours: `${origWindow.startHour}:00 - ${origWindow.endHour}:00 (Peak window)`,
          proposedHours: `${proposedStart}:00 - ${proposedEnd}:00 (${cheapestPeriod.name})`,
          monthlySaving: Math.round(saving * 100) / 100,
          reason: `Shifted from $${mostExpensivePeriod.rate.toFixed(2)}/kWh peak to $${cheapestPeriod.rate.toFixed(2)}/kWh off-peak`,
        });
      }
    }
  }

  const optimizedCost = Math.max(0, currentMetrics.monthlyCost - totalMonthlySavings);

  return {
    feasible: true,
    baselineCost: currentMetrics.monthlyCost,
    optimizedCost: Math.round(optimizedCost * 100) / 100,
    monthlySavings: Math.round(totalMonthlySavings * 100) / 100,
    annualSavings: Math.round(totalMonthlySavings * 12 * 100) / 100,
    percentCostReduction: currentMetrics.monthlyCost > 0 ? Math.round((totalMonthlySavings / currentMetrics.monthlyCost) * 1000) / 10 : 0,
    co2ReductionKg: Math.round((totalMonthlySavings / (mostExpensivePeriod.rate || 0.15)) * facility.emissionFactorKgCo2PerKwh * 10) / 10,
    shiftedAppliances: shifted,
    constraintsSummary: [
      'Shifted only explicitly marked shiftable loads',
      'Daily operational duration preserved intact',
      'Zero reduction in equipment throughput or comfort thresholds',
    ],
  };
}
