import React, { useState } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import { Room } from '../../utils/energyEngine';
import {
  Box,
  Layers,
  Thermometer,
  Zap,
  Plus,
  Info,
  Maximize2,
  Cpu,
  ChevronRight,
  Sliders,
  Sparkles,
} from 'lucide-react';

export const DigitalTwinStudio: React.FC = () => {
  const {
    activeFacility,
    metrics,
    addRoom,
    updateRoom,
    activeScenarioId,
    setActiveScenarioId,
    scenarios,
  } = useEnergy();

  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<'watt_density' | 'monthly_kwh' | 'appliance_count'>('watt_density');
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);

  // New room modal state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomArea, setNewRoomArea] = useState('250');
  const [newRoomType, setNewRoomType] = useState<Room['type']>('office');

  const availableFloors = Array.from(
    new Set(activeFacility.rooms.map(r => r.floor || 1))
  ).sort((a, b) => a - b);

  if (availableFloors.length === 0) availableFloors.push(1);

  const roomsOnFloor = activeFacility.rooms.filter(
    r => (r.floor || 1) === selectedFloor
  );

  const selectedRoom = activeFacility.rooms.find(r => r.id === selectedRoomId);
  const selectedRoomMetrics = metrics.rooms.find(r => r.roomId === selectedRoomId);
  const roomAppliances = activeFacility.appliances.filter(a => a.roomId === selectedRoomId);

  // Helper to calculate heatmap fill color
  const getRoomHeatmapColor = (roomId: string) => {
    const rm = metrics.rooms.find(r => r.roomId === roomId);
    if (!rm) return '#1e293b';

    if (heatmapMode === 'watt_density') {
      const density = rm.wattDensityPerSqM;
      if (density > 70) return 'rgba(239, 68, 68, 0.45)'; // Red hotspot
      if (density > 45) return 'rgba(245, 158, 11, 0.4)';  // Amber
      if (density > 25) return 'rgba(6, 182, 212, 0.35)';  // Cyan
      return 'rgba(16, 185, 129, 0.35)';                  // Green efficient
    }

    if (heatmapMode === 'monthly_kwh') {
      const kwh = rm.monthlyTotalKwh;
      if (kwh > 5000) return 'rgba(239, 68, 68, 0.45)';
      if (kwh > 2000) return 'rgba(245, 158, 11, 0.4)';
      if (kwh > 800) return 'rgba(6, 182, 212, 0.35)';
      return 'rgba(16, 185, 129, 0.35)';
    }

    // Equipment count
    const count = rm.applianceCount;
    if (count > 5) return 'rgba(168, 85, 247, 0.45)';
    if (count > 2) return 'rgba(59, 130, 246, 0.4)';
    return 'rgba(16, 185, 129, 0.35)';
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    // Calculate next available grid position (x, y)
    const count = roomsOnFloor.length;
    const x = (count % 3) * 32 + 5;
    const y = Math.floor(count / 3) * 32 + 10;

    addRoom({
      name: newRoomName.trim(),
      areaSqM: parseFloat(newRoomArea) || 100,
      floor: selectedFloor,
      type: newRoomType,
      occupancyCapacity: Math.round((parseFloat(newRoomArea) || 100) / 10),
      x,
      y,
      width: 28,
      height: 26,
    });

    setNewRoomName('');
    setShowAddRoomModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Box className="w-4 h-4" />
            <span>Facility Spatial Model</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            2D Interactive Digital Twin
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Zonal energy distribution & thermal intensity simulation for {activeFacility.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Floor selection buttons */}
          <div className="flex items-center bg-slate-850 p-1 rounded-xl border border-slate-700">
            {availableFloors.map(floor => (
              <button
                key={floor}
                onClick={() => {
                  setSelectedFloor(floor);
                  setSelectedRoomId(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  selectedFloor === floor
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Floor {floor}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddRoomModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Zone</span>
          </button>
        </div>
      </div>

      {/* Virtual Model Notice */}
      <div className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-cyan-800/40 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Deterministic Virtual Model:</strong> Spatial intensities are calculated from verified
            equipment schedules and floor area ratios, not uncalibrated hardware sensor feeds.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[11px]">
          <span className="text-slate-400">Mode:</span>
          <select
            value={heatmapMode}
            onChange={e => setHeatmapMode(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-xs"
          >
            <option value="watt_density">Connected W/m² (Heatmap)</option>
            <option value="monthly_kwh">Monthly kWh Volume</option>
            <option value="appliance_count">Equipment Density</option>
          </select>
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Interactive Canvas */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#090f24] border border-slate-800 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Floor {selectedFloor} Schematic Plan</span>
              <span className="text-slate-400 font-normal">({roomsOnFloor.length} configured zones)</span>
            </div>

            {/* Heatmap intensity legend */}
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/50 border border-emerald-400"></span>
                <span>&lt;25 W/m²</span>
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/50 border border-cyan-400"></span>
                <span>25-45 W/m²</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/50 border border-amber-400"></span>
                <span>45-70 W/m²</span>
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/50 border border-rose-400"></span>
                <span>&gt;70 W/m²</span>
              </span>
            </div>
          </div>

          {/* SVG Floor plan container */}
          <div className="relative w-full aspect-[16/10] bg-[#0c142c] rounded-xl border border-slate-800/90 overflow-hidden flex items-center justify-center p-2">
            {roomsOnFloor.length === 0 ? (
              <div className="text-center p-6 text-slate-400">
                <Box className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-semibold text-slate-300">No zones on Floor {selectedFloor}</p>
                <p className="text-xs mt-1">Click &quot;Add Zone&quot; to lay out rooms on this floor.</p>
              </div>
            ) : (
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full select-none"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
              >
                {/* Architectural grid background */}
                <defs>
                  <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                    <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.2" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />

                {/* Outer building perimeter boundary */}
                <rect
                  x="2"
                  y="2"
                  width="96"
                  height="96"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="0.8"
                  rx="1"
                  strokeDasharray="2,1"
                />

                {/* Render Rooms */}
                {roomsOnFloor.map((room, idx) => {
                  const isSelected = room.id === selectedRoomId;
                  const rm = metrics.rooms.find(r => r.roomId === room.id);
                  const fillColor = getRoomHeatmapColor(room.id);
                  const roomX = room.x ?? (idx % 3) * 30 + 5;
                  const roomY = room.y ?? Math.floor(idx / 3) * 30 + 10;
                  const roomW = room.width ?? 27;
                  const roomH = room.height ?? 25;

                  return (
                    <g
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className="cursor-pointer transition-transform hover:opacity-95"
                    >
                      {/* Room boundary */}
                      <rect
                        x={roomX}
                        y={roomY}
                        width={roomW}
                        height={roomH}
                        fill={fillColor}
                        stroke={isSelected ? '#38bdf8' : '#475569'}
                        strokeWidth={isSelected ? '1' : '0.4'}
                        rx="1"
                      />

                      {/* Selection accent glow */}
                      {isSelected && (
                        <rect
                          x={roomX - 0.5}
                          y={roomY - 0.5}
                          width={roomW + 1}
                          height={roomH + 1}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="0.5"
                          strokeDasharray="1,1"
                          rx="1.5"
                        />
                      )}

                      {/* Room Name label */}
                      <text
                        x={roomX + roomW / 2}
                        y={roomY + roomH * 0.35}
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize="2.4"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {room.name.length > 18 ? room.name.substring(0, 16) + '…' : room.name}
                      </text>

                      {/* Area and metric label */}
                      <text
                        x={roomX + roomW / 2}
                        y={roomY + roomH * 0.55}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="1.8"
                        className="pointer-events-none"
                      >
                        {room.areaSqM} m² • {rm?.wattDensityPerSqM || 0} W/m²
                      </text>

                      {/* Equipment badge */}
                      <text
                        x={roomX + roomW / 2}
                        y={roomY + roomH * 0.75}
                        textAnchor="middle"
                        fill={isSelected ? '#38bdf8' : '#cbd5e1'}
                        fontSize="1.7"
                        fontWeight="600"
                        className="pointer-events-none"
                      >
                        ⚡ {rm?.applianceCount || 0} units • {Math.round(rm?.monthlyTotalKwh || 0)} kWh
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Room Inspection Drawer */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col justify-between">
          {selectedRoom && selectedRoomMetrics ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                  Zone Inspection: Floor {selectedRoom.floor}
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedRoom.name}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Type: {selectedRoom.type.toUpperCase()} • Area: {selectedRoom.areaSqM} m² • Capacity:{' '}
                  {selectedRoom.occupancyCapacity} persons
                </div>
              </div>

              {/* Zone Metrics Quick Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">Power Density</div>
                  <div className="text-base font-bold text-cyan-300 mt-0.5">
                    {selectedRoomMetrics.wattDensityPerSqM} <span className="text-xs font-normal">W/m²</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">Monthly Cost</div>
                  <div className="text-base font-bold text-emerald-300 mt-0.5">
                    {activeFacility.currencySymbol}
                    {selectedRoomMetrics.monthlyCost.toFixed(2)}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">Monthly Energy</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {selectedRoomMetrics.monthlyTotalKwh.toLocaleString()} <span className="text-xs font-normal">kWh</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">Annual Intensity</div>
                  <div className="text-base font-bold text-purple-300 mt-0.5">
                    {selectedRoomMetrics.energyIntensityKwhPerSqM} <span className="text-xs font-normal">kWh/m²</span>
                  </div>
                </div>
              </div>

              {/* Connected Appliances List */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Assigned Equipment ({roomAppliances.length})</span>
                </div>

                {roomAppliances.length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-850/60 text-xs text-slate-400 text-center">
                    No equipment currently assigned to this room.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {roomAppliances.map(app => (
                      <div
                        key={app.id}
                        className="p-2 rounded-lg bg-slate-850 border border-slate-750 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{app.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {app.ratedWatts}W × {app.quantity} • {app.operatingHoursPerDay}h/day
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-medium">
                            {Math.round((app.ratedWatts * app.quantity * app.operatingHoursPerDay * 30 * app.utilizationFactor) / 1000)} kWh
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase">{app.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-400 my-auto">
              <Box className="w-10 h-10 mx-auto mb-2 text-cyan-500/40" />
              <h4 className="text-sm font-semibold text-slate-200">Zone Inspector</h4>
              <p className="text-xs mt-1">
                Click on any room in the floor plan to inspect connected equipment, power density, and energy costs.
              </p>
            </div>
          )}

          {/* Bottom quick tips */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Tip: Rooms highlighted in orange or red exceed recommended office power densities (45+ W/m²).
          </div>
        </div>
      </div>

      {/* Add Zone Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Floor {selectedFloor} Zone</h3>
            <p className="text-xs text-slate-400 mb-4">
              Create a new room in {activeFacility.name} for spatial energy modeling.
            </p>

            <form onSubmit={handleAddRoom} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Studio Alpha"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Floor Area (m²)</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={newRoomArea}
                    onChange={e => setNewRoomArea(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Room Category</label>
                  <select
                    value={newRoomType}
                    onChange={e => setNewRoomType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="office">Office / Open Space</option>
                    <option value="server_room">Server / IT Closet</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="conference">Conference Room</option>
                    <option value="cafeteria">Cafeteria / Kitchen</option>
                    <option value="warehouse">Warehouse / Utility</option>
                    <option value="common">Common / Lobby</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                >
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
