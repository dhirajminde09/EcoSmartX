import React, { useState } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import { TariffRate } from '../../utils/energyEngine';
import {
  Receipt,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Save,
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

export const TariffIntelligence: React.FC = () => {
  const { activeFacility, updateFacility, metrics, showNotification } = useEnergy();

  const [tariffType, setTariffType] = useState<TariffRate['type']>(activeFacility.tariff.type);
  const [flatRate, setFlatRate] = useState<string>(String(activeFacility.tariff.flatRate || 0.16));
  const [fixedCharge, setFixedCharge] = useState<string>(
    String(activeFacility.tariff.fixedMonthlyCharge || 50)
  );
  const [demandCharge, setDemandCharge] = useState<string>(
    String(activeFacility.tariff.demandChargePerKw || 12)
  );

  const [peakRate, setPeakRate] = useState<string>('0.30');
  const [midPeakRate, setMidPeakRate] = useState<string>('0.16');
  const [offPeakRate, setOffPeakRate] = useState<string>('0.08');

  // Generate 24-hr hourly rate curve for visualization
  const hourlyRateData = Array.from({ length: 24 }).map((_, hour) => {
    let rate = parseFloat(flatRate) || 0.16;
    let label = 'Flat';

    if (tariffType === 'tou') {
      if (hour >= 13 && hour < 19) {
        rate = parseFloat(peakRate) || 0.30;
        label = 'Peak Window (13:00 - 19:00)';
      } else if ((hour >= 7 && hour < 13) || (hour >= 19 && hour < 22)) {
        rate = parseFloat(midPeakRate) || 0.16;
        label = 'Mid-Peak';
      } else {
        rate = parseFloat(offPeakRate) || 0.08;
        label = 'Super Off-Peak';
      }
    }

    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      rate,
      label,
      isPeak: hour >= 13 && hour < 19,
    };
  });

  const handleSaveTariff = (e: React.FormEvent) => {
    e.preventDefault();

    const newTariff: TariffRate = {
      id: `tariff-${Date.now()}`,
      name: tariffType === 'tou' ? 'Configured Commercial TOU' : 'Configured Commercial Flat Rate',
      type: tariffType,
      flatRate: tariffType === 'flat' ? parseFloat(flatRate) || 0.16 : undefined,
      fixedMonthlyCharge: parseFloat(fixedCharge) || 0,
      demandChargePerKw: parseFloat(demandCharge) || 0,
      touPeriods:
        tariffType === 'tou'
          ? [
              { name: 'off_peak', rate: parseFloat(offPeakRate) || 0.08, startHour: 22, endHour: 7 },
              { name: 'mid_peak', rate: parseFloat(midPeakRate) || 0.16, startHour: 7, endHour: 13 },
              { name: 'peak', rate: parseFloat(peakRate) || 0.30, startHour: 13, endHour: 19 },
              { name: 'mid_peak', rate: parseFloat(midPeakRate) || 0.16, startHour: 19, endHour: 22 },
            ]
          : undefined,
    };

    updateFacility({
      ...activeFacility,
      tariff: newTariff,
    });
    showNotification('Tariff structure updated and recalculating', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Receipt className="w-4 h-4" />
            <span>Utility Accounting & Cost Architecture</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Tariff Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Model flat, tiered, and Time-of-Use rate schedules with peak demand charge surcharges
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 text-xs">
          <span className="text-slate-400">Current Plan:</span>
          <span className="ml-2 font-bold text-white">{activeFacility.tariff.name}</span>
        </div>
      </div>

      {/* Hourly Rate Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Diurnal 24-Hour Energy Rate Schedule ({activeFacility.currencySymbol}/kWh)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies cost spikes to target with load-shifting or battery storage
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
              <span>Off-Peak</span>
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block"></span>
              <span>Mid-Peak</span>
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
              <span>Peak ($0.30/kWh)</span>
            </span>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyRateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit={` ${activeFacility.currencySymbol}`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xs">
                        <div className="font-bold text-white">{d.hour}</div>
                        <div className="text-amber-400 font-semibold mt-1">
                          Rate: {activeFacility.currencySymbol}{d.rate.toFixed(3)}/kWh
                        </div>
                        <div className="text-[10px] text-slate-400">{d.label}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                {hourlyRateData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isPeak ? '#f43f5e' : entry.rate > 0.12 ? '#06b6d4' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tariff Plan Configuration Form */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <h2 className="text-sm font-bold text-white mb-1">Configure Building Utility Contract</h2>
        <p className="text-xs text-slate-400 mb-4">
          Changes are immediately evaluated through the deterministic energy calculation engine.
        </p>

        <form onSubmit={handleSaveTariff} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-slate-300 block mb-1">Tariff Schedule Type</label>
              <select
                value={tariffType}
                onChange={e => setTariffType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="tou">Time-of-Use (Peak / Mid / Off-Peak)</option>
                <option value="flat">Standard Commercial Flat Rate</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Fixed Monthly Customer Charge</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400">{activeFacility.currencySymbol}</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={fixedCharge}
                  onChange={e => setFixedCharge(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Peak Demand Surcharge (per kW)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400">{activeFacility.currencySymbol}</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={demandCharge}
                  onChange={e => setDemandCharge(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {tariffType === 'tou' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-850 border border-slate-750">
              <div>
                <label className="font-semibold text-rose-300 block mb-1">Peak Rate (13:00 - 19:00)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">{activeFacility.currencySymbol}</span>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    value={peakRate}
                    onChange={e => setPeakRate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-cyan-300 block mb-1">Mid-Peak Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">{activeFacility.currencySymbol}</span>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    value={midPeakRate}
                    onChange={e => setMidPeakRate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-emerald-300 block mb-1">Super Off-Peak Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">{activeFacility.currencySymbol}</span>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    value={offPeakRate}
                    onChange={e => setOffPeakRate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 max-w-sm">
              <label className="font-semibold text-emerald-300 block mb-1">Flat Rate (all hours)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400">{activeFacility.currencySymbol}</span>
                <input
                  type="number"
                  step="0.005"
                  min="0"
                  value={flatRate}
                  onChange={e => setFlatRate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Apply Tariff Structure</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
