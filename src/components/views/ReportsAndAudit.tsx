import React, { useState } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Building2,
  Leaf,
  DollarSign,
  Zap,
} from 'lucide-react';

export const ReportsAndAudit: React.FC = () => {
  const { activeFacility, metrics, anomalies, addAppliance, showNotification } = useEnergy();

  const [activeTab, setActiveTab] = useState<'audit_report' | 'export_csv' | 'import_csv'>('audit_report');

  // Import CSV State
  const [csvText, setCsvText] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const sampleCsvTemplate = `name,category,ratedwatts,standbywatts,quantity,operatinghoursperday,operatingdaysperweek,utilizationfactor
Conference Room LED Panels,lighting,45,0,12,9,5,0.85
High-Efficiency Server Host,it_compute,450,450,4,24,7,0.90
Breakroom Refrigerator,refrigeration,320,80,2,24,7,0.70
Commercial Dishwasher,machinery,5500,40,1,3,5,0.80`;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = async (dataset: 'appliances' | 'rooms' | 'anomalies') => {
    let items: any[] = [];
    let filename = `ecosmartx-${activeFacility.id}-${dataset}.csv`;

    if (dataset === 'appliances') {
      items = activeFacility.appliances.map(a => {
        const m = metrics.appliances.find(x => x.applianceId === a.id);
        return {
          ID: a.id,
          Name: a.name,
          Category: a.category,
          RatedWatts: a.ratedWatts,
          StandbyWatts: a.standbyWatts || 0,
          Quantity: a.quantity,
          HoursPerDay: a.operatingHoursPerDay,
          DaysPerWeek: a.operatingDaysPerWeek,
          UtilizationFactor: a.utilizationFactor,
          MonthlyKwh: Math.round(m?.monthlyTotalKwh || 0),
          MonthlyCost: m?.monthlyCost ? m.monthlyCost.toFixed(2) : '0.00',
        };
      });
    } else if (dataset === 'rooms') {
      items = metrics.rooms.map(r => ({
        RoomID: r.roomId,
        Name: r.name,
        Floor: r.floor,
        AreaSqM: r.areaSqM,
        MonthlyKwh: r.monthlyTotalKwh,
        MonthlyCost: r.monthlyCost.toFixed(2),
        WattDensityPerSqM: r.wattDensityPerSqM,
        EquipmentCount: r.applianceCount,
      }));
    } else {
      items = anomalies.map(a => ({
        AnomalyID: a.id,
        Title: a.title,
        Severity: a.severity,
        Observed: a.observedValue,
        Baseline: a.baselineExpected,
        Deviation: a.deviation,
        EstimatedMonthlyWaste: a.estimatedMonthlyWasteCost,
        Status: a.status,
      }));
    }

    try {
      const res = await fetch('/api/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, filename }),
      });

      if (!res.ok) throw new Error('Failed to generate CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showNotification(`Exported ${filename} with formula injection protection`, 'success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to export CSV', 'error');
    }
  };

  const handleValidateCsv = async () => {
    if (!csvText.trim()) return;
    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      });

      const data = await res.json();
      setValidationResult(data);
    } catch (e: any) {
      setValidationResult({ valid: false, error: 'Network error validating CSV.' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleIngestRows = () => {
    if (!validationResult || !validationResult.validRows) return;
    const defaultRoomId = activeFacility.rooms[0]?.id || 'room-1';
    validationResult.validRows.forEach((row: any) => {
      addAppliance({
        ...row,
        roomId: defaultRoomId,
      });
    });

    showNotification(
      `Successfully ingested ${validationResult.validRows.length} equipment assets into ${activeFacility.name}`,
      'success'
    );
    setCsvText('');
    setValidationResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Compliance, Audit & Data Exchange</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Reports & Audit Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            ASHRAE Level-1 printable energy audit report, sanitized CSV exports, and schema-validated batch imports
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['audit_report', 'export_csv', 'import_csv'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Printable Official Audit Report */}
      {activeTab === 'audit_report' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print / Save as PDF</span>
            </button>
          </div>

          {/* Printable Report Document Card */}
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-200 space-y-6 print:bg-white print:text-black print:border-none print:p-0">
            {/* Header Document Metadata */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-wider font-bold text-emerald-400 print:text-emerald-700">
                  Official Facility Energy & Carbon Audit
                </div>
                <h2 className="text-xl font-black text-white mt-1 print:text-black">
                  {activeFacility.name}
                </h2>
                <div className="text-xs text-slate-400 mt-0.5 print:text-slate-600">
                  {activeFacility.location} • Gross Floor Area: {activeFacility.floorAreaSqM.toLocaleString()} m² • Designed Occupancy: {activeFacility.occupancy}
                </div>
              </div>

              <div className="text-right text-xs text-slate-400 print:text-slate-600">
                <div>Audit Date: <strong>{new Date().toLocaleDateString()}</strong></div>
                <div>Methodology: <strong>Deterministic Equipment Duty Cycle Engine</strong></div>
                <div>Status: <span className="text-emerald-400 font-bold print:text-emerald-700">Certified Model</span></div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
                1. Executive Summary
              </h3>
              <p className="text-xs text-slate-300 print:text-slate-800 leading-relaxed">
                This deterministic energy audit evaluates baseline consumption, power density, and greenhouse gas emissions for <strong>{activeFacility.name}</strong>. Total modeled electrical consumption is <strong>{metrics.facility.monthlyTotalKwh.toLocaleString()} kWh/month</strong> ({metrics.facility.annualTotalKwh.toLocaleString()} kWh/annual), incurring an estimated monthly utility cost of <strong>{activeFacility.currencySymbol}{metrics.facility.monthlyCost.toFixed(2)}</strong> under the {activeFacility.tariff.name} rate structure.
              </p>
            </div>

            {/* KPI Summary Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 print:bg-slate-100 print:border-slate-300">
                <div className="text-[10px] text-slate-400 print:text-slate-600">Annual Energy</div>
                <div className="text-base font-bold text-white print:text-black mt-0.5">
                  {metrics.facility.annualTotalKwh.toLocaleString()} kWh
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 print:bg-slate-100 print:border-slate-300">
                <div className="text-[10px] text-slate-400 print:text-slate-600">Annualized Cost</div>
                <div className="text-base font-bold text-emerald-400 print:text-emerald-700 mt-0.5">
                  {activeFacility.currencySymbol}{metrics.facility.annualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 print:bg-slate-100 print:border-slate-300">
                <div className="text-[10px] text-slate-400 print:text-slate-600">Scope 2 Carbon</div>
                <div className="text-base font-bold text-teal-300 print:text-teal-700 mt-0.5">
                  {metrics.facility.annualCo2Tonnes} MT CO₂e/yr
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 print:bg-slate-100 print:border-slate-300">
                <div className="text-[10px] text-slate-400 print:text-slate-600">Energy Intensity</div>
                <div className="text-base font-bold text-cyan-300 print:text-cyan-700 mt-0.5">
                  {metrics.facility.energyIntensityKwhPerSqM} kWh/m²/yr
                </div>
              </div>
            </div>

            {/* Room Breakdown Table */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
                2. Zone Power Densities & Intensity Breakdown
              </h3>
              <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300">
                <thead className="bg-slate-850 print:bg-slate-200 text-slate-400 print:text-slate-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-2">Zone Name</th>
                    <th className="p-2">Floor</th>
                    <th className="p-2 text-right">Area (m²)</th>
                    <th className="p-2 text-right">Connected W/m²</th>
                    <th className="p-2 text-right">Monthly Energy</th>
                    <th className="p-2 text-right">Monthly Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                  {metrics.rooms.map(r => (
                    <tr key={r.roomId}>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2">Floor {r.floor}</td>
                      <td className="p-2 text-right">{r.areaSqM}</td>
                      <td className="p-2 text-right font-semibold text-purple-400 print:text-purple-700">{r.wattDensityPerSqM} W/m²</td>
                      <td className="p-2 text-right">{Math.round(r.monthlyTotalKwh).toLocaleString()} kWh</td>
                      <td className="p-2 text-right font-bold text-emerald-400 print:text-emerald-700">
                        {activeFacility.currencySymbol}{r.monthlyCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Forensic Anomaly Findings */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
                3. Identified Conservation & Waste Findings
              </h3>
              {anomalies.filter(a => a.status === 'active').length === 0 ? (
                <p className="text-xs text-slate-400">No active critical waste anomalies detected in facility schedule.</p>
              ) : (
                <div className="space-y-2">
                  {anomalies
                    .filter(a => a.status === 'active')
                    .map(a => (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl bg-slate-850/60 border border-slate-750 print:bg-slate-50 print:border-slate-300 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-amber-300 print:text-amber-800">
                          <span>{a.title} ({a.severity.toUpperCase()})</span>
                          <span>Est. Waste: {activeFacility.currencySymbol}{a.estimatedMonthlyWasteCost}/mo</span>
                        </div>
                        <p className="text-slate-300 print:text-slate-700">{a.evidence}</p>
                        <p className="text-emerald-400 print:text-emerald-700 font-medium">Recommendation: {a.recommendedAction}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Methodology & Limitations */}
            <div className="pt-4 border-t border-slate-800 print:border-slate-300 text-[10px] text-slate-500 print:text-slate-600 space-y-1">
              <div><strong>Methodology & Compliance:</strong> Calculations follow the deterministic equation: <code>kWh = watts × quantity × operatingHours × utilizationFactor / 1000</code>. Scope 2 emissions adhere to GHG Protocol corporate accounting standards using regional grid emission factors (EPA eGRID / IEA).</div>
              <div><strong>Limitations:</strong> Unmonitored plug loads or uncalibrated off-schedule runtime will introduce variance. Verified actual bills should be compared against simulated baseline quarterly.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Export CSV */}
      {activeTab === 'export_csv' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Sanitized CSV Export</h2>
            <p className="text-xs text-slate-400 mt-1">
              Export facility records with automated formula injection protection (values prepended with quote if starting with =, +, -, @).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-xs">Appliance Register</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Full equipment list with ratings, duty cycles, monthly kWh, and calculated costs.
                </p>
              </div>
              <button
                onClick={() => handleExportCsv('appliances')}
                className="mt-4 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Appliances CSV</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-xs">Facility Zones & Density</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Room names, floor allocations, area (m²), connected W/m², and energy totals.
                </p>
              </div>
              <button
                onClick={() => handleExportCsv('rooms')}
                className="mt-4 flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Zones CSV</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-xs">Forensic Anomalies</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Detected waste patterns, observed vs baseline deviations, and estimated cost impact.
                </p>
              </div>
              <button
                onClick={() => handleExportCsv('anomalies')}
                className="mt-4 flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Anomalies CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Import CSV */}
      {activeTab === 'import_csv' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Batch Equipment CSV Ingestion</h2>
            <p className="text-xs text-slate-400 mt-1">
              Import equipment assets in bulk. Schema is validated against required columns (name, category, ratedWatts, quantity, operatingHoursPerDay).
            </p>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Paste CSV Contents or Load Sample:</span>
            <button
              onClick={() => setCsvText(sampleCsvTemplate)}
              className="text-cyan-400 hover:underline font-medium"
            >
              Load Sample Equipment Template
            </button>
          </div>

          <textarea
            rows={6}
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="Paste CSV rows here..."
            className="w-full font-mono text-xs bg-slate-950 border border-slate-750 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-400"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={handleValidateCsv}
              disabled={!csvText.trim() || isValidating}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-colors"
            >
              {isValidating ? 'Validating Schema...' : 'Validate CSV Rows'}
            </button>
          </div>

          {/* Validation Result Preview */}
          {validationResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3 text-xs">
              {validationResult.valid ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      CSV Valid: {validationResult.validRowCount} equipment rows ready for ingestion.
                    </span>
                  </div>

                  {/* Preview table */}
                  <div className="overflow-x-auto border border-slate-700/60 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 text-slate-300 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Category</th>
                          <th className="p-2 text-right">Rated Watts</th>
                          <th className="p-2 text-right">Qty</th>
                          <th className="p-2 text-right">Hours/Day</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {validationResult.preview.map((row: any, i: number) => (
                          <tr key={i}>
                            <td className="p-2 font-medium text-white">{row.name}</td>
                            <td className="p-2 text-slate-400">{row.category}</td>
                            <td className="p-2 text-right text-slate-200">{row.ratedWatts} W</td>
                            <td className="p-2 text-right text-slate-200">{row.quantity}</td>
                            <td className="p-2 text-right text-slate-200">{row.operatingHoursPerDay}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleIngestRows}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                    >
                      Confirm & Ingest {validationResult.validRowCount} Assets
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>CSV Validation Failed: {validationResult.error}</span>
                  </div>
                  {validationResult.errors && (
                    <ul className="list-disc list-inside space-y-1 text-rose-300/80 text-[11px]">
                      {validationResult.errors.map((err: any, idx: number) => (
                        <li key={idx}>
                          Row {err.row}: {err.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
