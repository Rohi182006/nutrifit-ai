import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { DietPlan, DietPlanWeightCategory, DietPlanCategoriesResponse } from '../types';
import {
  Utensils, Sparkles, Scale, Activity, Flame, Droplets,
  Calendar, Check, Plus, Info, Award, ShieldAlert,
  ArrowRight, Filter, ChevronRight, FileText, Download,
  Dumbbell, Trophy, Zap, Wind, CheckCircle2, Bookmark
} from 'lucide-react';

export const DietPlanPage: React.FC = () => {
  const [categoriesData, setCategoriesData] = useState<DietPlanCategoriesResponse | null>(null);
  const [selectedWeightRange, setSelectedWeightRange] = useState<string>('50–60 kg');
  const [selectedActivity, setSelectedActivity] = useState<string>('All');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('All');
  const [selectedGoal, setSelectedGoal] = useState<string>('Maintain');
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customWeightInput, setCustomWeightInput] = useState<string>('');
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<DietPlan | null>(null);
  const [viewMode, setViewMode] = useState<'focused' | 'grid'>('focused');
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [loggingMeal, setLoggingMeal] = useState<string | null>(null);

  const { showToast, user } = useStore();

  // Load Categories on mount
  useEffect(() => {
    api.get('/diet-plans/categories')
      .then(res => {
        setCategoriesData(res.data);
      })
      .catch(err => {
        console.error('Failed to load categories', err);
      });
  }, []);

  // Fetch plans whenever weight category, activity, activity_type or goal changes
  const fetchPlans = async (range: string, goal: string, act: string = selectedActivity, actType: string = selectedActivityType) => {
    setLoading(true);
    try {
      const params: any = {
        weight_range: range,
        goal: goal,
      };
      if (act && act !== 'All') params.activity = act;
      if (actType && actType !== 'All') params.activity_type = actType;

      const res = await api.get('/diet-plans/', { params });
      setPlans(res.data);

      if (res.data.length > 0) {
        // Keep currently selected activity if present, otherwise default to first
        const found = res.data.find((p: DietPlan) => p.activity === selectedPlanDetail?.activity);
        setSelectedPlanDetail(found || res.data[0]);
      } else {
        setSelectedPlanDetail(null);
      }
    } catch (err) {
      showToast('Could not fetch diet plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans(selectedWeightRange, selectedGoal, selectedActivity, selectedActivityType);
  }, [selectedWeightRange, selectedGoal, selectedActivity, selectedActivityType]);

  // Handle custom weight calculator / auto-matcher
  const handleCustomWeightChange = (val: string) => {
    setCustomWeightInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      let matched = '50–60 kg';
      if (num < 60) matched = '50–60 kg';
      else if (num < 70) matched = '60–70 kg';
      else if (num < 80) matched = '70–80 kg';
      else matched = '80–90 kg';

      if (matched !== selectedWeightRange) {
        setSelectedWeightRange(matched);
        showToast(`Auto-categorized into ${matched} based on ${num} kg`, 'info');
      }
    }
  };

  // Quick log meal into daily nutrition
  const handleLogMeal = async (plan: DietPlan, mealType: string, mealDescription: string, estimatedProtein: number, estimatedCalories: number) => {
    if (!user) {
      showToast('Please log in as a client to save meals into your daily log', 'error');
      return;
    }
    setLoggingMeal(`${plan.id}-${mealType}`);
    try {
      await api.post('/diet-plans/log-meal', {
        plan_id: plan.id,
        meal_type: mealType,
        custom_food_name: `${plan.activity}: ${mealDescription.split('+')[0].trim()}`,
        serving_quantity: 1.0,
        serving_unit: 'serving',
        protein_g: estimatedProtein,
        calories: estimatedCalories,
        notes: `From ${plan.weight_range} ${plan.activity} Plan (${mealType})`
      });
      showToast(`Logged ${mealType} to your daily nutrition log!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to log meal', 'error');
    } finally {
      setLoggingMeal(null);
    }
  };

  const getActivityIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'cricket':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'football':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'volleyball':
        return <Zap className="w-5 h-5 text-purple-400" />;
      case 'hockey':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'badminton':
        return <Wind className="w-5 h-5 text-cyan-400" />;
      case 'dumbbell':
      default:
        return <Dumbbell className="w-5 h-5 text-indigo-400" />;
    }
  };

  const weightCategories: DietPlanWeightCategory[] = categoriesData?.weight_categories || [
    { range: '50–60 kg', min_kg: 50, max_kg: 60, label: '50–60 kg', badge: 'Lightweight / Agile', baseline_calories: '1900–2150 kcal' },
    { range: '60–70 kg', min_kg: 60, max_kg: 70, label: '60–70 kg', badge: 'Standard Athletic', baseline_calories: '2200–2450 kcal' },
    { range: '70–80 kg', min_kg: 70, max_kg: 80, label: '70–80 kg', badge: 'Strength / Power', baseline_calories: '2500–2750 kcal' },
    { range: '80–90 kg', min_kg: 80, max_kg: 90, label: '80–90 kg', badge: 'Heavyweight / High Energy', baseline_calories: '2800–3100 kcal' }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                Verified Reference Dataset (Pages 1–14)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
                <Scale className="w-3 h-3" />
                App Logic: Weight → Activity → Goal
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Weight &amp; Activity <span className="text-gradient-emerald">Diet Plans</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Organized diet-planning templates divided by weight category, sports intensity, and goal logic. Designed to personalize meals according to body mass, training frequency, and metabolic demand.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPdfModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 glass-card hover:bg-slate-800 flex items-center gap-2 border border-slate-700 transition-all hover:scale-105"
            >
              <Info className="w-4 h-4 text-cyan-400" />
              PDF Data Specification
            </button>
            <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <input
                type="number"
                placeholder="Enter Weight (kg)..."
                value={customWeightInput}
                onChange={(e) => handleCustomWeightChange(e.target.value)}
                className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Weight Category Division (Mandatory Requirement) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              1. Select Weight Category Section
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Current Category: <strong className="text-emerald-400">{selectedWeightRange}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {weightCategories.map((wc) => {
            const isSelected = selectedWeightRange === wc.range;
            return (
              <button
                key={wc.range}
                type="button"
                onClick={() => setSelectedWeightRange(wc.range)}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-400/80 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                    : 'glass-panel border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {wc.badge}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {wc.range}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Baseline:</span>
                  <span className="font-semibold text-slate-300">{wc.baseline_calories}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sport & Goal Filters */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        {/* Goal Selector (App Logic: Weight -> Activity -> Goal) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Target Goal (App Logic: Weight → Activity → Goal)
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Calibrates portions &amp; caloric surplus/deficit according to your athletic objective.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'Gain', label: 'Muscle Gain / Surplus', icon: '⚡', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300' },
              { id: 'Maintain', label: 'Maintain / Performance', icon: '⚖️', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300' },
              { id: 'Loss', label: 'Fat Loss / Deficit', icon: '🔥', color: 'from-rose-500/20 to-pink-500/20 border-rose-500/40 text-rose-300' }
            ].map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGoal(g.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedGoal === g.id
                    ? `bg-gradient-to-r ${g.color} shadow-sm font-bold scale-105`
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="mr-1.5">{g.icon}</span>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity & Sports Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              Select Sport or Training Activity (From PDF Dataset)
            </span>
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('focused')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${viewMode === 'focused' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}
              >
                Single View
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}
              >
                Compare All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Cricket', 'Football', 'Volleyball', 'Hockey', 'Badminton', 'Bodybuilding'].map((act) => {
              const isSelected = selectedActivity === act;
              return (
                <button
                  key={act}
                  type="button"
                  onClick={() => {
                    setSelectedActivity(act);
                    if (act !== 'All') {
                      const match = plans.find(p => p.activity.toLowerCase() === act.toLowerCase());
                      if (match) setSelectedPlanDetail(match);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm scale-105'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {act !== 'All' && getActivityIcon(act)}
                  <span>{act}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Plans Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 space-y-3">
          <Utensils className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No matching diet plans found</h3>
          <p className="text-xs text-slate-400">Try changing the activity or weight filter.</p>
        </div>
      ) : viewMode === 'focused' && selectedPlanDetail ? (
        /* FOCUSED VIEW FOR SELECTED PLAN */
        <div className="space-y-6">
          {/* Main Hero Card for Selected Activity */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  {getActivityIcon(selectedPlanDetail.icon)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      {selectedPlanDetail.weight_range}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                      {selectedPlanDetail.activity_type}
                    </span>
                    <span className="text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-0.5 rounded-full">
                      Intensity: {selectedPlanDetail.activity_intensity}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {selectedPlanDetail.activity} Meal &amp; Nutrition Template
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Nutrition Priority: <strong className="text-slate-200">{selectedPlanDetail.nutrition_priority}</strong>
                  </p>
                </div>
              </div>

              {/* Dynamic Macro & Calorie Targets for Active Goal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shrink-0">
                <div className="px-3 py-1.5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Energy</span>
                  <span className="text-lg font-black text-amber-400">{selectedPlanDetail.target_calories}</span>
                  <span className="text-[10px] text-slate-500 block">kcal/day</span>
                </div>
                <div className="px-3 py-1.5 text-center border-l border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Protein</span>
                  <span className="text-lg font-black text-emerald-400">{selectedPlanDetail.target_protein_g}g</span>
                  <span className="text-[10px] text-slate-500 block">1.8-2.0g/kg</span>
                </div>
                <div className="px-3 py-1.5 text-center border-l border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Hydration</span>
                  <span className="text-lg font-black text-cyan-400">{selectedPlanDetail.water_liters_min}–{selectedPlanDetail.water_liters_max}</span>
                  <span className="text-[10px] text-slate-500 block">Liters/day</span>
                </div>
                <div className="px-3 py-1.5 text-center border-l border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Goal Mode</span>
                  <span className="text-sm font-bold text-white block mt-1">{selectedPlanDetail.active_goal}</span>
                  <span className="text-[10px] text-emerald-400 block">Calibrated</span>
                </div>
              </div>
            </div>

            {/* Goal Guidance Callout */}
            {selectedPlanDetail.goal_guidance && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/20 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs text-slate-300">
                  <strong className="text-white">Goal Strategy ({selectedPlanDetail.active_goal}):</strong> {selectedPlanDetail.goal_guidance}
                </div>
              </div>
            )}

            {/* Main Food Groups Pill List */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Main Recommended Food Groups:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {selectedPlanDetail.main_food_groups.split(',').map((group, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200"
                  >
                    🍴 {group.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Complete Daily Meals Timeline (6-Stage Schedule from PDF) */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                Structured Daily Meal Plan Schedule
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Breakfast */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        🌅 Breakfast
                      </span>
                      <span className="text-[11px] text-slate-500">Early Morning</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {selectedPlanDetail.breakfast}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">~25g protein • 450 kcal</span>
                    <button
                      type="button"
                      disabled={loggingMeal === `${selectedPlanDetail.id}-Breakfast`}
                      onClick={() => handleLogMeal(selectedPlanDetail, 'Breakfast', selectedPlanDetail.breakfast, 25, 450)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Log Meal
                    </button>
                  </div>
                </div>

                {/* 2. Mid-morning */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        🍎 Mid-Morning Snack
                      </span>
                      <span className="text-[11px] text-slate-500">10:30 AM</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {selectedPlanDetail.mid_morning}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">~6g protein • 200 kcal</span>
                    <button
                      type="button"
                      disabled={loggingMeal === `${selectedPlanDetail.id}-Mid-morning`}
                      onClick={() => handleLogMeal(selectedPlanDetail, 'Snack', selectedPlanDetail.mid_morning, 6, 200)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Log Meal
                    </button>
                  </div>
                </div>

                {/* 3. Lunch */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        🍛 Lunch
                      </span>
                      <span className="text-[11px] text-slate-500">1:00 PM</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {selectedPlanDetail.lunch}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">~35g protein • 600 kcal</span>
                    <button
                      type="button"
                      disabled={loggingMeal === `${selectedPlanDetail.id}-Lunch`}
                      onClick={() => handleLogMeal(selectedPlanDetail, 'Lunch', selectedPlanDetail.lunch, 35, 600)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Log Meal
                    </button>
                  </div>
                </div>

                {/* 4. Pre-training */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                        ⚡ Pre-Training / Game
                      </span>
                      <span className="text-[11px] text-slate-500">45-60 min prior</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {selectedPlanDetail.pre_training}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">~5g protein • 250 kcal (Carb focus)</span>
                    <button
                      type="button"
                      disabled={loggingMeal === `${selectedPlanDetail.id}-Pre-training`}
                      onClick={() => handleLogMeal(selectedPlanDetail, 'Snack', selectedPlanDetail.pre_training, 5, 250)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Log Meal
                    </button>
                  </div>
                </div>

                {/* 5. Post-training */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        🥛 Post-Training Recovery
                      </span>
                      <span className="text-[11px] text-slate-500">Within 30-45 min</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {selectedPlanDetail.post_training}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">~28g protein • 350 kcal</span>
                    <button
                      type="button"
                      disabled={loggingMeal === `${selectedPlanDetail.id}-Post-training`}
                      onClick={() => handleLogMeal(selectedPlanDetail, 'Snack', selectedPlanDetail.post_training, 28, 350)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Log Meal
                    </button>
                  </div>
                </div>

                {/* 6. Dinner */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        🌙 Dinner
                      </span>
                      <span className="text-[11px] text-slate-500">8:00 PM</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {selectedPlanDetail.dinner}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">~30g protein • 550 kcal</span>
                    <button
                      type="button"
                      disabled={loggingMeal === `${selectedPlanDetail.id}-Dinner`}
                      onClick={() => handleLogMeal(selectedPlanDetail, 'Dinner', selectedPlanDetail.dinner, 30, 550)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Log Meal
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Hydration & App Personalization Rules (Page 14 Database Structure) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              {/* Hydration Record */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Droplets className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Hydration Protocol</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedPlanDetail.hydration}
                </p>
                <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Fluid Range:</span>
                  <strong className="text-cyan-300">{selectedPlanDetail.water_liters_min} to {selectedPlanDetail.water_liters_max} Liters/day</strong>
                </div>
              </div>

              {/* Personalization & Portion Logic */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400">
                  <Award className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Portion Logic &amp; Calibration</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedPlanDetail.portion_logic}
                </p>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <strong className="text-slate-300">Inputs considered:</strong> {selectedPlanDetail.app_personalization}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GRID / COMPARISON VIEW FOR ALL 6 ACTIVITIES IN WEIGHT CATEGORY */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-500/5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      {getActivityIcon(plan.icon)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.activity}</h3>
                      <span className="text-[11px] text-slate-400">{plan.activity_type}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {plan.target_calories} kcal
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  <span className="text-slate-300 font-semibold">Priority:</span> {plan.nutrition_priority}
                </div>

                {/* Snippets of Breakfast & Lunch */}
                <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Breakfast:</span>
                    <p className="text-slate-300 line-clamp-2 mt-0.5">{plan.breakfast}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">Lunch:</span>
                    <p className="text-slate-300 line-clamp-2 mt-0.5">{plan.lunch}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlanDetail(plan);
                  setViewMode('focused');
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-emerald-400 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>View Full 6-Stage Meal Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PDF Reference Specification Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Document Architecture
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  Fitness Tracking App – Weight &amp; Activity Diet Data
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                This reference dataset organizes diet-planning templates by weight range and activity type, implementing the recommended structure from <strong>Page 14 of the reference PDF</strong>:
              </p>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
                <div className="text-emerald-400 font-bold">App Logic Flow:</div>
                <div>Weight Range → Activity → Goal → Personalized Meal Plan</div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">Weight Categories Supported:</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-400">50–60 kg</strong>: Agile / lightweight
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-400">60–70 kg</strong>: Standard athletic
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-400">70–80 kg</strong>: Strength / power
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-400">80–90 kg</strong>: Heavyweight / endurance
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">Activities Cataloged:</h4>
                <p>
                  Cricket, Football, Volleyball, Hockey, Badminton, Bodybuilding.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                <strong className="font-bold flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  PDF Implementation Note:
                </strong>
                <p>
                  "For a production app, have a qualified nutrition professional review the final calorie/portion rules, especially for minors, medical conditions, eating disorders, allergies, or sport-specific performance plans."
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPdfModal(false)}
              className="w-full py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 text-xs shadow-lg shadow-emerald-500/20"
            >
              Close Specification
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default DietPlanPage;
