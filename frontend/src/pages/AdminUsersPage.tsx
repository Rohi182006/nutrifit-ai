import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { Users, HeartHandshake, Shield, UserCheck, Plus, CheckCircle2 } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState<number | ''>('');
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [assignNotes, setAssignNotes] = useState('');

  const { showToast } = useStore();

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, assignRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/coach-assignments')
      ]);
      setUsers(usersRes.data);
      setAssignments(assignRes.data);
    } catch (err) {
      showToast('Could not load users and assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      showToast(`User role updated to ${newRole}`, 'success');
      loadData();
    } catch (err) {
      showToast('Could not update role', 'error');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoachId || !selectedClientId) {
      showToast('Please select both a coach and a client', 'error');
      return;
    }

    try {
      await api.post('/admin/coach-assignments', {
        coach_id: Number(selectedCoachId),
        client_id: Number(selectedClientId),
        notes: assignNotes
      });
      showToast('Coach-client assignment created!', 'success');
      setShowAssignModal(false);
      setSelectedCoachId('');
      setSelectedClientId('');
      setAssignNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Assignment failed', 'error');
    }
  };

  const coaches = users.filter(u => u.role === 'coach');
  const clients = users.filter(u => u.role === 'client');

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            User Roles &amp; Allocations
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Users &amp; <span className="text-gradient">Coach Assignments</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Manage user roles and allocate clients to specific coaches to enforce strict <code>coach_clients</code> data isolation.
          </p>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="px-5 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Assign Coach to Client
        </button>
      </div>

      {/* Coach-Client Assignments Table (Section 2 & 24 & 26) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-cyan-400" />
          Active Coach-to-Client Allocations ({assignments.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No active coach-client assignments. Click "Assign Coach to Client" above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Coach</th>
                  <th className="py-2.5 px-3">Assigned Client</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned Date</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 font-bold text-cyan-300">
                      {a.coach_name}
                      <span className="block text-[11px] font-normal text-slate-400">{a.coach_email}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {a.client_name}
                      <span className="block text-[11px] font-normal text-slate-400">{a.client_email}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                        a.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(a.assigned_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                      {a.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users Role Management Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          All Registered Users &amp; Roles
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-2.5 px-3">User Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Current Role</th>
                <th className="py-2.5 px-3">Diet / Goal</th>
                <th className="py-2.5 px-3 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-3 font-bold text-white">{u.full_name}</td>
                  <td className="py-3 px-3 text-slate-400">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-semibold uppercase text-[10px] ${
                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      u.role === 'coach' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {u.diet_type ? `${u.diet_type} (${u.fitness_goal})` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                    >
                      <option value="client">Client</option>
                      <option value="coach">Coach</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-cyan-400" />
              Assign Coach to Client
            </h3>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Select Coach</label>
                <select
                  required
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- Choose Coach --</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Select Client</label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Assignment / Consultation Notes</label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Vegetarian client targeting functional strength and high protein distribution."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
