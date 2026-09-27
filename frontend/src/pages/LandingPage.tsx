import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/client';
import {
  Sparkles, ShieldCheck, Database, Award, ArrowRight,
  Activity, Utensils, HeartHandshake, CheckCircle2, ChevronRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setAuth, showToast } = useStore();
  const navigate = useNavigate();

  const handleQuickLogin = async (email: string, password: string, role: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.user, data.access_token, data.refresh_token);
      showToast(`Welcome! Signed in as ${data.user.full_name} (${role})`, 'success');
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'coach') navigate('/coach/dashboard');
      else navigate(data.user.has_completed_onboarding ? '/dashboard' : '/onboarding');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Quick login failed', 'error');
    }
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative pt-8 pb-12 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Driven Fitness &amp; Nutrition System
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Fitness, Nutrition &amp;{' '}
            <span className="text-gradient">Protein Recommendation</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Convert your client profile, fitness data, dietary boundaries, and verified nutrition composition tables into transparent, explainable protein food recommendations.
          </p>

          {/* Core concept banner */}
          <div className="p-3.5 rounded-2xl glass-panel max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-300">
            <span className="text-emerald-400">CLIENT PROFILE</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-cyan-400">FITNESS DATA</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-purple-400">FOOD PREFERENCES</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-emerald-400">NUTRITION ANALYSIS</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-amber-400">AI RECOMMENDATION</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-rose-400">PROGRESS TRACKING</span>
          </div>

          {/* Quick CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-105"
            >
              Start Client Onboarding
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl font-semibold text-slate-200 glass-panel hover:bg-slate-800 transition-all border border-slate-700"
            >
              Sign In to Account
            </Link>
          </div>
        </div>

        {/* 3D Developer Lab Interactive Portfolio Showcase Banner */}
        <div className="max-w-4xl mx-auto mt-10 px-4">
          <Link
            to="/portfolio"
            className="block p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/50 hover:border-cyan-400 shadow-2xl shadow-cyan-500/10 transition-all group"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>3D VISUAL STUDIO WORKSPACE // ROHITH U.</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                  Explore Rohith U.'s 3D AI &amp; Data Science Laboratory
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Interactive WebGL 3D workspace with floating code monitor, neural network sphere, and live telemetry.
                </p>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono tracking-wider flex items-center gap-2 shrink-0 group-hover:scale-105 transition-transform shadow-lg shadow-cyan-500/25">
                <span>LAUNCH 3D LAB</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 1-Click Interactive Demo Role Switcher */}
      <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl max-w-4xl mx-auto">
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Experience All 3 Roles Instantly</h2>
          <p className="text-sm text-slate-400">
            One-click interactive demo access for immediate role evaluation:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Client Card */}
          <div className="glass-card p-5 rounded-xl border border-emerald-500/30 flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                  Client Role
                </span>
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-base">Rohith Kumar</h3>
              <p className="text-xs text-slate-400 mt-1">
                Vegetarian, Indian Cuisine, Moderate activity. Access recommendations, log workouts &amp; meals.
              </p>
            </div>
            <button
              onClick={() => handleQuickLogin('client.rohith@nutrifit.ai', 'Client@123', 'client')}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors"
            >
              Test as Client &rarr;
            </button>
          </div>

          {/* Coach Card */}
          <div className="glass-card p-5 rounded-xl border border-cyan-500/30 flex flex-col justify-between space-y-4 hover:border-cyan-400 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-cyan-500/20 text-cyan-300">
                  Coach Role
                </span>
                <HeartHandshake className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-bold text-white text-base">Sarah Jenkins, CSCS</h3>
              <p className="text-xs text-slate-400 mt-1">
                Assigned to Rohith. Reviews nutrition &amp; workouts, assigns goals. Strict coach boundary enforced.
              </p>
            </div>
            <button
              onClick={() => handleQuickLogin('coach.sarah@nutrifit.ai', 'Coach@123', 'coach')}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors"
            >
              Test as Coach &rarr;
            </button>
          </div>

          {/* Admin Card */}
          <div className="glass-card p-5 rounded-xl border border-purple-500/30 flex flex-col justify-between space-y-4 hover:border-purple-400 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-purple-500/20 text-purple-300">
                  Admin Role
                </span>
                <ShieldCheck className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-white text-base">Dr. Alex Rivera</h3>
              <p className="text-xs text-slate-400 mt-1">
                Manage recommendation weights, food database, coach-client assignments, and view audit logs.
              </p>
            </div>
            <button
              onClick={() => handleQuickLogin('admin@nutrifit.ai', 'Admin@123', 'admin')}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-colors"
            >
              Test as Admin &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Core Architectural Highlights */}
      <section className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Engineering &amp; Intelligence Pillars</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Built from first principles for explainability, data verification, and clinical safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Verified Nutrition Dataset</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every seeded food item draws macro values from the <strong>Indian Food Composition Tables (IFCT)</strong> and <strong>USDA FoodData Central</strong>, with transparent data source tagging.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Explainable Recommendation AI</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              A 4-step hybrid pipeline (Hard Filter &rarr; Preference Match &rarr; Nutrition Density &rarr; Personalization) with dynamic weights stored in database rules and explicit "Why this food?" reasons.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Strict Boundary &amp; RBAC</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Server-enforced coach-to-client boundaries (HTTP 403 Forbidden for non-assigned clients), short-lived rotating JWT refresh tokens, and non-medical wellness safety guardrails.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
