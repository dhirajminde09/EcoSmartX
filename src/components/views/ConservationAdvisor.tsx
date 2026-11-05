import React, { useState, useEffect } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import {
  Lightbulb,
  CheckCircle2,
  DollarSign,
  Zap,
  Leaf,
  Clock,
  RefreshCw,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { getIdToken } from '../../services/firebase';
import { NavigationTab } from '../Sidebar';

interface ConservationAdvisorProps {
  onNavigate: (tab: NavigationTab) => void;
}

interface Recommendation {
  id: string;
  title: string;
  category: string;
  effort: 'Low' | 'Medium' | 'High';
  capitalCost: number;
  estimatedMonthlyKwhSavings: number;
  estimatedMonthlyCostSavings: number;
  co2ReductionKgAnnual: number;
  paybackMonths: number;
  confidence: 'High' | 'Medium';
  actionPlan: string;
  adopted?: boolean;
}

export const ConservationAdvisor: React.FC<ConservationAdvisorProps> = ({ onNavigate }) => {
  const { activeFacility, metrics, showNotification } = useEnergy();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: 'rec-1',
      title: 'Occupancy-Coupled HVAC Setback Schedule',
      category: 'HVAC',
      effort: 'Low',
      capitalCost: 0,
      estimatedMonthlyKwhSavings: Math.round(metrics.facility.monthlyTotalKwh * 0.08),
      estimatedMonthlyCostSavings: Math.round(metrics.facility.monthlyCost * 0.08),
      co2ReductionKgAnnual: Math.round(metrics.facility.monthlyTotalKwh * 0.08 * 12 * activeFacility.emissionFactorKgCo2PerKwh),
      paybackMonths: 0,
      confidence: 'High',
      actionPlan: 'Program BMS or smart thermostats to increase cooling setpoint by 2.5°C during unoccupied evening and weekend hours.',
    },
    {
      id: 'rec-2',
      title: 'Zero-Voltage Plug Load Automation Relays',
      category: 'Plug Load',
      effort: 'Medium',
      capitalCost: 280,
      estimatedMonthlyKwhSavings: Math.round(metrics.facility.standbyWasteMonthlyKwh * 0.85),
      estimatedMonthlyCostSavings: Math.round(metrics.facility.standbyWasteMonthlyCost * 0.85),
      co2ReductionKgAnnual: Math.round(metrics.facility.standbyWasteMonthlyKwh * 0.85 * 12 * activeFacility.emissionFactorKgCo2PerKwh),
      paybackMonths: 3.5,
      confidence: 'High',
      actionPlan: 'Install smart timer cutoff strips on breakroom water urns, test benches, and monitor arrays to isolate phantom parasitic drain.',
    },
    {
      id: 'rec-3',
      title: 'Discretionary Shift to Super Off-Peak Grid Hours',
      category: 'Operations',
      effort: 'Low',
      capitalCost: 0,
      estimatedMonthlyKwhSavings: 0, // kWh constant, rate decreases
      estimatedMonthlyCostSavings: Math.round(metrics.facility.monthlyCost * 0.11),
      co2ReductionKgAnnual: 240,
      paybackMonths: 0,
      confidence: 'High',
      actionPlan: 'Reschedule high-power batch processes (commercial dishwashers, forklift chargers, test runs) away from peak 13:00–19:00 window.',
    },
    {
      id: 'rec-4',
      title: 'Premium LED Conversion with Continuous Dimming',
      category: 'Lighting',
      effort: 'High',
      capitalCost: 2400,
      estimatedMonthlyKwhSavings: Math.round(metrics.facility.monthlyTotalKwh * 0.12),
      estimatedMonthlyCostSavings: Math.round(metrics.facility.monthlyCost * 0.12),
      co2ReductionKgAnnual: Math.round(metrics.facility.monthlyTotalKwh * 0.12 * 12 * activeFacility.emissionFactorKgCo2PerKwh),
      paybackMonths: 14,
      confidence: 'High',
      actionPlan: 'Replace remaining fluorescent troffers with 140 lm/W smart fixtures equipped with integrated daylight harvesting photodiode sensors.',
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [effortFilter, setEffortFilter] = useState<'all' | 'Low' | 'Medium' | 'High'>('all');

  const fetchAIRecommendations = async () => {
    setIsLoading(true);
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          facilityId: activeFacility.id,
          facilityContext: {
            id: activeFacility.id,
            name: activeFacility.name,
            type: activeFacility.type,
            floorAreaSqM: activeFacility.floorAreaSqM,
            occupancy: activeFacility.occupancy,
            monthlyTotalKwh: metrics.facility.monthlyTotalKwh,
            monthlyCost: metrics.facility.monthlyCost,
            standbyWasteMonthlyKwh: metrics.facility.standbyWasteMonthlyKwh,
            standbyWasteMonthlyCost: metrics.facility.standbyWasteMonthlyCost,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to query advisor');
      const data = await res.json();
      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        showNotification('Refreshed conservation roadmap with Gemini AI', 'success');
      }
    } catch (e) {
      console.error(e);
      showNotification('Used deterministic audit engine recommendations', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdopt = (id: string) => {
    setRecommendations(prev =>
      prev.map(r => (r.id === id ? { ...r, adopted: !r.adopted } : r))
    );
    showNotification('Conservation action status updated', 'success');
  };

  const filtered = recommendations.filter(
    r => effortFilter === 'all' || r.effort === effortFilter
  );

  const totalPotentialSavings = recommendations.reduce(
    (sum, r) => sum + r.estimatedMonthlyCostSavings,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Lightbulb className="w-4 h-4" />
            <span>ROI-Prioritized Interventions</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            AI Conservation Advisor
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical efficiency recommendations grounded in {activeFacility.name} equipment inventory
          </p>
        </div>

        <button
          onClick={fetchAIRecommendations}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh AI Analysis</span>
        </button>
      </div>

      {/* Aggregate Savings Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
            Combined Efficiency Potential
          </span>
          <div className="text-xl font-bold text-white mt-0.5">
            Save up to {activeFacility.currencySymbol}
            {totalPotentialSavings.toLocaleString()}/month (~{activeFacility.currencySymbol}
            {(totalPotentialSavings * 12).toLocaleString()}/year)
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Across {recommendations.length} identified measures with average payback under 5 months.
          </p>
        </div>

        <button
          onClick={() => onNavigate('simulation')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Test in Simulation Lab</span>
        </button>
      </div>

      {/* Effort Filter Chips */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Filter by Implementation Effort:</span>
        {(['all', 'Low', 'Medium', 'High'] as const).map(eff => (
          <button
            key={eff}
            onClick={() => setEffortFilter(eff)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              effortFilter === eff
                ? 'bg-slate-750 text-white border border-slate-600 font-semibold'
                : 'bg-slate-850 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {eff === 'all' ? 'All Efforts' : `${eff} Effort`}
          </button>
        ))}
      </div>

      {/* Recommendations Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(rec => (
          <div
            key={rec.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              rec.adopted
                ? 'bg-emerald-950/20 border-emerald-800/50 shadow-md'
                : 'bg-slate-900/80 border-slate-800 shadow-md hover:border-slate-750'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {rec.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      rec.effort === 'Low'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : rec.effort === 'Medium'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-purple-950 text-purple-300 border-purple-800'
                    }`}
                  >
                    {rec.effort} Effort
                  </span>
                </div>

                <span className="text-[10px] text-cyan-400 font-semibold">
                  {rec.confidence} Confidence
                </span>
              </div>

              <h3 className="text-base font-bold text-white mt-2.5">{rec.title}</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{rec.actionPlan}</p>

              {/* Impact Breakdown Cards */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-750">
                  <span className="text-[10px] text-slate-400">Monthly Savings</span>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    +{activeFacility.currencySymbol}
                    {rec.estimatedMonthlyCostSavings}/mo
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {rec.estimatedMonthlyKwhSavings.toLocaleString()} kWh
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-750">
                  <span className="text-[10px] text-slate-400">Capital Cost</span>
                  <div className="font-bold text-white mt-0.5">
                    {rec.capitalCost === 0 ? 'Zero ($0)' : `${activeFacility.currencySymbol}${rec.capitalCost}`}
                  </div>
                  <div className="text-[9px] text-cyan-300">
                    {rec.paybackMonths === 0 ? 'Immediate' : `${rec.paybackMonths} mo payback`}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-750">
                  <span className="text-[10px] text-slate-400">CO₂ Abated</span>
                  <div className="font-bold text-teal-300 mt-0.5">
                    {(rec.co2ReductionKgAnnual / 1000).toFixed(1)} MT
                  </div>
                  <div className="text-[9px] text-slate-400">Annual Scope 2</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => onNavigate('simulation')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <span>Simulate in Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => toggleAdopt(rec.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  rec.adopted
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{rec.adopted ? 'Adopted into Plan' : 'Mark as Adopted'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
        <strong>Disclosed Assumptions:</strong> Calculations assume baseline tariff rates and uncurtailed production hours. Actual savings will vary with weather fluctuations, occupancy variations, and utility tariff rate revisions.
      </div>
    </div>
  );
};
