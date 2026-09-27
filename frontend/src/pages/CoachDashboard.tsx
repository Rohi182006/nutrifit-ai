import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/client';
import {
  HeartHandshake, Users, Activity, Target, ShieldCheck,
  ChevronRight, Calendar, ArrowRight, Utensils
} from 'lucide-react';

export const CoachDashboard: React.FC = () => {
  const { user } = useStore();
  const [assignedClients, setAssignedClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/coaches/clients')
      .then(res => setAssignedClients(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            Coach Management Portal
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Coach Hub — <span className="text-gradient">Welcome, {user?.full_name}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Monitor workout adherence, nutrition logs, and goal progress for your <strong>assigned clients only</strong>.
          </p>
        </div>

        <Link
          to="/coach/clients"
          className="px-5 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 shrink-0"
        >
          View Client Dossiers &rarr;
        </Link>
      </div>

      {/* Metrics Row (Section 24) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Assigned Clients
          </span>
          <div className="text-3xl font-black text-white mt-1">
            {assignedClients.length}
          </div>
          <span className="text-[11px] text-cyan-400 mt-1 block">Scoped to coach_clients</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Status
          </span>
          <div className="text-3xl font-black text-emerald-400 mt-1">
            {assignedClients.filter(c => c.status === 'active').length}
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">In active consultation</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Data Boundaries
          </span>
          <div className="text-base font-bold text-purple-400 mt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            API RBAC Enforced
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">403 on unassigned queries</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Specialization
          </span>
          <div className="text-sm font-bold text-white mt-2 truncate">
            Sports Nutrition
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Plant-forward recovery</span>
        </div>
      </div>

      {/* Assigned Clients Table (Section 24) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Your Assigned Clients
          </h2>
          <span className="text-xs text-slate-400">
            Enforced at API/authorization layer
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
          </div>
        ) : assignedClients.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            No clients currently assigned. Contact an administrator to allocate clients to your roster.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Diet Preference</th>
                  <th className="py-3 px-4">Wellness Goal</th>
                  <th className="py-3 px-4">Activity Level</th>
                  <th className="py-3 px-4">Assigned Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {assignedClients.map((client) => (
                  <tr key={client.assignment_id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {client.name}
                      <span className="block text-xs font-normal text-slate-400">{client.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {client.diet_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-200">
                      {client.fitness_goal}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {client.activity_level}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(client.assigned_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/coach/clients?selected=${client.client_id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors inline-flex items-center gap-1"
                      >
                        Inspect Dossier
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
