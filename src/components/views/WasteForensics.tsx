import React, { useState } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import { AnomalyFinding } from '../../utils/energyEngine';
import {
  AlertOctagon,
  AlertTriangle,
  Flame,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { NavigationTab } from '../Sidebar';

interface WasteForensicsProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const WasteForensics: React.FC<WasteForensicsProps> = ({ onNavigate }) => {
  const { anomalies, updateAnomalyStatus, activeFacility } = useEnergy();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'investigating' | 'resolved' | 'dismissed'>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filtered = anomalies.filter(a => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const totalMonthlyWaste = anomalies
    .filter(a => a.status === 'active' || a.status === 'investigating')
    .reduce((sum, a) => sum + a.estimatedMonthlyWasteCost, 0);

  const getSeverityBadge = (sev: AnomalyFinding['severity']) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'high':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'medium':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Root-Cause Diagnostic Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Energy Waste Forensics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated detection of phantom standby draw, schedule drift, and peak-window surcharge risks
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs">
          <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] text-amber-300/80">Identified Monthly Waste:</div>
            <div className="font-bold text-amber-200 text-sm">
              {activeFacility.currencySymbol}
              {totalMonthlyWaste.toFixed(2)}/mo
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Status Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-1 bg-slate-850 p-1 rounded-lg border border-slate-750">
          {(['active', 'investigating', 'resolved', 'dismissed', 'all'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-slate-750 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st} {st !== 'all' && `(${anomalies.filter(a => a.status === st).length})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 text-xs"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">No {statusFilter} Anomalies Found</h3>
            <p className="text-xs mt-1">All monitored equipment operating within normal baseline limits.</p>
          </div>
        ) : (
          filtered.map(finding => (
            <div
              key={finding.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4 hover:border-slate-750 transition-colors"
            >
              {/* Finding Title & Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(
                      finding.severity
                    )}`}
                  >
                    {finding.severity}
                  </span>
                  <h3 className="text-sm font-bold text-white">{finding.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-amber-300">
                    Est. Waste: {activeFacility.currencySymbol}
                    {finding.estimatedMonthlyWasteCost}/mo
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs font-medium uppercase text-slate-400">
                    Status: <strong className="text-slate-200">{finding.status}</strong>
                  </span>
                </div>
              </div>

              {/* Observed vs Baseline Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-850/60 p-3 rounded-xl border border-slate-750">
                <div>
                  <div className="text-[10px] text-slate-400">Observed Value:</div>
                  <div className="font-semibold text-rose-300 mt-0.5">{finding.observedValue}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Baseline Target:</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{finding.baselineExpected}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Variance Deviation:</div>
                  <div className="font-semibold text-amber-300 mt-0.5">{finding.deviation}</div>
                </div>
              </div>

              {/* Forensic Evidence & Causes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-semibold text-slate-300 mb-1">Diagnostic Evidence:</div>
                  <p className="text-slate-400 leading-relaxed">{finding.evidence}</p>
                </div>

                <div>
                  <div className="font-semibold text-slate-300 mb-1">Plausible Root Causes:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                    {finding.rootCauses.map((cause, i) => (
                      <li key={i}>{cause}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-slate-200">Recommended Action: </span>
                  <span className="text-slate-300">{finding.recommendedAction}</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                {finding.status === 'active' && (
                  <button
                    onClick={() => updateAnomalyStatus(finding.id, 'investigating')}
                    className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-xs font-medium border border-blue-600/40"
                  >
                    Mark Investigating
                  </button>
                )}

                {finding.status !== 'resolved' && (
                  <button
                    onClick={() => updateAnomalyStatus(finding.id, 'resolved')}
                    className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold border border-emerald-600/40"
                  >
                    Mark Resolved
                  </button>
                )}

                {finding.status !== 'dismissed' && (
                  <button
                    onClick={() => updateAnomalyStatus(finding.id, 'dismissed')}
                    className="px-3 py-1 rounded-lg text-slate-400 hover:text-slate-200 text-xs"
                  >
                    Dismiss Finding
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
