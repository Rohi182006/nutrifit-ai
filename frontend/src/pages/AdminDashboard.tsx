import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/client';
import {
  Shield, Users, Utensils, Sparkles, Sliders,
  CheckCircle2, FileText, ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useStore();

  useEffect(() => {
    Promise.all([
      api.get('/admin/system-analytics'),
      api.get('/admin/audit-logs?limit=10')
    ])
      .then(([analyticsRes, logsRes]) => {
        setAnalytics(analyticsRes.data);
        setAuditLogs(logsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const PIE_COLORS = ['#10b981', '#06b6d4', '#a855f7', '#f59e0b'];

  const dietData = analytics?.diet_distribution ? [
    { name: 'Vegetarian', value: analytics.diet_distribution['Vegetarian'] || 0 },
    { name: 'Vegan', value: analytics.diet_distribution['Vegan'] || 0 },
    { name: 'Eggetarian', value: analytics.diet_distribution['Eggetarian'] || 0 },
    { name: 'Non-Vegetarian', value: analytics.diet_distribution['Non-Vegetarian'] || 0 },
  ] : [];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            System Administration
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Admin <span className="text-gradient">Command Console</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Audit logs, platform KPIs, algorithm weights tuning, and verified nutrition database administration.
          </p>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/recommendation-rules"
            className="px-4 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
          >
            <Sliders className="w-4 h-4" />
            Tuning Rule Weights
          </Link>
          <Link
            to="/admin/foods"
            className="px-4 py-2.5 rounded-xl font-semibold text-slate-200 glass-card hover:bg-slate-800 text-xs flex items-center gap-1.5 border border-slate-700"
          >
            <Utensils className="w-4 h-4 text-emerald-400" />
            Manage Foods
          </Link>
          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-xl font-semibold text-slate-200 glass-card hover:bg-slate-800 text-xs flex items-center gap-1.5 border border-slate-700"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            User Roles &amp; Coaches
          </Link>
        </div>
      </div>

      {/* KPI Cards (Section 25) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
          <div className="text-2xl font-black text-white mt-1">{analytics?.total_users || 0}</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clients</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{analytics?.total_clients || 0}</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Coaches</span>
          <div className="text-2xl font-black text-cyan-400 mt-1">{analytics?.total_coaches || 0}</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Food Catalog</span>
          <div className="text-2xl font-black text-purple-400 mt-1">{analytics?.total_food_items || 0}</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recommendations</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{analytics?.recommendations_generated || 0}</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Acceptance</span>
          <div className="text-2xl font-black text-teal-400 mt-1">{analytics?.recommendation_acceptance_rate || 80}%</div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diet Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-400" />
            Client Diet Distribution
          </h3>
          <div className="h-64 w-full pt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dietData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }: any) => `${name}: ${value}`}
                >
                  {dietData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Food Categories */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Food Items per Category in Database
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.top_categories || []}>
                <XAxis dataKey="category" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Food Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Audit Logs Table (Section 25 & 26) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Security &amp; Administration Audit Logs
          </h2>
          <span className="text-xs text-slate-400">Timestamped operations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Actor Email</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-xs">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 font-semibold text-purple-300">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-400">{log.user_email}</td>
                  <td className="py-2.5 px-3 text-slate-300">{log.entity_type} #{log.entity_id}</td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">{log.details}</td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
