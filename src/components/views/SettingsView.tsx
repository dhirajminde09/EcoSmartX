import React, { useState } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import {
  Settings,
  User,
  ShieldCheck,
  RefreshCw,
  Download,
  Sparkles,
  Check,
  Building,
  Coins,
  Globe,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    facilities,
    resetDemoData,
    showNotification,
    activeFacility,
  } = useEnergy();

  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [role, setRole] = useState(userProfile.role);
  const [organization, setOrganization] = useState(userProfile.organization);
  const [unitSystem, setUnitSystem] = useState(userProfile.unitSystem);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      email,
      role,
      organization,
      unitSystem,
    });
  };

  const handleExportJsonBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      app: 'EcoSmartX Energy & Carbon Intelligence Platform',
      version: '1.0.0',
      userProfile,
      facilities,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecosmartx-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNotification('Exported complete JSON workspace backup', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Workspace Preferences & Account Security</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Settings & Platform Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage organization profiles, metric/imperial unit preferences, and persistent workspace data
          </p>
        </div>

        <button
          onClick={handleExportJsonBackup}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Workspace JSON Backup</span>
        </button>
      </div>

      {/* Grid: Profile & AI Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User & Organization Form */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h2 className="text-sm font-bold text-white mb-1">User & Organization Profile</h2>
          <p className="text-xs text-slate-400 mb-4">
            Auditing credentials stamped on official energy certification reports
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="font-medium text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-slate-300 block mb-1">Professional Role / Title</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="font-medium text-slate-300 block mb-1">Organization / Enterprise</label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Measurement Unit System</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="unit"
                    checked={unitSystem === 'metric'}
                    onChange={() => setUnitSystem('metric')}
                    className="accent-cyan-500"
                  />
                  <span>Metric (kWh, m², kg CO₂e)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="unit"
                    checked={unitSystem === 'imperial'}
                    onChange={() => setUnitSystem('imperial')}
                    className="accent-cyan-500"
                  />
                  <span>Imperial (kWh, sq.ft, lbs CO₂e)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* AI & Infrastructure Architecture Status */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI & Cloud Architecture</span>
            </h2>
            <p className="text-xs text-slate-400 mb-3">Server-side execution posture</p>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Gemini Model</div>
                  <div className="font-bold text-indigo-300">gemini-3.8-flash</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  Active
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">API Gateway</div>
                  <div className="font-semibold text-slate-200">Express /api/gemini/*</div>
                </div>
                <span className="text-[10px] text-slate-400">Server-Side Proxy</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Calculation Engine</div>
                  <div className="font-semibold text-emerald-300">Deterministic TypeScript</div>
                </div>
                <span className="text-[10px] text-slate-400">100% Math Verified</span>
              </div>
            </div>
          </div>

          {/* Reset Demo Data Action */}
          <div className="pt-3 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 mb-2">
              Restore factory synthetic benchmark facilities (EcoTech Hub, GreenValley BioMed, Apex Logistics):
            </div>
            <button
              onClick={resetDemoData}
              className="w-full py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/60 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Factory Benchmark Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
