import React from 'react';
import { useEnergy } from '../../context/EnergyContext';
import {
  Zap,
  DollarSign,
  Leaf,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  Flame,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { NavigationTab } from '../Sidebar';

interface CommandCenterProps {
  onNavigate: (tab: NavigationTab) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  hvac: '#0ea5e9',
  it_compute: '#8b5cf6',
  lighting: '#eab308',
  machinery: '#f97316',
  refrigeration: '#06b6d4',
  plug_load: '#ec4899',
};

export const CommandCenter: React.FC<CommandCenterProps> = ({ onNavigate }) => {
  const { activeFacility, metrics, anomalies } = useEnergy();

  const activeAnomalies = anomalies.filter(a => a.status === 'active');
  const facilityMetrics = metrics.facility;

  // 24-Hour hourly demand profile simulation
  const hourlyData = Array.from({ length: 24 }).map((_, hour) => {
    // Aggregate appliances active during this hour
    let totalKw = 0;
    activeFacility.appliances.forEach(app => {
      const start = app.operatingWindow?.startHour ?? 8;
      const end = app.operatingWindow?.endHour ?? 18;
      const isRunning =
        end >= start ? hour >= start && hour < end : hour >= start || hour < end;

      if (isRunning) {
        totalKw += (app.ratedWatts * app.quantity * app.utilizationFactor) / 1000;
      } else {
        totalKw += ((app.standbyWatts || 0) * app.quantity) / 1000;
      }
    });

    // Add baseline HVAC/server diversity
    const isPeakHour = hour >= 13 && hour < 19;
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      demandKw: Math.round(totalKw * 10) / 10,
      isPeakHour,
    };
  });

  // Category chart data
  const categoryData = Object.entries(facilityMetrics.categoryBreakdown).map(
    ([category, data]) => ({
      name: category.replace('_', ' ').toUpperCase(),
      kwh: data.kwh,
      cost: data.cost,
      percentage: data.percentage,
      color: CATEGORY_COLORS[category] || '#64748b',
    })
  );

  // Top 5 rooms by intensity
  const roomData = [...metrics.rooms]
    .sort((a, b) => b.wattDensityPerSqM - a.wattDensityPerSqM)
    .slice(0, 5)
    .map(r => ({
      name: r.name,
      wattDensity: r.wattDensityPerSqM,
      monthlyKwh: r.monthlyTotalKwh,
    }));

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-emerald-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Real-time Operational Command</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            {activeFacility.name}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeFacility.location} • {activeFacility.floorAreaSqM.toLocaleString()} m² •{' '}
            {activeFacility.occupancy} Occupants • {activeFacility.rooms.length} Zones •{' '}
            {activeFacility.appliances.length} Monitored Equipment Units
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('copilot')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Consult Gemini Copilot</span>
          </button>
          <button
            onClick={() => onNavigate('simulation')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <span>Simulate Savings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Critical Anomaly Flash Banner */}
      {activeAnomalies.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-semibold text-amber-200">
                {activeAnomalies.length} Energy Waste Anomaly Detected
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Top finding: <strong className="text-white">{activeAnomalies[0].title}</strong> —{' '}
                {activeAnomalies[0].deviation}. Estimated waste:{' '}
                <span className="text-amber-200 font-bold">
                  {activeFacility.currencySymbol}
                  {activeAnomalies[0].estimatedMonthlyWasteCost}/mo
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('waste_forensics')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/30 transition-colors"
          >
            <span>Investigate Anomaly</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Energy */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Monthly Consumption</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">
              {facilityMetrics.monthlyTotalKwh.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-cyan-400">kWh/mo</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
            <span>Avg {facilityMetrics.dailyTotalKwh.toLocaleString()} kWh/day</span>
            <span className="text-slate-300 font-medium">
              {facilityMetrics.annualTotalKwh.toLocaleString()} kWh/yr
            </span>
          </div>
        </div>

        {/* Metric 2: Monthly Cost */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Monthly Power Bill</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">
              {activeFacility.currencySymbol}
              {facilityMetrics.monthlyCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
            <span>Annualized Project</span>
            <span className="text-emerald-400 font-semibold">
              {activeFacility.currencySymbol}
              {facilityMetrics.annualCost.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
              /yr
            </span>
          </div>
        </div>

        {/* Metric 3: Carbon Footprint */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Carbon Emissions</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">
              {facilityMetrics.annualCo2Tonnes}
            </span>
            <span className="text-xs font-semibold text-teal-400">MT CO₂e/yr</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
            <span>Factor: {activeFacility.emissionFactorKgCo2PerKwh} kg/kWh</span>
            <span className="text-teal-300 font-medium">
              ~{Math.round(facilityMetrics.annualCo2Kg / 21.77)} trees
            </span>
          </div>
        </div>

        {/* Metric 4: Peak Demand & Vampire Standby */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Estimated Peak Demand</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">
              {facilityMetrics.estimatedPeakDemandKw}
            </span>
            <span className="text-xs font-semibold text-amber-400">kW</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
            <span className="text-rose-400 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Standby Waste:
            </span>
            <span className="text-rose-300 font-semibold">
              {activeFacility.currencySymbol}
              {facilityMetrics.standbyWasteMonthlyCost.toLocaleString()}/mo
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly 24-hr Demand Curve */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>24-Hour Diurnal Power Profile (kW)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated hourly load based on operating windows, rated watts, and standby power
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500 inline-block"></span>
                <span>Off-Peak</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500 inline-block"></span>
                <span>Peak TOU (13:00 - 19:00)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" kW" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-xs">
                          <div className="font-bold text-slate-200">{data.hour}</div>
                          <div className="text-emerald-400 font-semibold mt-1">
                            Demand: {data.demandKw} kW
                          </div>
                          {data.isPeakHour && (
                            <div className="text-[10px] text-amber-400 font-medium mt-0.5">
                              ⚠️ Peak TOU Tariff Window
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="demandKw"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#demandGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-md flex flex-col">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Energy by Category</span>
          </h2>
          <p className="text-xs text-slate-400 mb-3">Share of monthly consumption</p>

          <div className="h-48 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="kwh"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs">
                          <div className="font-bold text-slate-200">{d.name}</div>
                          <div className="text-cyan-400">{d.kwh.toLocaleString()} kWh/mo ({d.percentage}%)</div>
                          <div className="text-emerald-400 font-medium">
                            {activeFacility.currencySymbol}
                            {d.cost.toLocaleString()}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px]">
            {categoryData.map(c => (
              <div key={c.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-slate-300 truncate">{c.name}</span>
                <span className="text-slate-400 ml-auto font-medium">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Top Room Power Densities & Quick Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Density Rankings */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-purple-400" />
                <span>Room Power Density Intensity (W/m²)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Connected load density across facility zones (target &lt; 35 W/m² for offices)
              </p>
            </div>
            <button
              onClick={() => onNavigate('digital_twin')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>View in Digital Twin</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={10} unit=" W/m²" />
                <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={10} width={120} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xs">
                          <div className="font-bold text-white">{d.name}</div>
                          <div className="text-purple-400">Connected: {d.wattDensity} W/m²</div>
                          <div className="text-slate-300">Monthly: {d.monthlyKwh} kWh</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="wattDensity" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Conservation Actions */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Recommended Next Actions</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">
              Fastest pathways to reduce cost and carbon
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('optimization')}
                className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-emerald-300">Run TOU Load Shift Optimizer</div>
                  <div className="text-[10px] text-slate-400">Shift dishwasher & lab ovens outside peak window</div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
              </button>

              <button
                onClick={() => onNavigate('simulation')}
                className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-cyan-300">LED & VFD Retrofit Simulator</div>
                  <div className="text-[10px] text-slate-400">Test wattage reductions & payback periods</div>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
              </button>

              <button
                onClick={() => onNavigate('copilot')}
                className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-indigo-300">Ask Gemini Energy Copilot</div>
                  <div className="text-[10px] text-slate-400">Grounded audit recommendations for {activeFacility.name}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Grid Tariff: {activeFacility.tariff.name}</span>
            <button
              onClick={() => onNavigate('tariffs')}
              className="text-emerald-400 hover:underline font-medium"
            >
              Edit Rates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
