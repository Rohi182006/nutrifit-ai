import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/client';
import {
  Activity, Dumbbell, Utensils, Target, Sparkles,
  ArrowRight, Flame, Heart, Compass, CheckCircle2,
  TrendingUp, Award, Clock, Sliders, BookOpen
} from 'lucide-react';


export const ClientDashboard: React.FC = () => {
  const { user, profile } = useStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clients/dashboard')
      .then(res => setDashboardData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const overview = dashboardData?.today_overview || {};
  const proteinSuggestions = dashboardData?.protein_suggestions || [];
  const goals = dashboardData?.goals || [];
  const recentMeals = dashboardData?.recent_meals || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Greeting & Header (Section 5) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Live Wellness Overview
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {dashboardData?.greeting || `Hello, ${user?.full_name}`}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Track your daily wellness patterns, monitor functional goals, and discover verified high-protein foods tailored to your diet.
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/recommendations"
              className="px-4 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              Get AI Recommendations
            </Link>
            <Link
              to="/diet-plans"
              className="px-4 py-2.5 rounded-xl font-semibold text-slate-200 glass-card hover:bg-slate-800 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Weight &amp; Activity Diet Plans
            </Link>
            <Link
              to="/onboarding"
              className="px-4 py-2.5 rounded-xl font-semibold text-slate-200 glass-card hover:bg-slate-800 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Sliders className="w-4 h-4 text-purple-400" />
              Personalization Setup
            </Link>
            <Link
              to="/nutrition"
              className="px-4 py-2.5 rounded-xl font-semibold text-slate-200 glass-card hover:bg-slate-800 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Utensils className="w-4 h-4 text-emerald-400" />
              Log Meal
            </Link>
            <Link
              to="/workouts"
              className="px-4 py-2.5 rounded-xl font-semibold text-slate-200 glass-card hover:bg-slate-800 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              Log Workout
            </Link>
          </div>

        </div>
      </div>

      {/* ACTIVE PERSONALIZATION SETUP BANNER */}
      <section className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Active Personalization Profile</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Calibrated &amp; Active
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-400">
              <span>Goal: <strong className="text-slate-200">{profile?.preferences?.fitness_goal || 'General fitness'}</strong></span>
              <span>•</span>
              <span>Diet: <strong className="text-slate-200">{profile?.preferences?.diet_type || 'Vegetarian'}</strong></span>
              <span>•</span>
              <span>Cuisine: <strong className="text-slate-200">{profile?.preferences?.preferred_cuisine || 'Indian'}</strong></span>
              <span>•</span>
              <span>Activity: <strong className="text-slate-200">{profile?.preferences?.activity_level || 'Moderate'}</strong></span>
            </div>
          </div>
        </div>

        <Link
          to="/onboarding"
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto shrink-0 shadow-sm"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          Edit Personalization Setup
        </Link>
      </section>

      {/* TODAY'S OVERVIEW CARDS */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider text-xs text-slate-400">
          Today's Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Protein Intake */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Protein Logged
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-white">{overview.protein_consumed_g || 0}</span>
                <span className="text-xs text-slate-400">g today</span>
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                From {overview.meals_logged_count || 0} meals logged
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Utensils className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Steps & Movement */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Daily Steps
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-white">{overview.steps || 0}</span>
                <span className="text-xs text-slate-400">steps</span>
              </div>
              <span className="text-[11px] text-cyan-400 mt-1 block">
                {overview.active_minutes || 0} active minutes
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Workout Status */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Workout Status
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-white">
                  {overview.recent_workout ? overview.recent_workout.type : 'Rest Day'}
                </span>
              </div>
              <span className="text-[11px] text-purple-400 mt-1 block">
                {overview.recent_workout ? `${overview.recent_workout.duration} mins logged` : 'Ready for session'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Dumbbell className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Energy & Calories */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Calories Consumed
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-white">{overview.calories_consumed || 0}</span>
                <span className="text-xs text-slate-400">kcal</span>
              </div>
              <span className="text-[11px] text-amber-400 mt-1 block">
                ~{overview.calories_burned || 0} kcal burned
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
          </div>
        </div>
      </section>

      {/* AI FOOD RECOMMENDATIONS & PROTEIN SOURCES PREVIEW */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Top AI Protein Recommendations
            </h2>
            <p className="text-xs text-slate-400">
              Personalized based on your diet, cuisine, and verified IFCT/USDA nutrition tables.
            </p>
          </div>
          <Link
            to="/recommendations"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            View All Recommendations &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {proteinSuggestions.map((item: any) => (
            <div
              key={item.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all hover:translate-y-[-2px]"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <Award className="w-3 h-3" />
                    {item.match_score}% Match
                  </div>
                </div>

                <h3 className="font-bold text-white text-base leading-snug">{item.name}</h3>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                    {item.protein_g}g Protein
                  </span>
                  <span className="text-xs text-slate-400">/ {item.serving_description}</span>
                </div>

                {/* Explanation Snippet */}
                {item.explanation_points && item.explanation_points.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                    {item.explanation_points[0]}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{item.cuisine}</span>
                <Link
                  to="/recommendations"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ACTIVE GOALS & RECENT MEALS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Goals */}
        <section className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Active Goals
            </h2>
            <Link to="/goals" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">
              Manage &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {goals.map((g: any) => (
              <div key={g.id} className="p-3.5 rounded-xl glass-card border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{g.title}</span>
                  <span className="text-xs font-bold text-cyan-400">{g.progress_percentage}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Current: {g.current} {g.unit}</span>
                  <span>Target: {g.target} {g.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Meals */}
        <section className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-400" />
              Recent Meal Logs
            </h2>
            <Link to="/nutrition" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              View All Meals &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentMeals.length > 0 ? (
              recentMeals.map((m: any) => (
                <div key={m.id} className="p-3 rounded-xl glass-card border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                      {m.meal_type}
                    </span>
                    <span className="text-sm font-bold text-white block mt-0.5">{m.food_name}</span>
                    <span className="text-xs text-slate-400">{m.serving}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white block">{m.protein_g}g Protein</span>
                    <span className="text-xs text-slate-400">{m.calories} kcal</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No meals logged today yet. Click "Log Meal" above to record your breakfast, lunch, or snack!
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
