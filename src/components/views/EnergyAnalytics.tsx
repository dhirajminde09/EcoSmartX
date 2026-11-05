import React, { useState } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import {
  BarChart3,
  Calendar,
  Layers,
  Zap,
  DollarSign,
  TrendingUp,
  Cpu,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { NavigationTab } from '../Sidebar';

interface EnergyAnalyticsProps {
  onNavigate: (tab: NavigationTab) => void;
}

const PALETTE = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export const EnergyAnalytics: React.FC<EnergyAnalyticsProps> = ({ onNavigate }) => {
  const { activeFacility, metrics } = useEnergy();

  const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'annual'>('monthly');

  const facility = metrics.facility;
  const mult = timeframe === 'daily' ? 1 / 30 : timeframe === 'annual' ? 12 : 1;

  // Day-of-week typical profile
  const dayOfWeekData = [
    { day: 'Mon', kwh: Math.round(facility.dailyTotalKwh * 1.05) },
    { day: 'Tue', kwh: Math.round(facility.dailyTotalKwh * 1.08) },
    { day: 'Wed', kwh: Math.round(facility.dailyTotalKwh * 1.06) },
    { day: 'Thu', kwh: Math.round(facility.dailyTotalKwh * 1.07) },
    { day: 'Fri', kwh: Math.round(facility.dailyTotalKwh * 0.98) },
    { day: 'Sat', kwh: Math.round(facility.dailyTotalKwh * 0.42) },
    { day: 'Sun', kwh: Math.round(facility.dailyTotalKwh * 0.38) },
  ];

  // Category chart data
  const categoryData = Object.entries(facility.categoryBreakdown).map(([cat, data], idx) => ({
    name: cat.replace('_', ' ').toUpperCase(),
    kwh: Math.round(data.kwh * mult),
    cost: Math.round(data.cost * mult),
    color: PALETTE[idx % PALETTE.length],
  }));

  // Top 5 highest consuming appliances
  const topAppliances = [...metrics.appliances]
    .sort((a, b) => b.monthlyTotalKwh - a.monthlyTotalKwh)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Deep Consumption Drilldowns</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Energy Analytics & Profiling
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            End-use disaggregation, load profiles, and asset ranking for {activeFacility.name}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-850 p-1 rounded-xl border border-slate-700">
          {(['daily', 'monthly', 'annual'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                timeframe === tf
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Diurnal Profile */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h2 className="text-sm font-bold text-white mb-1">Weekly Daily Average Distribution</h2>
          <p className="text-xs text-slate-400 mb-4">
            Weekday operational baselines vs. weekend setbacks
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" kWh" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xs">
                          <div className="font-bold text-white">{d.day}</div>
                          <div className="text-cyan-400 font-semibold">{d.kwh} kWh/day</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="kwh" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">
              End-Use Category Breakdown ({timeframe})
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Disaggregated by HVAC, computing, lighting, and process machinery
            </p>

            <div className="space-y-3">
              {categoryData.map(c => {
                const total = categoryData.reduce((s, x) => s + x.kwh, 0);
                const pct = total > 0 ? Math.round((c.kwh / total) * 100) : 0;
                return (
                  <div key={c.name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-200">
                      <span className="font-medium flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                        <span>{c.name}</span>
                      </span>
                      <span className="font-bold">
                        {c.kwh.toLocaleString()} kWh ({pct}%) • {activeFacility.currencySymbol}
                        {c.cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: c.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Consuming Assets Ranking */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Top 5 Primary Energy Consuming Assets</h2>
            <p className="text-xs text-slate-400">Largest single-point consumers in {activeFacility.name}</p>
          </div>
          <button
            onClick={() => onNavigate('appliances')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
          >
            <span>View All Equipment</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-2.5">Asset Name</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5 text-right">Rated Load</th>
                <th className="p-2.5 text-right">Monthly Energy</th>
                <th className="p-2.5 text-right">Monthly Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topAppliances.map(app => {
                const a = activeFacility.appliances.find(x => x.id === app.applianceId);
                return (
                  <tr key={app.applianceId} className="hover:bg-slate-850/40">
                    <td className="p-2.5 font-semibold text-white">{app.name}</td>
                    <td className="p-2.5 text-slate-400 uppercase text-[10px]">{app.category}</td>
                    <td className="p-2.5 text-right text-slate-200">
                      {a ? a.ratedWatts * a.quantity : 0} W
                    </td>
                    <td className="p-2.5 text-right font-bold text-cyan-400">
                      {Math.round(app.monthlyTotalKwh).toLocaleString()} kWh
                    </td>
                    <td className="p-2.5 text-right font-bold text-emerald-400">
                      {activeFacility.currencySymbol}
                      {app.monthlyCost.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
