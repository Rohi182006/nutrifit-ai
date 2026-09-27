import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { NutritionLog, FoodItem } from '../types';
import { Utensils, Plus, Trash2, Calendar, Sparkles, CheckCircle2, BookOpen, ArrowRight } from 'lucide-react';


export const NutritionPage: React.FC = () => {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  // Form State
  const [mealType, setMealType] = useState('Lunch');
  const [selectedFoodId, setSelectedFoodId] = useState<number | ''>('');
  const [customFoodName, setCustomFoodName] = useState('');
  const [servingQty, setServingQty] = useState(1.0);
  const [servingUnit, setServingUnit] = useState('serving');
  const [proteinG, setProteinG] = useState(15.0);
  const [calories, setCalories] = useState(250.0);
  const [notes, setNotes] = useState('');

  const { showToast } = useStore();

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, foodsRes] = await Promise.all([
        api.get('/nutrition/'),
        api.get('/foods/?limit=60')
      ]);
      setLogs(logsRes.data);
      setAvailableFoods(foodsRes.data);
    } catch (err) {
      showToast('Could not load meals data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFoodSelect = (foodId: number) => {
    setSelectedFoodId(foodId);
    const found = availableFoods.find(f => f.id === foodId);
    if (found && found.nutrition) {
      setProteinG(Math.round(found.nutrition.protein_g * servingQty * 10) / 10);
      setCalories(Math.round(found.nutrition.calories * servingQty * 10) / 10);
      setServingUnit(found.serving_description);
    }
  };

  const handleQtyChange = (qty: number) => {
    setServingQty(qty);
    if (selectedFoodId) {
      const found = availableFoods.find(f => f.id === selectedFoodId);
      if (found && found.nutrition) {
        setProteinG(Math.round(found.nutrition.protein_g * qty * 10) / 10);
        setCalories(Math.round(found.nutrition.calories * qty * 10) / 10);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/nutrition/', {
        meal_type: mealType,
        food_item_id: selectedFoodId || null,
        custom_food_name: customFoodName || null,
        serving_quantity: Number(servingQty),
        serving_unit: servingUnit,
        protein_g: Number(proteinG),
        calories: Number(calories),
        notes,
      });

      showToast('Meal logged successfully!', 'success');
      setShowLogModal(false);
      setSelectedFoodId('');
      setCustomFoodName('');
      setNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to log meal', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/nutrition/${id}`);
      setLogs(logs.filter(l => l.id !== id));
      showToast('Meal deleted', 'info');
    } catch (err) {
      showToast('Could not delete meal', 'error');
    }
  };

  const totalProteinToday = logs.reduce((acc, curr) => acc + (curr.protein_g || 0), 0);
  const totalCaloriesToday = logs.reduce((acc, curr) => acc + (curr.calories || 0), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Utensils className="w-3.5 h-3.5" />
            Balanced Meal Tracking
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Nutrition &amp; <span className="text-gradient-emerald">Meals Log</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Log your daily food choices to calibrate your personalization profile and track protein distribution.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="px-5 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log New Meal
        </button>
      </div>

      {/* Weight & Activity Diet Plan Reference Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Weight &amp; Activity Diet Planning Templates
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PDF Reference Dataset
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore 24 verified meal plans divided by weight category (50–60kg, 60–70kg, 70–80kg, 80–90kg) and 6 sports with 1-click meal logging.
            </p>
          </div>
        </div>

        <Link
          to="/diet-plans"
          className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5 transition-all hover:scale-105 shrink-0"
        >
          <span>View Diet Plans</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Today's Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Protein Logged
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-emerald-400">{Math.round(totalProteinToday * 10) / 10}</span>
            <span className="text-xs text-slate-400">grams</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Calories Logged
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-amber-400">{Math.round(totalCaloriesToday)}</span>
            <span className="text-xs text-slate-400">kcal</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Logged Entries
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-white">{logs.length}</span>
            <span className="text-xs text-slate-400">meals/snacks</span>
          </div>
        </div>
      </div>

      {/* Meals History List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 space-y-3">
          <Utensils className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No meals recorded yet</h3>
          <p className="text-xs text-slate-400">Click "Log New Meal" to record your food intake.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      {log.meal_type}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.log_date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">{log.food_name}</h3>
                  <span className="text-xs text-slate-400">
                    {log.serving_quantity} {log.serving_unit} {log.notes ? `• "${log.notes}"` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-400 block">
                    {log.protein_g}g Protein
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {log.calories} kcal
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(log.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Meal Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-lg w-full space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-400" />
                Log Meal &amp; Food Selection
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
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                  Meal Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setMealType(t)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border ${
                        mealType === t
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                  Select from Verified Food Database
                </label>
                <select
                  value={selectedFoodId}
                  onChange={(e) => handleFoodSelect(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Choose verified food or enter custom below --</option>
                  {availableFoods.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.nutrition?.protein_g}g protein / {f.serving_description})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedFoodId && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                    Custom Food Name
                  </label>
                  <input
                    type="text"
                    value={customFoodName}
                    onChange={(e) => setCustomFoodName(e.target.value)}
                    placeholder="e.g. Mixed Sprouts Salad"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                    Servings
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={servingQty}
                    onChange={(e) => handleQtyChange(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={proteinG}
                    onChange={(e) => setProteinG(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cooked with 1 tsp olive oil and coriander"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs shadow-lg shadow-emerald-500/20"
              >
                Log Meal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
