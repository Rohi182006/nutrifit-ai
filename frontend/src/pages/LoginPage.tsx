import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { Lock, Mail, Sparkles, ArrowRight, ShieldCheck, HeartHandshake, User as UserIcon } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth, showToast } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPass,
      });

      setAuth(data.user, data.access_token, data.refresh_token);
      showToast(`Welcome back, ${data.user.full_name}!`, 'success');

      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'coach') {
        navigate('/coach/dashboard');
      } else {
        navigate(data.user.has_completed_onboarding ? '/dashboard' : '/onboarding');
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(undefined, demoEmail, demoPass);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 mx-auto shadow-lg shadow-emerald-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Sign In to NutriFit AI</h1>
        <p className="text-sm text-slate-400">Access your personalized wellness &amp; protein recommendation system</p>
      </div>

      {/* 1-Click Quick Demo Sign In */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-center">
          Instant Demo Sign In:
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemo('client.rohith@nutrifit.ai', 'Client@123')}
            className="py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 flex flex-col items-center gap-1 transition-all"
          >
            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
            Client (Rohith)
          </button>
          <button
            type="button"
            onClick={() => fillDemo('coach.sarah@nutrifit.ai', 'Coach@123')}
            className="py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[11px] font-semibold text-cyan-300 flex flex-col items-center gap-1 transition-all"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-cyan-400" />
            Coach (Sarah)
          </button>
          <button
            type="button"
            onClick={() => fillDemo('admin@nutrifit.ai', 'Admin@123')}
            className="py-1.5 px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-[11px] font-semibold text-purple-300 flex flex-col items-center gap-1 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            Admin (Alex)
          </button>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={(e) => handleLogin(e)} className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nutrifit.ai"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-xs text-slate-400 pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4">
            Register Client Account
          </Link>
        </p>
      </form>
    </div>
  );
};
