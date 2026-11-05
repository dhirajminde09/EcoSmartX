import React, { useState } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import { compareScenarios, calculateFacilityMetrics } from '../../utils/energyEngine';
import {
  FlaskConical,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  Eye,
  Sliders,
  DollarSign,
  Zap,
  Leaf,
  Calendar,
} from 'lucide-react';
import { NavigationTab } from '../Sidebar';

interface ScenarioLaboratoryProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const ScenarioLaboratory: React.FC<ScenarioLaboratoryProps> = ({ onNavigate }) => {
  const {
    activeFacility,
    scenarios,
    activeScenarioId,
    setActiveScenarioId,
    createScenario,
    deleteScenario,
    metrics,
  } = useEnergy();

  const [selectedScenarioForComparison, setSelectedScenarioForComparison] = useState<string | null>(
    scenarios[0]?.id || null
  );

  const baselineMetrics = metrics.facility;

  const handleDuplicate = (scen: any) => {
    createScenario(
      `${scen.name} (Copy)`,
      `Duplicated from ${scen.name} on ${new Date().toLocaleDateString()}`,
      scen.modifiedFacility
    );
  };

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioForComparison);
  const diff = selectedScenario
    ? compareScenarios(activeFacility, selectedScenario.modifiedFacility)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <FlaskConical className="w-4 h-4" />
            <span>Multi-Scenario Portfolio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Scenario Laboratory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Store, compare, and stress-test strategic decarbonization and energy-efficiency roadmaps
          </p>
        </div>

        <button
          onClick={() => onNavigate('simulation')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Simulation</span>
        </button>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Baseline Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            activeScenarioId === null
              ? 'bg-slate-900/90 border-emerald-500/50 shadow-emerald-500/10 shadow-lg'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Operational Baseline
            </span>
            {activeScenarioId === null && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Active View
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-white mt-2">Live Baseline Configuration</h3>
          <p className="text-xs text-slate-400 mt-1">
            Current operational duty cycles and verified ratings for {activeFacility.name}.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-750">
              <div className="text-[10px] text-slate-400">Monthly Cost</div>
              <div className="font-bold text-white mt-0.5">
                {activeFacility.currencySymbol}
                {baselineMetrics.monthlyCost.toFixed(2)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-750">
              <div className="text-[10px] text-slate-400">Monthly Energy</div>
              <div className="font-bold text-cyan-300 mt-0.5">
                {baselineMetrics.monthlyTotalKwh.toLocaleString()} kWh
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveScenarioId(null)}
            className="w-full mt-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Select Baseline
          </button>
        </div>

        {/* User-created Scenario Cards */}
        {scenarios.map(scen => {
          const isActive = activeScenarioId === scen.id;
          const scenMetrics = calculateFacilityMetrics(scen.modifiedFacility).facility;
          const deltaCost = baselineMetrics.monthlyCost - scenMetrics.monthlyCost;
          const isComparing = selectedScenarioForComparison === scen.id;

          return (
            <div
              key={scen.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900/90 border-cyan-500/50 shadow-cyan-500/10 shadow-lg'
                  : isComparing
                  ? 'bg-slate-900/80 border-slate-700 shadow-md'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                    Scenario Model
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(scen)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Duplicate Scenario"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteScenario(scen.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                      title="Delete Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mt-2">{scen.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{scen.description}</p>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-750">
                    <div className="text-[10px] text-slate-400">Monthly Cost</div>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      {activeFacility.currencySymbol}
                      {scenMetrics.monthlyCost.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-emerald-300">
                      Save {activeFacility.currencySymbol}{Math.max(0, deltaCost).toFixed(0)}/mo
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-750">
                    <div className="text-[10px] text-slate-400">Monthly Energy</div>
                    <div className="font-bold text-cyan-300 mt-0.5">
                      {scenMetrics.monthlyTotalKwh.toLocaleString()} kWh
                    </div>
                    <div className="text-[9px] text-cyan-400">
                      -{Math.round(((baselineMetrics.monthlyTotalKwh - scenMetrics.monthlyTotalKwh) / (baselineMetrics.monthlyTotalKwh || 1)) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => setSelectedScenarioForComparison(scen.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isComparing
                      ? 'bg-slate-800 text-white border-slate-600 font-semibold'
                      : 'text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Inspect Diff
                </button>
                <button
                  onClick={() => setActiveScenarioId(isActive ? null : scen.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-cyan-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isActive ? 'Active in App' : 'Set as Active'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Detailed Difference Inspector */}
      {selectedScenario && diff && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Comparative Impact Audit
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Baseline vs. &quot;{selectedScenario.name}&quot;
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Created: {new Date(selectedScenario.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-750">
              <span className="text-slate-400 text-[10px]">Monthly Energy Delta</span>
              <div className="text-base font-bold text-cyan-400 mt-1">
                -{diff.deltaMonthlyKwh.toLocaleString()} kWh
              </div>
              <div className="text-[10px] text-cyan-300 mt-0.5 font-medium">
                {diff.percentEnergySavings}% overall reduction
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-850 border border-slate-750">
              <span className="text-slate-400 text-[10px]">Monthly Cost Delta</span>
              <div className="text-base font-bold text-emerald-400 mt-1">
                -{activeFacility.currencySymbol}
                {diff.deltaMonthlyCost.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-300 mt-0.5 font-medium">
                {diff.percentCostSavings}% cost savings
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-850 border border-slate-750">
              <span className="text-slate-400 text-[10px]">Annualized Savings</span>
              <div className="text-base font-bold text-white mt-1">
                {activeFacility.currencySymbol}
                {diff.annualCostSavings.toLocaleString()}/yr
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Recurring OPEX reduction</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-850 border border-slate-750">
              <span className="text-slate-400 text-[10px]">Annual Carbon Abated</span>
              <div className="text-base font-bold text-teal-400 mt-1">
                {(diff.deltaAnnualCo2Kg / 1000).toFixed(1)} MT CO₂e
              </div>
              <div className="text-[10px] text-teal-300 mt-0.5">
                ~{diff.equivalentTreesPlanted.toLocaleString()} trees planted
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
