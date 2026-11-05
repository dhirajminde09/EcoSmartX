import React, { useState } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import { Facility } from '../../utils/energyEngine';
import { Building2, X } from 'lucide-react';

interface NewFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewFacilityModal: React.FC<NewFacilityModalProps> = ({ isOpen, onClose }) => {
  const { createFacility } = useEnergy();

  const [name, setName] = useState('');
  const [type, setType] = useState<Facility['type']>('commercial_office');
  const [location, setLocation] = useState('Seattle, WA (Grid: NWPP)');
  const [floorArea, setFloorArea] = useState('3500');
  const [occupancy, setOccupancy] = useState('120');
  const [floors, setFloors] = useState('2');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [emissionFactor, setEmissionFactor] = useState('0.35');
  const [flatRate, setFlatRate] = useState('0.15');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createFacility({
      name: name.trim(),
      type,
      location: location.trim(),
      floorAreaSqM: Math.max(10, parseFloat(floorArea) || 1000),
      occupancy: Math.max(1, parseInt(occupancy, 10) || 50),
      floors: Math.max(1, parseInt(floors, 10) || 1),
      currency: 'USD',
      currencySymbol: currencySymbol || '$',
      timezone: 'America/Los_Angeles',
      emissionFactorKgCo2PerKwh: Math.max(0.01, parseFloat(emissionFactor) || 0.35),
      tariff: {
        id: `tariff-${Date.now()}`,
        name: 'Commercial Standard Flat Rate',
        type: 'flat',
        flatRate: parseFloat(flatRate) || 0.15,
        fixedMonthlyCharge: 80,
      },
      rooms: [
        {
          id: `room-${Date.now()}-1`,
          name: 'Main Operations Floor',
          floor: 1,
          areaSqM: Math.round((parseFloat(floorArea) || 1000) * 0.7),
          type: 'office',
          occupancyCapacity: Math.round((parseInt(occupancy, 10) || 50) * 0.8),
          x: 10,
          y: 15,
          width: 50,
          height: 60,
        },
        {
          id: `room-${Date.now()}-2`,
          name: 'Utility & IT Core',
          floor: 1,
          areaSqM: Math.round((parseFloat(floorArea) || 1000) * 0.3),
          type: 'server_room',
          occupancyCapacity: 5,
          x: 65,
          y: 15,
          width: 25,
          height: 60,
        },
      ],
      appliances: [
        {
          id: `app-${Date.now()}-1`,
          name: 'Central Heat Pump Air Handler',
          category: 'hvac',
          roomId: `room-${Date.now()}-1`,
          ratedWatts: 18000,
          standbyWatts: 150,
          quantity: 1,
          operatingHoursPerDay: 12,
          operatingDaysPerWeek: 5,
          utilizationFactor: 0.75,
        },
        {
          id: `app-${Date.now()}-2`,
          name: 'High Efficiency LED Arrays',
          category: 'lighting',
          roomId: `room-${Date.now()}-1`,
          ratedWatts: 40,
          quantity: 60,
          operatingHoursPerDay: 10,
          operatingDaysPerWeek: 5,
          utilizationFactor: 0.85,
        },
      ],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Create New Facility</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-4 text-xs">
          <div>
            <label className="font-medium text-slate-300 block mb-1">Facility Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Pacific Northwest Distribution Hub"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-300 block mb-1">Facility Classification</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="commercial_office">Commercial Office</option>
                <option value="data_center">Data Center / Cloud</option>
                <option value="manufacturing">Manufacturing / Industrial</option>
                <option value="healthcare">Healthcare / Laboratory</option>
                <option value="educational">Educational Campus</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Location Label & Grid</label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-slate-300 block mb-1">Floor Area (m²)</label>
              <input
                type="number"
                min="10"
                required
                value={floorArea}
                onChange={e => setFloorArea(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Occupancy</label>
              <input
                type="number"
                min="1"
                required
                value={occupancy}
                onChange={e => setOccupancy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Floors</label>
              <input
                type="number"
                min="1"
                required
                value={floors}
                onChange={e => setFloors(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-slate-300 block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={e => setCurrencySymbol(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Grid CO₂ (kg/kWh)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={emissionFactor}
                onChange={e => setEmissionFactor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Base Rate ($/kWh)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={flatRate}
                onChange={e => setFlatRate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
            >
              Initialize Facility
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
