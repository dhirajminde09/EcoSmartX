import React, { useState } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import {
  Trophy,
  CheckCircle2,
  Award,
  Plus,
  Flame,
  Zap,
  Leaf,
  Target,
  Sparkles,
} from 'lucide-react';

export const EcoChallenges: React.FC = () => {
  const { challenges, toggleChallenge, activeFacility, showNotification } = useEnergy();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTarget, setNewTarget] = useState('300');
  const [newBadge, setNewBadge] = useState('🌟 Eco Star');
  const [newCategory, setNewCategory] = useState('Efficiency');

  const completedCount = challenges.filter(c => c.completed).length;

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    challenges.push({
      id: `ch-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Internal sustainability milestone',
      targetKwhSaving: parseFloat(newTarget) || 200,
      badge: newBadge,
      category: newCategory,
      completed: false,
      progressPercent: 20,
    });

    showNotification(`Added new challenge "${newTitle}"`, 'success');
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>Sustainability Milestones & Gamification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Eco Challenges
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Engage facility operations teams with transparent conservation goals and operational badges
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold text-xs shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Eco Challenge</span>
        </button>
      </div>

      {/* Progress & Badge Showcase */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Challenges Completed</span>
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {completedCount} <span className="text-xs font-normal text-slate-400">/ {challenges.length} completed</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-yellow-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${challenges.length > 0 ? (completedCount / challenges.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Verified Savings Target</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {challenges.reduce((sum, c) => sum + (c.completed ? c.targetKwhSaving : 0), 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">kWh/mo</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            From verified milestone milestones achieved
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Operational Integrity Status</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-purple-300 mt-1">
            Transparently Audited
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Distinguishes simulated estimates from verified data
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map(ch => (
          <div
            key={ch.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              ch.completed
                ? 'bg-yellow-950/20 border-yellow-700/50 shadow-md'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-750'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {ch.category}
                </span>

                <div className="text-xs font-bold text-yellow-400">
                  {ch.badge}
                </div>
              </div>

              <h3 className="text-base font-bold text-white mt-2.5">{ch.title}</h3>
              <p className="text-xs text-slate-300 mt-1">{ch.description}</p>

              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progress:</span>
                  <span className="font-bold text-white">{ch.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden border border-slate-750">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      ch.completed ? 'bg-yellow-400' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${ch.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Target: {ch.targetKwhSaving} kWh/month reduction</span>
                <span className="text-[10px] text-slate-500 uppercase">
                  {ch.completed ? 'Verified' : 'In Progress'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => toggleChallenge(ch.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  ch.completed
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{ch.completed ? 'Milestone Completed' : 'Mark as Completed'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Challenge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create Eco Challenge</h3>
            <p className="text-xs text-slate-400 mb-4">
              Set an actionable sustainability milestone for {activeFacility.name}.
            </p>

            <form onSubmit={handleCreateChallenge} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-300 block mb-1">Challenge Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100% LED Weekend Blackout"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="font-medium text-slate-300 block mb-1">Description & Objective</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="e.g. Ensure all non-essential lighting is de-energized over weekends"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-300 block mb-1">Target Monthly kWh</label>
                  <input
                    type="number"
                    min="10"
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-300 block mb-1">Badge Title</label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={e => setNewBadge(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-semibold bg-yellow-500 hover:bg-yellow-400 text-slate-950"
                >
                  Create Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
