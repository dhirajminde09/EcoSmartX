import React from 'react';
import { useEnergy } from '../../context/EnergyContext';
import {
  Leaf,
  Globe2,
  TreePine,
  Car,
  Home,
  TrendingDown,
  Info,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const CarbonIntelligence: React.FC = () => {
  const { activeFacility, metrics } = useEnergy();

  const annualCo2Kg = metrics.facility.annualCo2Kg;
  const annualCo2Tonnes = metrics.facility.annualCo2Tonnes;
  const monthlyCo2Kg = metrics.facility.monthlyCo2Kg;

  // Real world equivalencies (EPA Greenhouse Gas Equivalencies standards)
  const treesPlanted = Math.round(annualCo2Kg / 21.77); // 1 urban tree seedling grown 10 yrs absorbs ~21.77 kg CO2
  const gasGallons = Math.round(annualCo2Kg / 8.887);  // 1 gallon gasoline = 8.887 kg CO2
  const passengerMiles = Math.round(annualCo2Kg / 0.404); // 404 grams CO2/mile

  // Grid subregions comparison
  const gridBenchmarks = [
    { name: 'Your Facility', factor: activeFacility.emissionFactorKgCo2PerKwh, region: activeFacility.location, current: true },
    { name: 'CAISO (California)', factor: 0.22, region: 'High Solar/Wind Penetration' },
    { name: 'ISO-NE (New England)', factor: 0.28, region: 'Nuclear & Hydro Balanced' },
    { name: 'ERCOT (Texas)', factor: 0.38, region: 'Wind + Gas CCGT Mix' },
    { name: 'PJM (Mid-Atlantic/Midwest)', factor: 0.44, region: 'Coal/Gas/Nuclear Blend' },
    { name: 'MISO (Upper Midwest)', factor: 0.52, region: 'Elevated Thermal Grid' },
  ];

  // Room emissions data
  const roomEmissionsData = metrics.rooms.map(r => ({
    name: r.name,
    co2Kg: r.monthlyCo2Kg,
  })).sort((a, b) => b.co2Kg - a.co2Kg);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Leaf className="w-4 h-4" />
            <span>GHG Protocol Scope 2 Emissions</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Carbon Intelligence & Decarbonization
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified greenhouse gas emissions accounting and grid subregion provenance for {activeFacility.name}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/60 text-xs">
          <span className="text-teal-400">Emission Factor:</span>
          <span className="ml-1.5 font-bold text-white">
            {activeFacility.emissionFactorKgCo2PerKwh} kg CO₂e / kWh
          </span>
        </div>
      </div>

      {/* Main KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Annual Gross Emissions</span>
            <Globe2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-300 mt-1">
            {annualCo2Tonnes} <span className="text-xs font-normal text-slate-400">MT CO₂e/yr</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {Math.round(monthlyCo2Kg).toLocaleString()} kg CO₂e / month
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Carbon Intensity</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">
            {(annualCo2Kg / (activeFacility.floorAreaSqM || 1)).toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-400">kg/m²/yr</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Operational emissions per floor area
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Offset Forestry Equiv.</span>
            <TreePine className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {treesPlanted.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Tree seedlings grown for 10 years
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Gasoline Equivalent</span>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-1">
            {gasGallons.toLocaleString()} <span className="text-xs font-normal text-slate-400">gal</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            ~{passengerMiles.toLocaleString()} vehicle miles
          </div>
        </div>
      </div>

      {/* Grid Subregion Comparison Table & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subregion Factors */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h2 className="text-sm font-bold text-white mb-1">
            Regional Grid Subregion Carbon Factors (EPA eGRID)
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            How clean energy grid mixes affect your Scope 2 location-based footprint
          </p>

          <div className="space-y-2 text-xs">
            {gridBenchmarks.map((b, i) => {
              const diffPct = Math.round(
                ((b.factor - activeFacility.emissionFactorKgCo2PerKwh) /
                  activeFacility.emissionFactorKgCo2PerKwh) *
                  100
              );
              return (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    b.current
                      ? 'bg-teal-950/40 border-teal-500/50 shadow-sm'
                      : 'bg-slate-850/60 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>{b.name}</span>
                      {b.current && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{b.region}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-teal-400">{b.factor} kg/kWh</div>
                    {!b.current && (
                      <div
                        className={`text-[10px] font-medium ${
                          diffPct < 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`} vs. Facility
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Level Emissions Ranking Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col">
          <h2 className="text-sm font-bold text-white mb-1">Zone Monthly Carbon Contribution</h2>
          <p className="text-xs text-slate-400 mb-4">
            Emissions breakdown by zone based on equipment assignments
          </p>

          <div className="h-60 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomEmissionsData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={10} unit=" kg" />
                <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={10} width={110} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xs">
                          <div className="font-bold text-white">{d.name}</div>
                          <div className="text-teal-400 mt-1">{Math.round(d.co2Kg)} kg CO₂e / mo</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="co2Kg" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
