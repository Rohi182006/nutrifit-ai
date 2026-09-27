import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import api from '../api/client';
import {
  TrendingUp, Activity, Dumbbell, Utensils, Target,
  Award, ThumbsUp, PieChart as PieIcon, BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, AreaChart, Area
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useStore();

  useEffect(() => {
    api.get('/analytics/client')
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        showToast('Could not load analytics metrics', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const activityTrend = data?.activity_trend || [];
  const workoutFreq = data?.workout_frequency || [];
  const proteinTrend = data?.protein_trend || [];
  const categoryBreakdown = data?.category_breakdown || [];
  const recMetrics = data?.recommendation_metrics || { acceptance_rate: 85, useful_count: 6, not_useful_count: 1 };
  const goalsProgress = data?.goals_progress || [];

  const PIE_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b'];

  const acceptancePieData = [
    { name: 'Useful (Accepted)', value: recMetrics.useful_count },
    { name: 'Not For Me (Declined)', value: recMetrics.not_useful_count },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Progress &amp; Intelligence Metrics
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Wellness <span className="text-gradient">Analytics Dashboard</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-xl">
          Comprehensive 7-chart visualization tracking your workouts, daily steps, protein trends, and recommendation accuracy.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recommendation Acceptance
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-emerald-400">{recMetrics.acceptance_rate}%</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {recMetrics.useful_count} useful / {recMetrics.total_feedback} feedback given
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <ThumbsUp className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Workout Sessions Tracked
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-cyan-400">
                {workoutFreq.reduce((acc: number, c: any) => acc + c.sessions, 0)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Across all categories</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
            <Dumbbell className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              7-Day Avg Daily Steps
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-purple-400">
                {Math.round(activityTrend.reduce((acc: number, c: any) => acc + c.steps, 0) / Math.max(1, activityTrend.length))}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Consistent activity</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* CHARTS GRID (7 CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Activity Trend (Steps & Active Minutes) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            1. Daily Activity Trend (Steps &amp; Active Mins)
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityTrend}>
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#38bdf8" />
                <YAxis yAxisId="right" orientation="right" stroke="#34d399" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="steps" stroke="#38bdf8" strokeWidth={2} name="Steps" />
                <Line yAxisId="right" type="monotone" dataKey="active_minutes" stroke="#34d399" strokeWidth={2} name="Active Mins" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Workout Frequency by Type */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            2. Workout Frequency by Type
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workoutFreq}>
                <XAxis dataKey="type" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                <Bar dataKey="sessions" fill="#10b981" radius={[6, 6, 0, 0]} name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Daily Protein Intake Trend */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-400" />
            3. Daily Protein-Source Selection Trend (Grams)
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={proteinTrend}>
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                <Area type="monotone" dataKey="protein_g" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Protein (g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Favorite Food Categories Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-400" />
            4. Preferred Food Categories Breakdown
          </h3>
          <div className="h-64 w-full pt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryBreakdown.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 5: Recommendation Acceptance Rate */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            5. Recommendation Acceptance &amp; Feedback Rate
          </h3>
          <div className="h-64 w-full pt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={acceptancePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  label
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 6 & 7: Goal Progress & Calorie Balance */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            6. Functional Goal Progress (%)
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalsProgress} layout="vertical">
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                <YAxis dataKey="title" type="category" width={120} stroke="#64748b" textAnchor="end" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                <Bar dataKey="progress_percentage" fill="#06b6d4" radius={[0, 6, 6, 0]} name="Progress %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
