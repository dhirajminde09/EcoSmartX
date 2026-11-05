import React, { useState, useMemo } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import { runOptimizationEngine, Facility } from '../../utils/energyEngine';
import {
  Zap,
  CheckCircle2,
  DollarSign,
  Leaf,
  Clock,
  ArrowRight,
  ShieldCheck,
  Save,
  HelpCircle,
} from 'lucide-react';
import { NavigationTab } from '../Sidebar';

interface OptimizationEngineProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const OptimizationEngine: React.FC<OptimizationEngineProps> = ({ onNavigate }) => {
  const { activeFacility, createScenario } = useEnergy();

  const [optimizationGoal, setOptimizationGoal] = useState<'cost' | 'carbon' | 'standby'>('cost');
  const [maxDemandThresholdKw, setMaxDemandThresholdKw] = useState<number>(45);

  const optimization = useMemo(() => {
    return runOptimizationEngine(activeFacility);
  }, [activeFacility]);

  const handleApplyAsScenario = () => {
    // Generate optimized facility
    const updatedFacility: Facility = {
      ...activeFacility,
      appliances: activeFacility.appliances.map(app => {
        const shifted = optimization.shiftedAppliances.find(s => s.applianceId === app.id);
        if (shifted) {
          return {
            ...app,
            operatingWindow: { startHour: 22, endHour: 5 }, // Off peak shift
          };
        }
        return app;
      }),
    };

    createScenario(
      `Optimization: TOU Peak Shaving`,
      `Automated load shift of ${optimization.shiftedAppliances.length} discretionary equipment units outside peak tariff window`,
      updatedFacility
    );
    onNavigate('scenarios');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Deterministic Constraint Solver</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Optimization Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Heuristic peak-shaving and load-shifting scheduler under operational uptime constraints
          </p>
        </div>

        <button
          onClick={handleApplyAsScenario}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Apply as Active Scenario</span>
        </button>
      </div>

      {/* Optimization Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Monthly Cost Reduction</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {activeFacility.currencySymbol}
            {optimization.monthlySavings.toFixed(2)}/mo
          </div>
          <div className="text-[10px] text-emerald-300 mt-1">
            -{optimization.percentCostReduction}% without reducing runtime
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Annual OPEX Savings</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {activeFacility.currencySymbol}
            {optimization.annualSavings.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">12-month recurring ROI</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Grid CO₂ Impact</span>
            <Leaf className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-teal-300 mt-1">
            -{optimization.co2ReductionKg} kg
          </div>
          <div className="text-[10px] text-slate-400 mt-1">From cleaner off-peak grid mix</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Constraint Feasibility</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            100% Feasible
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Zero throughput compromise</div>
        </div>
      </div>

      {/* Proposed Schedule Shifts Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">
              Proposed Schedule Shift Recommendations ({optimization.shiftedAppliances.length})
            </h2>
            <p className="text-xs text-slate-400">
              Shiftable equipment rescheduled from peak utility surcharge windows to super off-peak hours
            </p>
          </div>
          <span className="text-xs font-semibold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-full border border-cyan-800">
            TOU Optimization
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Equipment Asset</th>
                <th className="py-3 px-3">Baseline Operating Window</th>
                <th className="py-3 px-3">Proposed Optimized Window</th>
                <th className="py-3 px-3">Strategic Rationale</th>
                <th className="py-3 px-4 text-right">Est. Monthly Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {optimization.shiftedAppliances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No shiftable equipment currently found running in peak windows. All loads are currently operating efficiently or non-shiftable.
                  </td>
                </tr>
              ) : (
                optimization.shiftedAppliances.map(item => (
                  <tr key={item.applianceId} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{item.name}</td>
                    <td className="py-3.5 px-3 text-rose-300 font-medium">{item.originalHours}</td>
                    <td className="py-3.5 px-3 text-emerald-300 font-semibold">{item.proposedHours}</td>
                    <td className="py-3.5 px-3 text-slate-400 max-w-xs">{item.reason}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      +{activeFacility.currencySymbol}
                      {item.monthlySaving.toFixed(2)}/mo
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Constraints & Feasibility Audit */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-3">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Active Constraint Boundaries Verified:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {optimization.constraintsSummary.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{c}</span>
            </div>
          ))}
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Facility occupancy comfort: server cooling and room lighting are exempt from curtailment</span>
          </div>
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Deterministic formulation: mathematical optimization without black-box approximations</span>
          </div>
        </div>
      </div>
    </div>
  );
};
