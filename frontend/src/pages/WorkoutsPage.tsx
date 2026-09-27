import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { Workout, Exercise } from '../types';
import { Dumbbell, Plus, Calendar, Clock, Award, Trash2, Cpu, History, Sparkles } from 'lucide-react';
import { Fitness3DStudio } from '../components/Fitness3DStudio';

export const WorkoutsPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercisesCatalog, setExercisesCatalog] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeView, setActiveView] = useState<'studio' | 'history'>('studio');

  // Form State
  const [workoutType, setWorkoutType] = useState('Strength');
  const [duration, setDuration] = useState(35);
  const [difficulty, setDifficulty] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Array<{
    exercise_id: number;
    sets: number;
    reps: number;
    weight_kg: number;
  }>>([]);

  const { showToast } = useStore();

  const loadData = async () => {
    setLoading(true);
    try {
      const [workoutsRes, exRes] = await Promise.all([
        api.get('/workouts/'),
        api.get('/workouts/exercises')
      ]);
      setWorkouts(workoutsRes.data);
      setExercisesCatalog(exRes.data);
    } catch (err) {
      showToast('Could not load workout history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addExerciseRow = () => {
    if (exercisesCatalog.length > 0) {
      setSelectedExercises([
        ...selectedExercises,
        { exercise_id: exercisesCatalog[0].id, sets: 3, reps: 10, weight_kg: 0 }
      ]);
    }
  };

  const removeExerciseRow = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExerciseRow = (index: number, field: string, val: any) => {
    const updated = [...selectedExercises];
    (updated[index] as any)[field] = val;
    setSelectedExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/workouts/', {
        workout_type: workoutType,
        duration_minutes: Number(duration),
        difficulty,
        notes,
        exercises: selectedExercises,
      });

      showToast('Workout logged successfully!', 'success');
      setShowLogModal(false);
      setSelectedExercises([]);
      setNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to log workout', 'error');
    }
  };

  const handleStudioLog = async (exerciseName: string, sets: number, reps: number) => {
    try {
      const match = exercisesCatalog.find((e) => e.name.toLowerCase().includes(exerciseName.toLowerCase())) || exercisesCatalog[0];
      const exId = match ? match.id : 1;
      await api.post('/workouts/', {
        workout_type: match?.category || 'Strength',
        duration_minutes: 30,
        difficulty: 'Medium',
        notes: `Trained via 3D AI Visual Studio (${exerciseName})`,
        exercises: [{ exercise_id: exId, sets, reps, weight_kg: 0 }],
      });
      showToast(`Logged ${sets} sets of ${reps} reps for ${exerciseName}!`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to log workout from Studio', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Dumbbell className="w-3.5 h-3.5" />
            Fitness Consistency Tracker
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Workouts &amp; <span className="text-gradient">Activity Log</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Track functional movement patterns and training volume to calibrate protein recovery recommendations.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="px-5 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log New Workout
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveView('studio')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2.5 border ${
            activeView === 'studio'
              ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-500/15'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>3D AI Visual Studio</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold">
            Interactive 3D
          </span>
        </button>

        <button
          onClick={() => setActiveView('history')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2.5 border ${
            activeView === 'history'
              ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/15'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <History className="w-4 h-4 text-emerald-400" />
          <span>Workout History &amp; Logs</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
            {workouts.length} Sessions
          </span>
        </button>
      </div>

      {/* 3D AI VISUAL STUDIO VIEW */}
      {activeView === 'studio' && (
        <Fitness3DStudio onLogWorkout={handleStudioLog} />
      )}

      {/* Workout History List */}
      {activeView === 'history' && (
        <div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 space-y-3">
          <Dumbbell className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No workouts recorded yet</h3>
          <p className="text-xs text-slate-400">Click "Log New Workout" to record your physical session.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map((w) => (
            <div key={w.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{w.workout_type} Training</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{w.duration_minutes} minutes</span>
                      <span>•</span>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(w.workout_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  w.difficulty === 'High' ? 'bg-rose-500/20 text-rose-300' :
                  w.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {w.difficulty} Intensity
                </span>
              </div>

              {w.notes && (
                <p className="text-xs text-slate-300 italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  "{w.notes}"
                </p>
              )}

              {/* Exercises Performed */}
              {w.exercises && w.exercises.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Exercises Tracked:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {w.exercises.map((ex, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                        <span className="font-bold text-white block">{ex.exercise_name}</span>
                        <span className="text-slate-400">
                          {ex.sets} sets × {ex.reps} reps {ex.weight_kg > 0 ? `(${ex.weight_kg}kg)` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        </div>
      )}

      {/* Log Workout Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-cyan-400" />
                Log Workout Session
              </h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                    Workout Type
                  </label>
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Strength">Strength</option>
                    <option value="Running">Running</option>
                    <option value="Walking">Walking</option>
                    <option value="Cycling">Cycling</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Sports">Sports</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Mobility">Mobility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                  Difficulty / Intensity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map(d => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border ${
                        difficulty === d
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controlled Exercises Catalog Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 uppercase">
                    Exercises Performed (Catalog Linked)
                  </label>
                  <button
                    type="button"
                    onClick={addExerciseRow}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Exercise
                  </button>
                </div>

                {selectedExercises.map((row, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-2">
                    <select
                      value={row.exercise_id}
                      onChange={(e) => updateExerciseRow(idx, 'exercise_id', Number(e.target.value))}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      {exercisesCatalog.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscle_group})</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      placeholder="Sets"
                      value={row.sets}
                      onChange={(e) => updateExerciseRow(idx, 'sets', Number(e.target.value))}
                      className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    />

                    <input
                      type="number"
                      min={1}
                      placeholder="Reps"
                      value={row.reps}
                      onChange={(e) => updateExerciseRow(idx, 'reps', Number(e.target.value))}
                      className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    />

                    <button
                      type="button"
                      onClick={() => removeExerciseRow(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did you feel? Energy levels, recovery notes..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs shadow-lg shadow-emerald-500/20"
              >
                Save Workout
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
