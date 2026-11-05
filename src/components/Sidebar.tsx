import React from 'react';
import {
  LayoutDashboard,
  Box,
  Building,
  Cpu,
  BarChart3,
  Sliders,
  FlaskConical,
  TrendingUp,
  AlertOctagon,
  Zap,
  MessageSquareText,
  Lightbulb,
  Receipt,
  Leaf,
  Trophy,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';

export type NavigationTab =
  | 'dashboard'
  | 'digital_twin'
  | 'facilities_rooms'
  | 'appliances'
  | 'analytics'
  | 'simulation'
  | 'scenarios'
  | 'forecasting'
  | 'waste_forensics'
  | 'optimization'
  | 'copilot'
  | 'advisor'
  | 'tariffs'
  | 'carbon'
  | 'challenges'
  | 'reports'
  | 'settings';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  badge?: number;
  highlight?: boolean;
}

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { anomalies, userProfile } = useEnergy();
  const activeAnomaliesCount = anomalies.filter(a => a.status === 'active').length;

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: 'Core Operations',
      items: [
        { id: 'dashboard' as NavigationTab, label: 'Command Center', icon: LayoutDashboard },
        { id: 'digital_twin' as NavigationTab, label: 'Digital Twin Studio', icon: Box, tag: 'Interactive' },
        { id: 'facilities_rooms' as NavigationTab, label: 'Facilities & Rooms', icon: Building },
        { id: 'appliances' as NavigationTab, label: 'Appliance Intelligence', icon: Cpu },
        { id: 'analytics' as NavigationTab, label: 'Energy Analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Simulation & Intelligence',
      items: [
        { id: 'simulation' as NavigationTab, label: 'Energy Simulation Lab', icon: Sliders },
        { id: 'scenarios' as NavigationTab, label: 'Scenario Laboratory', icon: FlaskConical },
        { id: 'forecasting' as NavigationTab, label: 'Predictive Intelligence', icon: TrendingUp },
        {
          id: 'waste_forensics' as NavigationTab,
          label: 'Energy Waste Forensics',
          icon: AlertOctagon,
          badge: activeAnomaliesCount > 0 ? activeAnomaliesCount : undefined,
        },
        { id: 'optimization' as NavigationTab, label: 'Optimization Engine', icon: Zap },
      ],
    },
    {
      label: 'AI & Conservation',
      items: [
        { id: 'copilot' as NavigationTab, label: 'Gemini Energy Copilot', icon: MessageSquareText, highlight: true },
        { id: 'advisor' as NavigationTab, label: 'AI Conservation Advisor', icon: Lightbulb },
      ],
    },
    {
      label: 'Tariffs, Carbon & ESG',
      items: [
        { id: 'tariffs' as NavigationTab, label: 'Tariff Intelligence', icon: Receipt },
        { id: 'carbon' as NavigationTab, label: 'Carbon Intelligence', icon: Leaf },
        { id: 'challenges' as NavigationTab, label: 'Eco Challenges', icon: Trophy },
        { id: 'reports' as NavigationTab, label: 'Reports & Audit Center', icon: FileSpreadsheet },
        { id: 'settings' as NavigationTab, label: 'Settings & Workspace', icon: Settings },
      ],
    },
  ];

  const handleSelect = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a1128] border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              <span>EcoSmart</span>
              <span className="text-emerald-400">X</span>
            </div>
            <div className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
              Enterprise Energy AI
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {navGroups.map(group => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-300 font-semibold border border-emerald-500/30'
                        : item.highlight
                        ? 'text-indigo-300 hover:bg-indigo-950/40 hover:text-indigo-200'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-emerald-400'
                            : item.highlight
                            ? 'text-indigo-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.tag && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                          {item.tag}
                        </span>
                      )}
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User profile footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-slate-850/60 border border-slate-700/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {userProfile.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                <span>{userProfile.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[10px] text-slate-400 truncate">{userProfile.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
