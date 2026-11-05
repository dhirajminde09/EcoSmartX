import React, { useState } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import { Appliance } from '../../utils/energyEngine';
import {
  Cpu,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Zap,
  Clock,
  Flame,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

export const ApplianceIntelligence: React.FC = () => {
  const { activeFacility, addAppliance, updateAppliance, deleteAppliance, metrics } = useEnergy();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'kwh' | 'watts' | 'cost'>('kwh');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Appliance['category']>('plug_load');
  const [roomId, setRoomId] = useState(activeFacility.rooms[0]?.id || '');
  const [ratedWatts, setRatedWatts] = useState('250');
  const [standbyWatts, setStandbyWatts] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [operatingHoursPerDay, setOperatingHoursPerDay] = useState('8');
  const [operatingDaysPerWeek, setOperatingDaysPerWeek] = useState('5');
  const [utilizationFactor, setUtilizationFactor] = useState('0.8');
  const [shiftable, setShiftable] = useState(false);
  const [startHour, setStartHour] = useState('8');
  const [endHour, setEndHour] = useState('17');
  const [notes, setNotes] = useState('');

  // Replacement Simulator State
  const [selectedForUpgrade, setSelectedForUpgrade] = useState<string | null>(null);
  const [upgradeEfficiencyPct, setUpgradeEfficiencyPct] = useState<number>(40); // 40% reduction
  const [upgradeCapitalCost, setUpgradeCapitalCost] = useState<number>(500);

  const openAddModal = () => {
    setEditingAppliance(null);
    setName('');
    setCategory('plug_load');
    setRoomId(activeFacility.rooms[0]?.id || '');
    setRatedWatts('200');
    setStandbyWatts('5');
    setQuantity('1');
    setOperatingHoursPerDay('8');
    setOperatingDaysPerWeek('5');
    setUtilizationFactor('0.8');
    setShiftable(false);
    setStartHour('9');
    setEndHour('17');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (app: Appliance) => {
    setEditingAppliance(app);
    setName(app.name);
    setCategory(app.category);
    setRoomId(app.roomId);
    setRatedWatts(String(app.ratedWatts));
    setStandbyWatts(String(app.standbyWatts || 0));
    setQuantity(String(app.quantity));
    setOperatingHoursPerDay(String(app.operatingHoursPerDay));
    setOperatingDaysPerWeek(String(app.operatingDaysPerWeek));
    setUtilizationFactor(String(app.utilizationFactor));
    setShiftable(!!app.shiftable);
    setStartHour(String(app.operatingWindow?.startHour ?? 9));
    setEndHour(String(app.operatingWindow?.endHour ?? 17));
    setNotes(app.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appData = {
      name: name.trim() || 'Monitored Equipment',
      category,
      roomId: roomId || activeFacility.rooms[0]?.id || 'default-room',
      ratedWatts: Math.max(1, parseFloat(ratedWatts) || 100),
      standbyWatts: Math.max(0, parseFloat(standbyWatts) || 0),
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      operatingHoursPerDay: Math.min(24, Math.max(0, parseFloat(operatingHoursPerDay) || 8)),
      operatingDaysPerWeek: Math.min(7, Math.max(1, parseFloat(operatingDaysPerWeek) || 5)),
      utilizationFactor: Math.min(1.0, Math.max(0.1, parseFloat(utilizationFactor) || 0.8)),
      shiftable,
      operatingWindow: {
        startHour: parseInt(startHour, 10) || 0,
        endHour: parseInt(endHour, 10) || 24,
      },
      notes: notes.trim(),
    };

    if (editingAppliance) {
      updateAppliance({ ...appData, id: editingAppliance.id });
    } else {
      addAppliance(appData);
    }
    setIsModalOpen(false);
  };

  // Filter & Sort
  const filteredAppliances = activeFacility.appliances.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || app.category === categoryFilter;
    const matchesRoom = roomFilter === 'all' || app.roomId === roomFilter;
    return matchesSearch && matchesCategory && matchesRoom;
  });

  const sortedAppliances = [...filteredAppliances].sort((a, b) => {
    const metricA = metrics.appliances.find(m => m.applianceId === a.id);
    const metricB = metrics.appliances.find(m => m.applianceId === b.id);

    if (sortBy === 'watts') {
      return b.ratedWatts * b.quantity - a.ratedWatts * a.quantity;
    }
    if (sortBy === 'cost') {
      return (metricB?.monthlyCost || 0) - (metricA?.monthlyCost || 0);
    }
    return (metricB?.monthlyTotalKwh || 0) - (metricA?.monthlyTotalKwh || 0);
  });

  // Calculate high-level stats
  const totalConnectedKw =
    activeFacility.appliances.reduce((sum, a) => sum + a.ratedWatts * a.quantity, 0) / 1000;
  const totalStandbyWatts = activeFacility.appliances.reduce(
    (sum, a) => sum + (a.standbyWatts || 0) * a.quantity,
    0
  );

  // Upgrade simulator target
  const upgradeTargetApp = activeFacility.appliances.find(a => a.id === selectedForUpgrade);
  const upgradeTargetMetric = upgradeTargetApp
    ? metrics.appliances.find(m => m.applianceId === upgradeTargetApp.id)
    : null;

  const simulatedMonthlySavingKwh = upgradeTargetMetric
    ? (upgradeTargetMetric.monthlyTotalKwh * upgradeEfficiencyPct) / 100
    : 0;
  const simulatedMonthlySavingCost = upgradeTargetMetric
    ? (upgradeTargetMetric.monthlyCost * upgradeEfficiencyPct) / 100
    : 0;
  const paybackMonths =
    simulatedMonthlySavingCost > 0
      ? Math.round((upgradeCapitalCost / simulatedMonthlySavingCost) * 10) / 10
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Asset Telemetry & Ratings</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Appliance Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitored equipment register, rated vs standby loads, and retrofit simulation for {activeFacility.name}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Equipment</span>
        </button>
      </div>

      {/* Top Asset Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Connected Capacity</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {totalConnectedKw.toFixed(1)} <span className="text-xs font-normal text-slate-400">kW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {activeFacility.appliances.length} asset entries ({activeFacility.appliances.reduce((s, a) => s + a.quantity, 0)} physical devices)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Continuous Standby Drain</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-300 mt-1">
            {(totalStandbyWatts / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">kW continuous</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ~{metrics.facility.standbyWasteMonthlyKwh.toLocaleString()} kWh/mo phantom parasitic loss
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Shiftable Grid Agility</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 mt-1">
            {activeFacility.appliances.filter(a => a.shiftable).length} <span className="text-xs font-normal text-slate-400">Loads</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Eligible for peak-to-off-peak load rescheduling
          </div>
        </div>
      </div>

      {/* Equipment Replacement ROI Sandbox Tool */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-900/50 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Rapid Retrofit ROI Simulator</span>
        </div>
        <p className="text-xs text-slate-300 mb-4">
          Select any installed appliance to estimate savings and payback timeline from upgrading to high-efficiency or inverter-driven alternatives.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Select Equipment</label>
            <select
              value={selectedForUpgrade || ''}
              onChange={e => setSelectedForUpgrade(e.target.value || null)}
              className="w-full bg-slate-850 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
            >
              <option value="">-- Choose Equipment --</option>
              {activeFacility.appliances.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.ratedWatts}W)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Target Efficiency Gain</label>
            <select
              value={upgradeEfficiencyPct}
              onChange={e => setUpgradeEfficiencyPct(parseInt(e.target.value, 10))}
              className="w-full bg-slate-850 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
            >
              <option value={20}>20% (Standard Energy Star)</option>
              <option value={35}>35% (Inverter / VFD Upgrade)</option>
              <option value={50}>50% (High-Tier Commercial Heat Pump)</option>
              <option value={70}>70% (Fluorescent to LED Retrofit)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Estimated Retrofit Cost</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-slate-400">{activeFacility.currencySymbol}</span>
              <input
                type="number"
                min="0"
                value={upgradeCapitalCost}
                onChange={e => setUpgradeCapitalCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg pl-6 pr-2.5 py-1.5 text-white"
              />
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-indigo-800/40 flex flex-col justify-center">
            {upgradeTargetApp ? (
              <div>
                <div className="text-[10px] text-slate-400">Projected Savings & Payback:</div>
                <div className="font-bold text-emerald-300 text-sm">
                  {activeFacility.currencySymbol}
                  {simulatedMonthlySavingCost.toFixed(2)}/mo • {paybackMonths} mo payback
                </div>
                <div className="text-[10px] text-cyan-300">
                  Save {Math.round(simulatedMonthlySavingKwh)} kWh/month
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">Select an asset to see projected ROI</div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search equipment by name or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-2 text-xs"
          >
            <option value="all">All Categories</option>
            <option value="hvac">HVAC</option>
            <option value="lighting">Lighting</option>
            <option value="it_compute">IT & Compute</option>
            <option value="refrigeration">Refrigeration</option>
            <option value="machinery">Machinery</option>
            <option value="plug_load">Plug Loads</option>
          </select>

          {/* Room Filter */}
          <select
            value={roomFilter}
            onChange={e => setRoomFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-2 text-xs"
          >
            <option value="all">All Zones</option>
            {activeFacility.rooms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-2 text-xs"
          >
            <option value="kwh">Sort: Monthly kWh</option>
            <option value="cost">Sort: Monthly Cost</option>
            <option value="watts">Sort: Total Watts</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Equipment Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Zone / Room</th>
                <th className="py-3 px-3 text-right">Rated Load</th>
                <th className="py-3 px-3 text-right">Standby</th>
                <th className="py-3 px-3 text-center">Duty Cycle</th>
                <th className="py-3 px-3 text-right">Monthly Energy</th>
                <th className="py-3 px-3 text-right">Monthly Cost</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedAppliances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No equipment found matching filters.
                  </td>
                </tr>
              ) : (
                sortedAppliances.map(app => {
                  const room = activeFacility.rooms.find(r => r.id === app.roomId);
                  const m = metrics.appliances.find(a => a.applianceId === app.id);
                  return (
                    <tr key={app.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{app.name}</div>
                        {app.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{app.notes}</div>}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {app.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {room?.name || 'Unassigned Zone'}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-200">
                        {app.ratedWatts} W <span className="text-[10px] text-slate-400">×{app.quantity}</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {app.standbyWatts && app.standbyWatts > 0 ? (
                          <span className="text-rose-400 font-semibold">{app.standbyWatts * app.quantity} W</span>
                        ) : (
                          <span className="text-slate-500">0 W</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-300">
                        {app.operatingHoursPerDay}h/d • {app.operatingDaysPerWeek}d/w
                        {app.shiftable && (
                          <span className="block text-[9px] text-cyan-400 font-medium">⚡ Shiftable</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-cyan-400">
                        {Math.round(m?.monthlyTotalKwh || 0).toLocaleString()} kWh
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {activeFacility.currencySymbol}
                        {m?.monthlyCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Equipment"
                            aria-label={`Edit ${app.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteAppliance(app.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Equipment"
                            aria-label={`Delete ${app.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Equipment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-1">
              {editingAppliance ? 'Edit Monitored Equipment' : 'Add New Equipment Asset'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter verified power rating and duty schedule to feed the deterministic calculation engine.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-300 block mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Rack PDU Alpha"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="hvac">HVAC & Cooling</option>
                    <option value="lighting">Lighting</option>
                    <option value="it_compute">IT & Compute</option>
                    <option value="refrigeration">Refrigeration</option>
                    <option value="machinery">Machinery & Motors</option>
                    <option value="plug_load">Plug Loads & Appliances</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-300 block mb-1">Assigned Zone *</label>
                  <select
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {activeFacility.rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Floor {r.floor})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Rated Watts (per unit) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ratedWatts}
                    onChange={e => setRatedWatts(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-300 block mb-1">Standby Watts</label>
                  <input
                    type="number"
                    min="0"
                    value={standbyWatts}
                    onChange={e => setStandbyWatts(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-300 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Active Hours/Day (0-24)</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    required
                    value={operatingHoursPerDay}
                    onChange={e => setOperatingHoursPerDay(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-300 block mb-1">Days/Week (1-7)</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    required
                    value={operatingDaysPerWeek}
                    onChange={e => setOperatingDaysPerWeek(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-300 block mb-1">Utilization (0.1 - 1.0)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    required
                    value={utilizationFactor}
                    onChange={e => setUtilizationFactor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Operating Window & Shiftable */}
              <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-200">Shiftable Load (TOU Flex)</label>
                  <input
                    type="checkbox"
                    checked={shiftable}
                    onChange={e => setShiftable(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Typical Start Hour (0-23):</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={startHour}
                      onChange={e => setStartHour(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">Typical End Hour (0-23):</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={endHour}
                      onChange={e => setEndHour(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-300 block mb-1">Notes / Specifications</label>
                <input
                  type="text"
                  placeholder="e.g. Model XYZ-900, calibrated Oct 2026"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {editingAppliance ? 'Save Changes' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
