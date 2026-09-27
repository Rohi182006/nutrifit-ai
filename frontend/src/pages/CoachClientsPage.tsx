import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/client';
import {
  Users, Activity, Dumbbell, Utensils, Target,
  HeartHandshake, ShieldAlert, CheckCircle2, Bookmark, Plus, Edit3
} from 'lucide-react';

export const CoachClientsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('selected');
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(preselected ? Number(preselected) : null);
  const [clientDetail, setClientDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // Coach notes state
  const [coachNotes, setCoachNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // New Goal modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(4);
  const [goalUnit, setGoalUnit] = useState('workouts/week');

  const { showToast } = useStore();

  useEffect(() => {
    api.get('/coaches/clients')
      .then(res => {
        setClients(res.data);
        if (!selectedClientId && res.data.length > 0) {
          setSelectedClientId(res.data[0].client_id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadClientDetail = async (clientId: number) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/coaches/clients/${clientId}`);
      setClientDetail(data);
      setCoachNotes(data.client.notes || '');
    } catch (err: any) {
      if (err.response?.status === 403) {
        showToast('HTTP 403 Forbidden: You are not assigned to this client!', 'error');
      } else {
        showToast('Failed to load client details', 'error');
      }
      setClientDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      loadClientDetail(selectedClientId);
    }
  }, [selectedClientId]);

  const handleSaveNotes = async () => {
    if (!selectedClientId) return;
    setSavingNotes(true);
    try {
      await api.post(`/coaches/clients/${selectedClientId}/notes`, { notes: coachNotes });
      showToast('Coach notes saved to client record!', 'success');
    } catch (err) {
      showToast('Could not save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAssignGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    try {
      await api.post(`/coaches/clients/${selectedClientId}/goals`, {
        title: goalTitle,
        category: 'workout_consistency',
        target_value: Number(goalTarget),
        current_value: 0,
        unit: goalUnit,
      });
      showToast(`Assigned goal "${goalTitle}" to client!`, 'success');
      setShowGoalModal(false);
      setGoalTitle('');
      loadClientDetail(selectedClientId);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Could not assign goal', 'error');
    }
  };

  const simulateUnauthorizedAccess = async () => {
    // Attempt to query Ananya (id=4), which is unassigned to Sarah
    try {
      await api.get('/coaches/clients/4');
    } catch (err: any) {
      if (err.response?.status === 403) {
        showToast('Security Test Verified: Server returned HTTP 403 Forbidden for unassigned client!', 'error');
      } else {
        showToast('Query finished', 'info');
      }
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            Client Management Dossier
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Assigned <span className="text-gradient">Client Inspection</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Review detailed nutrition logs, workout volume, and assign personalized habits to your clients.
          </p>
        </div>

        {/* Security boundary verification button */}
        <button
          type="button"
          onClick={simulateUnauthorizedAccess}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 flex items-center gap-2 transition-colors shrink-0"
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          Test 403 Boundary (Security Check)
        </button>
      </div>

      {/* Client Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {clients.map(c => (
          <button
            key={c.client_id}
            onClick={() => setSelectedClientId(c.client_id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedClientId === c.client_id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {c.name}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {c.diet_type}
            </span>
          </button>
        ))}
      </div>

      {/* Client Detailed View */}
      {detailLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
        </div>
      ) : !clientDetail ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          Select an assigned client to inspect their wellness profile.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Profile Overview Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{clientDetail.client.name}</h2>
                <span className="text-xs text-slate-400">{clientDetail.client.email} • Age: {clientDetail.client.age || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {clientDetail.client.diet_type}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {clientDetail.client.cuisine} Cuisine
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {clientDetail.client.fitness_goal}
                </span>
              </div>
            </div>

            {/* Allergies & Avoidances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                  Registered Allergens:
                </span>
                <span className="text-rose-300 font-medium">
                  {clientDetail.client.allergies.length > 0 ? clientDetail.client.allergies.join(', ') : 'None registered'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                  Avoided Foods / Ingredients:
                </span>
                <span className="text-amber-300 font-medium">
                  {clientDetail.client.avoidances.length > 0 ? clientDetail.client.avoidances.join(', ') : 'None specified'}
                </span>
              </div>
            </div>

            {/* Coach Notes */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Coach Guidance &amp; Consultation Notes:</span>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </label>
              <textarea
                rows={3}
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="Enter client observations, protein distribution suggestions, or workout tweaks..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Activity, Nutrition & Workout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Workouts */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-cyan-400" />
                Recent Workouts ({clientDetail.workouts?.length || 0})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {clientDetail.workouts?.map((w: any) => (
                  <div key={w.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>{w.type}</span>
                      <span className="text-cyan-400">{w.duration}m</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(w.date).toLocaleDateString()} • {w.difficulty} Intensity
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Logs */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                Recent Nutrition Logs ({clientDetail.nutrition_logs?.length || 0})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {clientDetail.nutrition_logs?.map((m: any) => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>{m.food_name}</span>
                      <span className="text-emerald-400">{m.protein_g}g Protein</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {m.meal_type} • {m.calories} kcal • {new Date(m.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals & Assigning */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Client Goals
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGoalModal(true)}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Assign
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {clientDetail.goals?.map((g: any) => (
                  <div key={g.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="font-bold text-white block">{g.title}</span>
                    <span className="text-slate-400 text-[11px]">
                      Progress: {g.current} / {g.target} {g.unit} ({g.status})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl border border-slate-700 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Assign Goal to Client</h3>
            <form onSubmit={handleAssignGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. 70g Daily Vegetarian Protein Intake"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Target</label>
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400"
                >
                  Assign Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
