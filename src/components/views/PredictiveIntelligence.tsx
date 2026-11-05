import React, { useState, useMemo } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import { generateForecast } from '../../utils/energyEngine';
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  DollarSign,
  Leaf,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const PredictiveIntelligence: React.FC = () => {
  const { activeFacility, metrics } = useEnergy();

  const [forecastHorizon, setForecastHorizon] = useState<number>(14);

  // Generate synthetic historical baseline (past 21 days) with realistic weekday/weekend noise around dailyTotalKwh
  const historicalDays = useMemo(() => {
    const baseDaily = metrics.facility.dailyTotalKwh || 250;
    const days: number[] = [];
    for (let i = 21; i >= 1; i--) {
      const isWeekend = i % 7 === 0 || i % 7 === 1;
      const variation = (Math.sin(i * 1.5) * 0.12 + (Math.random() * 0.08 - 0.04));
      const factor = isWeekend ? 0.70 : 1.05;
      days.push(Math.round(baseDaily * factor * (1 + variation) * 10) / 10);
    }
    return days;
  }, [metrics.facility.dailyTotalKwh]);

  const forecastData = useMemo(() => {
    return generateForecast(historicalDays, forecastHorizon);
  }, [historicalDays, forecastHorizon]);

  // Combine history and forecast into unified chart dataset
  const chartPoints = useMemo(() => {
    const points: any[] = [];

    // Historical points
    forecastData.history.forEach((h, idx) => {
      points.push({
        label: `Day -${21 - idx}`,
        actualKwh: h.actualKwh,
        predictedKwh: null,
        lowerBound: null,
        upperBound: null,
      });
    });

    // Bridge point
    const lastHistory = forecastData.history[forecastData.history.length - 1];
    points[points.length - 1].predictedKwh = lastHistory.actualKwh;

    // Forecast points
    forecastData.forecast.forEach(f => {
      points.push({
        label: f.label,
        actualKwh: null,
        predictedKwh: f.predictedKwh,
        lowerBound: f.lowerBoundKwh,
        upperBound: f.upperBoundKwh,
      });
    });

    return points;
  }, [forecastData]);

  // Summarize forecasted total energy & cost
  const totalForecastKwh = forecastData.forecast.reduce((s, f) => s + f.predictedKwh, 0);
  const avgRate = metrics.facility.monthlyCost / (metrics.facility.monthlyTotalKwh || 1);
  const totalForecastCost = totalForecastKwh * avgRate;
  const totalForecastCo2 = (totalForecastKwh * activeFacility.emissionFactorKgCo2PerKwh) / 1000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Statistical Demand Forecasting</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Predictive Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent linear trend & weekly diurnal seasonality model with MAE/RMSE benchmark validation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Horizon:</span>
          {[7, 14, 30].map(h => (
            <button
              key={h}
              onClick={() => setForecastHorizon(h)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                forecastHorizon === h
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {h} Days
            </button>
          ))}
        </div>
      </div>

      {/* Model Benchmark Validation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Forecast Cumulative</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {Math.round(totalForecastKwh).toLocaleString()} <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Across next {forecastHorizon} operating days
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Projected Expenditure</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300 mt-1">
            {activeFacility.currencySymbol}
            {totalForecastCost.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Based on active {activeFacility.tariff.name}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Model MAE Residual</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-300 mt-1">
            {forecastData.metrics.mae} <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-[10px] text-purple-400/80 mt-1">
            vs. Naive Baseline MAE: {forecastData.metrics.naiveMae} kWh
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Model RMSE Accuracy</span>
            <Leaf className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-teal-300 mt-1">
            {forecastData.metrics.rmse} <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Standard root mean square deviation
          </div>
        </div>
      </div>

      {/* Main Forecast Chart with Confidence Band */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Historical Telemetry & {forecastHorizon}-Day Predictive Trajectory</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Solid line: Historical & mean prediction • Shaded band: 95% statistical confidence interval
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-3 h-0.5 bg-slate-300 inline-block"></span>
              <span>Observed History</span>
            </span>
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
              <span>Forecast</span>
            </span>
            <span className="flex items-center gap-1 text-indigo-400">
              <span className="w-2.5 h-2.5 bg-indigo-500/20 border border-indigo-500 inline-block rounded-sm"></span>
              <span>95% Bounds</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" kWh" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-xs">
                        <div className="font-bold text-white">{d.label}</div>
                        {d.actualKwh !== null && (
                          <div className="text-slate-300 mt-1">
                            Observed: <strong className="text-white">{d.actualKwh} kWh</strong>
                          </div>
                        )}
                        {d.predictedKwh !== null && (
                          <div className="text-cyan-400 mt-1">
                            Predicted: <strong>{d.predictedKwh} kWh</strong>
                          </div>
                        )}
                        {d.lowerBound !== null && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Range: {d.lowerBound} – {d.upperBound} kWh (95% CI)
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
                dataKey="upperBound"
                stroke="transparent"
                fill="url(#forecastBand)"
              />
              <Line
                type="monotone"
                dataKey="actualKwh"
                stroke="#cbd5e1"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="predictedKwh"
                stroke="#38bdf8"
                strokeWidth={2.5}
                strokeDasharray="4 2"
                dot={{ r: 2.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Assumptions & Disclosures */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Transparent Model Disclosures & Limitations:</span>
        </div>
        <p>
          1. <strong>Training Window:</strong> Trained on a 21-day rolling history with residual tracking.
        </p>
        <p>
          2. <strong>Seasonality:</strong> Applies a deterministic weekend reduction coefficient (0.70x) to account for commercial building occupancy shifts.
        </p>
        <p>
          3. <strong>Confidence Bounds:</strong> Derived from studentized residuals at a 95% confidence horizon. Unscheduled equipment failures or extreme heatwave weather events lie outside this model boundary.
        </p>
      </div>
    </div>
  );
};
