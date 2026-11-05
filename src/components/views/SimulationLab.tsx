import React, { useState, useMemo } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import {
  calculateFacilityMetrics,
  compareScenarios,
  Facility,
  Appliance,
} from '../../utils/energyEngine';
import {
  Sliders,
  RotateCcw,
  Save,
  TrendingDown,
  Zap,
  DollarSign,
  Leaf,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { NavigationTab } from '../Sidebar';

interface SimulationLabProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({ onNavigate }) => {
  const { activeFacility, createScenario } = useEnergy();

  // Global levers state
  const [hvacReductionPct, setHvacReductionPct] = useState<number>(10); // 10% HVAC reduction via setback
  const [lightingReductionPct, setLightingReductionPct] = useState<number>(25); // 25% Lighting reduction via smart sensors
  const [cutStandbyWaste, setCutStandbyWaste] = useState<boolean>(true); // eliminate vampire standby
  const [shiftShiftableLoads, setShiftShiftableLoads] = useState<boolean>(true); // shift to cheapest TOU hours

  // Custom appliance overrides map: applianceId -> { powerScale, hoursDelta }
  const [applianceOverrides, setApplianceOverrides] = useState<
    Record<string, { powerScale: number; hoursDelta: number }>
  >({});

  // Save Scenario modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('Deep Efficiency Retrofit 2026');
  const [scenarioDesc, setScenarioDesc] = useState(
    'Combined HVAC thermostat setback, smart lighting harvesting, and zero-standby cutoff'
  );

  // Compute simulated facility
  const simulatedFacility: Facility = useMemo(() => {
    const updatedAppliances: Appliance[] = activeFacility.appliances.map(app => {
      let ratedWatts = app.ratedWatts;
      let standbyWatts = app.standbyWatts || 0;
      let operatingHours = app.operatingHoursPerDay;
      let opWindow = app.operatingWindow;

      // Apply category levers
      if (app.category === 'hvac') {
        ratedWatts = Math.round(ratedWatts * (1 - hvacReductionPct / 100));
      } else if (app.category === 'lighting') {
        ratedWatts = Math.round(ratedWatts * (1 - lightingReductionPct / 100));
      }

      // Standby elimination
      if (cutStandbyWaste && standbyWatts > 0) {
        standbyWatts = Math.round(standbyWatts * 0.1); // 90% eliminated via smart smart-relays
      }

      // Load shifting
      if (shiftShiftableLoads && app.shiftable) {
        opWindow = { startHour: 23, endHour: (23 + Math.min(8, app.operatingHoursPerDay)) % 24 };
      }

      // Apply individual override if exists
      const override = applianceOverrides[app.id];
      if (override) {
        ratedWatts = Math.round(ratedWatts * override.powerScale);
        operatingHours = Math.max(0, Math.min(24, operatingHours + override.hoursDelta));
      }

      return {
        ...app,
        ratedWatts,
        standbyWatts,
        operatingHoursPerDay: operatingHours,
        operatingWindow: opWindow,
      };
    });

    return {
      ...activeFacility,
      appliances: updatedAppliances,
    };
  }, [
    activeFacility,
    hvacReductionPct,
    lightingReductionPct,
    cutStandbyWaste,
    shiftShiftableLoads,
    applianceOverrides,
  ]);

  // Compare baseline vs simulated
  const comparison = useMemo(() => {
    return compareScenarios(activeFacility, simulatedFacility);
  }, [activeFacility, simulatedFacility]);

  const handleResetLevers = () => {
    setHvacReductionPct(0);
    setLightingReductionPct(0);
    setCutStandbyWaste(false);
    setShiftShiftableLoads(false);
    setApplianceOverrides({});
  };

  const handleSaveScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;
    createScenario(scenarioName.trim(), scenarioDesc.trim(), simulatedFacility);
    setIsSaveModalOpen(false);
    onNavigate('scenarios');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Interactive What-If Modeling</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Energy Simulation Lab
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test conservation assumptions, operational adjustments, and calculate verified before-and-after savings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetLevers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Levers</span>
          </button>
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as Scenario</span>
          </button>
        </div>
      </div>

      {/* Before / After KPI Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Monthly Cost Savings */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Projected Cost Savings</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              {activeFacility.currencySymbol}
              {comparison.deltaMonthlyCost.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-300">
              (-{comparison.percentCostSavings}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 border-t border-slate-800/60 pt-2 flex items-center justify-between">
            <span>Baseline: {activeFacility.currencySymbol}{Math.round(comparison.baselineMonthlyCost)}</span>
            <span className="text-emerald-300 font-semibold">
              Save {activeFacility.currencySymbol}{Math.round(comparison.annualCostSavings).toLocaleString()}/yr
            </span>
          </div>
        </div>

        {/* Energy Savings */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Monthly Energy Reduction</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400">
              {comparison.deltaMonthlyKwh.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-cyan-300">
              kWh (-{comparison.percentEnergySavings}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 border-t border-slate-800/60 pt-2 flex items-center justify-between">
            <span>From: {Math.round(comparison.baselineMonthlyKwh).toLocaleString()} kWh</span>
            <span className="text-cyan-300 font-semibold">
              To: {Math.round(comparison.scenarioMonthlyKwh).toLocaleString()} kWh
            </span>
          </div>
        </div>

        {/* Carbon Abatement */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Annual CO₂ Abatement</span>
            <Leaf className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-400">
              {(comparison.deltaAnnualCo2Kg / 1000).toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-teal-300">
              MT CO₂e (-{comparison.percentCo2Savings}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 border-t border-slate-800/60 pt-2 flex items-center justify-between">
            <span>Equiv: {comparison.equivalentTreesPlanted.toLocaleString()} trees</span>
            <span className="text-teal-300 font-semibold">
              Net Zero Acceleration
            </span>
          </div>
        </div>
      </div>

      {/* Levers & Adjustments Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Strategy Levers */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Facility-Wide Efficiency Levers</span>
          </h2>
          <p className="text-xs text-slate-400">
            Apply macro operational policies without modifying physical assets individually.
          </p>

          {/* Lever 1: HVAC Setback */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-850 border border-slate-750">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">HVAC Temperature Setpoint & Fan VFD:</span>
              <span className="font-bold text-cyan-400">-{hvacReductionPct}% Power</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="5"
              value={hvacReductionPct}
              onChange={e => setHvacReductionPct(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500"
            />
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>0% (Baseline)</span>
              <span>10% (1-2°C Setback)</span>
              <span>35% (Aggressive Night Setback + VFD)</span>
            </div>
          </div>

          {/* Lever 2: Smart Lighting */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-850 border border-slate-750">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Daylight Harvesting & LED Retrofit:</span>
              <span className="font-bold text-cyan-400">-{lightingReductionPct}% Power</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={lightingReductionPct}
              onChange={e => setLightingReductionPct(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500"
            />
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>0% (Baseline)</span>
              <span>25% (Sensors)</span>
              <span>60% (High-Efficacy LED)</span>
            </div>
          </div>

          {/* Lever 3: Standby Elimination Toggle */}
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">Zero-Voltage Standby Isolation</div>
              <div className="text-[10px] text-slate-400">
                Automated smart power relays to cut off coffee urns, displays, and vampire loads when vacant
              </div>
            </div>
            <input
              type="checkbox"
              checked={cutStandbyWaste}
              onChange={e => setCutStandbyWaste(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded"
            />
          </div>

          {/* Lever 4: Load Shift Toggle */}
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">TOU Grid Agile Load Shifting</div>
              <div className="text-[10px] text-slate-400">
                Shift dishwasher, thermal tanks, and lab equipment from 14:00 peak to off-peak
              </div>
            </div>
            <input
              type="checkbox"
              checked={shiftShiftableLoads}
              onChange={e => setShiftShiftableLoads(e.target.checked)}
              className="w-5 h-5 accent-cyan-500 rounded"
            />
          </div>
        </div>

        {/* Individual Asset Fine-Tuning */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Asset-Level Duty Cycle Overrides</span>
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Tweak specific equipment operating hours or test replacement power ratings.
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {activeFacility.appliances.slice(0, 5).map(app => {
                const currentOverride = applianceOverrides[app.id] || { powerScale: 1.0, hoursDelta: 0 };
                return (
                  <div key={app.id} className="p-2.5 rounded-xl bg-slate-850 border border-slate-750 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-200">{app.name}</span>
                      <span className="text-slate-400 text-[10px]">
                        Base: {app.ratedWatts}W • {app.operatingHoursPerDay}h/d
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-400">Power Rating: {Math.round(currentOverride.powerScale * 100)}%</span>
                        <input
                          type="range"
                          min="0.3"
                          max="1.5"
                          step="0.05"
                          value={currentOverride.powerScale}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setApplianceOverrides(prev => ({
                              ...prev,
                              [app.id]: { ...currentOverride, powerScale: val },
                            }));
                          }}
                          className="w-full mt-1 accent-purple-400"
                        />
                      </div>

                      <div>
                        <span className="text-slate-400">
                          Hours: {app.operatingHoursPerDay + currentOverride.hoursDelta}h/d
                        </span>
                        <input
                          type="range"
                          min={-app.operatingHoursPerDay}
                          max={24 - app.operatingHoursPerDay}
                          step="1"
                          value={currentOverride.hoursDelta}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            setApplianceOverrides(prev => ({
                              ...prev,
                              [app.id]: { ...currentOverride, hoursDelta: val },
                            }));
                          }}
                          className="w-full mt-1 accent-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Active manual overrides: {Object.keys(applianceOverrides).length}</span>
            <button
              onClick={() => setApplianceOverrides({})}
              className="text-cyan-400 hover:underline"
            >
              Clear asset overrides
            </button>
          </div>
        </div>
      </div>

      {/* Save Scenario Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Save Simulation Scenario</h3>
            <p className="text-xs text-slate-400 mb-4">
              Store this simulated state for long-term tracking, executive reporting, and multi-scenario comparison.
            </p>

            <form onSubmit={handleSaveScenario} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-300 block mb-1">Scenario Name *</label>
                <input
                  type="text"
                  required
                  value={scenarioName}
                  onChange={e => setScenarioName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="font-medium text-slate-300 block mb-1">Description & Assumptions</label>
                <textarea
                  rows={3}
                  value={scenarioDesc}
                  onChange={e => setScenarioDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-850 text-[11px] space-y-1 text-slate-300 border border-slate-750">
                <div className="font-semibold text-emerald-400">Estimated Impact Summary:</div>
                <div>• Saves {comparison.deltaMonthlyKwh.toLocaleString()} kWh/mo ({comparison.percentEnergySavings}%)</div>
                <div>• Saves {activeFacility.currencySymbol}{comparison.deltaMonthlyCost.toLocaleString()}/mo</div>
                <div>• Abates {(comparison.deltaAnnualCo2Kg / 1000).toFixed(1)} MT CO₂e/year</div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
