import React, { useState } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import { Facility, Room } from '../../utils/energyEngine';
import {
  Building2,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  Users,
  Maximize,
  Coins,
  Globe,
  Leaf,
  Layers,
  Check,
} from 'lucide-react';

export const FacilitiesAndRooms: React.FC = () => {
  const {
    facilities,
    activeFacility,
    setActiveFacilityId,
    updateFacility,
    createFacility,
    deleteFacility,
    addRoom,
    updateRoom,
    deleteRoom,
    metrics,
  } = useEnergy();

  const [isEditingFacility, setIsEditingFacility] = useState(false);
  const [facilityName, setFacilityName] = useState(activeFacility.name);
  const [facilityLocation, setFacilityLocation] = useState(activeFacility.location);
  const [facilityArea, setFacilityArea] = useState(String(activeFacility.floorAreaSqM));
  const [facilityOccupancy, setFacilityOccupancy] = useState(String(activeFacility.occupancy));
  const [facilityFloors, setFacilityFloors] = useState(String(activeFacility.floors));
  const [facilityCurrencySymbol, setFacilityCurrencySymbol] = useState(activeFacility.currencySymbol);
  const [facilityEmissionFactor, setFacilityEmissionFactor] = useState(String(activeFacility.emissionFactorKgCo2PerKwh));

  // Room modal
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomFloor, setRoomFloor] = useState('1');
  const [roomArea, setRoomArea] = useState('200');
  const [roomType, setRoomType] = useState<Room['type']>('office');
  const [roomOccupancy, setRoomOccupancy] = useState('15');

  const handleSaveFacility = (e: React.FormEvent) => {
    e.preventDefault();
    updateFacility({
      ...activeFacility,
      name: facilityName.trim() || activeFacility.name,
      location: facilityLocation.trim() || activeFacility.location,
      floorAreaSqM: Math.max(10, parseFloat(facilityArea) || 1000),
      occupancy: Math.max(1, parseInt(facilityOccupancy, 10) || 50),
      floors: Math.max(1, parseInt(facilityFloors, 10) || 1),
      currencySymbol: facilityCurrencySymbol || '$',
      emissionFactorKgCo2PerKwh: Math.max(0.01, parseFloat(facilityEmissionFactor) || 0.4),
    });
    setIsEditingFacility(false);
  };

  const openAddRoomModal = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomFloor('1');
    setRoomArea('250');
    setRoomType('office');
    setRoomOccupancy('20');
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (room: Room) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRoomFloor(String(room.floor));
    setRoomArea(String(room.areaSqM));
    setRoomType(room.type);
    setRoomOccupancy(String(room.occupancyCapacity));
    setIsRoomModalOpen(true);
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: roomName.trim() || 'New Room',
      floor: parseInt(roomFloor, 10) || 1,
      areaSqM: Math.max(5, parseFloat(roomArea) || 100),
      type: roomType,
      occupancyCapacity: Math.max(1, parseInt(roomOccupancy, 10) || 10),
    };

    if (editingRoom) {
      updateRoom({ ...editingRoom, ...data });
    } else {
      addRoom(data);
    }
    setIsRoomModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Infrastructure Hierarchy</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Facilities & Zones Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure physical building envelopes, spatial parameters, and zone assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditingFacility ? (
            <button
              onClick={() => {
                setFacilityName(activeFacility.name);
                setFacilityLocation(activeFacility.location);
                setFacilityArea(String(activeFacility.floorAreaSqM));
                setFacilityOccupancy(String(activeFacility.occupancy));
                setFacilityFloors(String(activeFacility.floors));
                setFacilityCurrencySymbol(activeFacility.currencySymbol);
                setFacilityEmissionFactor(String(activeFacility.emissionFactorKgCo2PerKwh));
                setIsEditingFacility(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Building Parameters</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditingFacility(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
            >
              Cancel Edit
            </button>
          )}

          <button
            onClick={openAddRoomModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Zone / Room</span>
          </button>
        </div>
      </div>

      {/* Facility Details / Inline Editor */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        {isEditingFacility ? (
          <form onSubmit={handleSaveFacility} className="space-y-4 text-xs">
            <div className="font-bold text-sm text-emerald-400">Edit Building Specifications</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={facilityName}
                  onChange={e => setFacilityName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Location Label & Grid Subregion *</label>
                <input
                  type="text"
                  required
                  value={facilityLocation}
                  onChange={e => setFacilityLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Gross Floor Area (m²) *</label>
                <input
                  type="number"
                  min="10"
                  required
                  value={facilityArea}
                  onChange={e => setFacilityArea(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Design Occupancy</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={facilityOccupancy}
                  onChange={e => setFacilityOccupancy(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Number of Floors</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={facilityFloors}
                  onChange={e => setFacilityFloors(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Currency Symbol</label>
                <input
                  type="text"
                  required
                  value={facilityCurrencySymbol}
                  onChange={e => setFacilityCurrencySymbol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Grid CO₂ Factor (kg/kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={facilityEmissionFactor}
                  onChange={e => setFacilityEmissionFactor(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditingFacility(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Save Facility Specs
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Location</div>
                <div className="font-semibold text-slate-200">{activeFacility.location}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                <Maximize className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Gross Floor Area</div>
                <div className="font-semibold text-slate-200">
                  {activeFacility.floorAreaSqM.toLocaleString()} m² ({activeFacility.floors} Floors)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 text-purple-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Occupancy</div>
                <div className="font-semibold text-slate-200">{activeFacility.occupancy} persons</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 text-teal-400">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Grid Carbon Factor</div>
                <div className="font-semibold text-slate-200">
                  {activeFacility.emissionFactorKgCo2PerKwh} kg CO₂e/kWh
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zones / Rooms Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Configured Facility Zones ({activeFacility.rooms.length})</h2>
            <p className="text-xs text-slate-400">Rooms, thermal envelopes, and connected appliance allocations</p>
          </div>
          <span className="text-xs text-slate-400">
            Total Allocated Area: {activeFacility.rooms.reduce((s, r) => s + r.areaSqM, 0).toLocaleString()} m²
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Zone / Room</th>
                <th className="py-3 px-3">Floor</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Area (m²)</th>
                <th className="py-3 px-3 text-right">Equipment Units</th>
                <th className="py-3 px-3 text-right">Watt Density</th>
                <th className="py-3 px-3 text-right">Monthly Energy</th>
                <th className="py-3 px-3 text-right">Monthly Cost</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeFacility.rooms.map(room => {
                const rm = metrics.rooms.find(r => r.roomId === room.id);
                const appCount = activeFacility.appliances.filter(a => a.roomId === room.id).length;
                return (
                  <tr key={room.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{room.name}</div>
                      <div className="text-[10px] text-slate-400">Capacity: {room.occupancyCapacity} occupants</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">Floor {room.floor}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {room.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-200">
                      {room.areaSqM} m²
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-cyan-400">
                      {appCount} units
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-purple-400">
                      {rm?.wattDensityPerSqM || 0} W/m²
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-200">
                      {Math.round(rm?.monthlyTotalKwh || 0).toLocaleString()} kWh
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      {activeFacility.currencySymbol}
                      {rm?.monthlyCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditRoomModal(room)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Room"
                          aria-label={`Edit ${room.name}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteRoom(room.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Room"
                          aria-label={`Delete ${room.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              {editingRoom ? 'Edit Zone' : 'Add New Zone'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter zone physical bounds and usage classification.
            </p>

            <form onSubmit={handleRoomSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-300 block mb-1">Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conference Room Beta"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Floor Number *</label>
                  <input
                    type="number"
                    min="1"
                    max={activeFacility.floors}
                    required
                    value={roomFloor}
                    onChange={e => setRoomFloor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-300 block mb-1">Floor Area (m²) *</label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={roomArea}
                    onChange={e => setRoomArea(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Space Type *</label>
                  <select
                    value={roomType}
                    onChange={e => setRoomType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="office">Office / Open Space</option>
                    <option value="server_room">Server / IT Room</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="conference">Conference / Boardroom</option>
                    <option value="cafeteria">Cafeteria / Pantry</option>
                    <option value="warehouse">Warehouse / Industrial</option>
                    <option value="common">Common / Reception</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-300 block mb-1">Occupancy Capacity</label>
                  <input
                    type="number"
                    min="0"
                    value={roomOccupancy}
                    onChange={e => setRoomOccupancy(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {editingRoom ? 'Save Changes' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
