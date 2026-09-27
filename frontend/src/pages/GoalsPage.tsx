import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { Goal } from '../types';
import { Target, Plus, CheckCircle2, TrendingUp, Award, Clock } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('workout_consistency');
  const [targetValue, setTargetValue] = useState(4.0);
  const [currentValue, setCurrentValue] = useState(0.0);
  const [unit, setUnit] = useState('sessions/week');

  const { showToast } = useStore();

  const loadGoals = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/goals/');
      setGoals(data);
    } catch (err) {
      showToast('Could not load wellness goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleUpdateProgress = async (goal: Goal, delta: number) => {
    const newVal = Math.max(0, Math.min(goal.target_value, goal.current_value + delta));
    try {
      const { data } = await api.put(`/goals/${goal.id}`, {
        current_value: newVal,
        status: newVal >= goal.target_value ? 'completed' : 'in_progress'
      });
      setGoals(goals.map(g => g.id === goal.id ? data : g));
      showToast('Goal progress updated!', 'success');
    } catch (err) {
      showToast('Could not update progress', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/goals/', {
        title,
        category,
        target_value: Number(targetValue),
        current_value: Number(currentValue),
        unit
      });
      setGoals([...goals, data]);
      showToast('Wellness goal created!', 'success');
      setShowModal(false);
      setTitle('');
    } catch (err) {
      showToast('Failed to create goal', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Target className="w-3.5 h-3.5" />
            Habit &amp; Consistency Tracking
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Wellness <span className="text-gradient">Goals &amp; Habits</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Focus on sustainable routine adherence, workout consistency, and balanced nutritional intake.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Goal
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 space-y-3">
          <Target className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No active goals found</h3>
          <p className="text-xs text-slate-400">Click "Create New Goal" to set a habit consistency target.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((g) => {
            const isCompleted = g.current_value >= g.target_value;
            return (
              <div
                key={g.id}
                className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded uppercase">
                      {g.category.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      isCompleted
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    }`}>
                      {isCompleted ? 'Target Achieved 🎉' : `${g.progress_percentage}% Done`}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-tight mt-1">{g.title}</h3>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mt-4">
                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                            : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>Current: <strong className="text-white">{g.current_value}</strong> {g.unit}</span>
                      <span>Target: <strong className="text-white">{g.target_value}</strong> {g.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Quick Increments */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Quick adjust:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateProgress(g, -1)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateProgress(g, 1)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30"
                    >
                      +1 {g.unit.includes('/') ? 'Session' : ''}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-md w-full space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Create Wellness Goal
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Maintain 4x Weekly Strength Workouts"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                  Goal Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="workout_consistency">Maintain workout consistency</option>
                  <option value="activity_consistency">Improve activity consistency</option>
                  <option value="balanced_food">Track balanced food choices</option>
                  <option value="regular_habits">Maintain regular wellness habits</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="sessions/week, %, steps"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs shadow-lg shadow-emerald-500/20"
              >
                Save Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
