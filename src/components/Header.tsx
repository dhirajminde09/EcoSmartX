import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import {
  Building2,
  ChevronDown,
  Plus,
  AlertTriangle,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  Sliders,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileNav: () => void;
  isMobileNavOpen: boolean;
  onOpenNewFacilityModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileNav,
  isMobileNavOpen,
  onOpenNewFacilityModal,
}) => {
  const {
    facilities,
    activeFacility,
    setActiveFacilityId,
    metrics,
    anomalies,
    activeScenarioId,
    setActiveScenarioId,
    scenarios,
    notification,
    resetDemoData,
  } = useEnergy();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const activeAnomaliesCount = anomalies.filter(a => a.status === 'active').length;
  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  return (
    <header className="sticky top-0 z-30 bg-[#0b132b]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Facility Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileNav}
            className="lg:hidden p-2 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
            aria-label={isMobileNavOpen ? 'Close Menu' : 'Open Menu'}
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Facility Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/60 text-left transition-all hover:border-emerald-500/40"
              aria-label="Switch active facility"
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="truncate max-w-[140px] sm:max-w-[220px]">{activeFacility.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-[10px] text-slate-400">
                  {activeFacility.floorAreaSqM.toLocaleString()} m² • {activeFacility.currencySymbol}{metrics.facility.monthlyCost.toLocaleString()}/mo
                </div>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-[#0e172f] border border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Facility
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {facilities.map(fac => (
                    <button
                      key={fac.id}
                      onClick={() => {
                        setActiveFacilityId(fac.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-800/60 transition-colors ${
                        fac.id === activeFacility.id ? 'bg-emerald-500/10 text-emerald-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate">{fac.name}</div>
                        <div className="text-[10px] text-slate-400">{fac.location}</div>
                      </div>
                      {fac.id === activeFacility.id && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-700/60 mt-1 pt-1 px-2 flex items-center justify-between gap-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewFacilityModal();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Facility</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      resetDemoData();
                    }}
                    title="Reset to Factory Benchmark Data"
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
                    aria-label="Reset to Factory Benchmark Data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right: Active Scenario & Status Badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          {activeScenario ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 text-xs">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-medium hidden sm:inline">Scenario:</span>
              <span className="font-semibold truncate max-w-[120px]">{activeScenario.name}</span>
              <button
                onClick={() => setActiveScenarioId(null)}
                className="ml-1 text-cyan-400 hover:text-white text-xs font-bold"
                title="Exit Scenario View"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Baseline</span>
            </div>
          )}

          {/* Anomaly Badge */}
          {activeAnomaliesCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/50 text-amber-300 text-xs font-medium"
              title={`${activeAnomaliesCount} energy waste anomalies detected`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>{activeAnomaliesCount}</span>
              <span className="hidden sm:inline">Anomalies</span>
            </div>
          )}

          {/* AI Status */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gemini Ready</span>
          </div>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
            notification.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
              : notification.type === 'info'
              ? 'bg-blue-950/90 text-blue-300 border border-blue-800'
              : 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
          }`}
        >
          <span>{notification.message}</span>
          <span className="text-[10px] opacity-70 ml-2">Just now</span>
        </div>
      )}
    </header>
  );
};
