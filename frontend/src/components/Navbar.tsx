import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  Sparkles, Activity, Dumbbell, Utensils, Target,
  TrendingUp, Compass, MessageSquare, Shield, Users,
  Sliders, LogOut, Menu, X, HeartHandshake, ChevronDown, BookOpen,
  QrCode, Copy, Check, ExternalLink
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };



  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-heading">
              NutriFit <span className="text-gradient">AI</span>
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium -mt-1">
              Intelligent Nutrition
            </span>
          </div>
        </Link>

        {/* 3D Lab Portfolio Shortcut */}
        <Link
          to="/portfolio"
          className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/20 hover:border-cyan-400 transition-all shadow-sm shadow-cyan-500/20 group"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>ROHITH U. // 3D DEV LAB</span>
          <span className="text-[10px] bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded font-black group-hover:scale-105 transition-transform">3D</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {user?.role === 'client' && (
            <>
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/dashboard')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                to="/onboarding"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/onboarding')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sliders className="w-4 h-4 text-emerald-400" />
                Personalization
              </Link>

              <Link
                to="/recommendations"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/recommendations')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                AI Recommend
              </Link>

              <Link
                to="/foods"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/foods')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Compass className="w-4 h-4" />
                Explore Foods
              </Link>

              <Link
                to="/food-comparison"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/food-comparison')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Compare
              </Link>

              <Link
                to="/workouts"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/workouts')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                Workouts
              </Link>

              <Link
                to="/nutrition"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/nutrition')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Utensils className="w-4 h-4" />
                Meals
              </Link>

              <Link
                to="/diet-plans"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/diet-plans')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Diet Plans
              </Link>

              <Link
                to="/goals"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/goals')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Target className="w-4 h-4" />
                Goals
              </Link>

              <Link
                to="/progress"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/progress')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Analytics
              </Link>

              <Link
                to="/assistant"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/assistant')
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                AI Assistant
              </Link>
            </>
          )}

          {user?.role === 'coach' && (
            <>
              <Link
                to="/coach/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/coach/dashboard')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-4 h-4" />
                Coach Hub
              </Link>
              <Link
                to="/coach/clients"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/coach/clients')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                My Assigned Clients
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link
                to="/admin/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/admin/dashboard')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                Admin Overview
              </Link>
              <Link
                to="/admin/foods"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/admin/foods')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Utensils className="w-4 h-4" />
                Manage Foods
              </Link>
              <Link
                to="/admin/users"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/admin/users')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4" />
                Users & Coaches
              </Link>
              <Link
                to="/admin/recommendation-rules"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/admin/recommendation-rules')
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sliders className="w-4 h-4 text-purple-400" />
                Rule Weights
              </Link>
            </>
          )}

          {!user && (
            <>
              <Link
                to="/foods"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/foods')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Compass className="w-4 h-4" />
                Explore Foods
              </Link>
              <Link
                to="/diet-plans"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/diet-plans')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Diet Plans
              </Link>
            </>
          )}
        </nav>


        {/* User Role Badge & Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 transition-all shadow-sm shadow-emerald-500/10 cursor-pointer"
            title="Scan Public Website QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Public QR Code</span>
          </button>


          {user ? (
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                user.role === 'admin'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : user.role === 'coach'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {user.role}
              </span>

              <span className="hidden sm:inline-block text-sm font-medium text-slate-200">
                {user.full_name}
              </span>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 px-4 py-1.5 rounded-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {user?.role === 'client' && (
            <>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Dashboard</Link>
              <Link to="/onboarding" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-emerald-400 font-semibold flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Personalization Setup
              </Link>
              <Link to="/recommendations" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-emerald-400">AI Recommendations</Link>
              <Link to="/foods" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Explore Foods</Link>
              <Link to="/food-comparison" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Compare Foods</Link>
              <Link to="/workouts" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Workouts</Link>
              <Link to="/nutrition" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Meals</Link>
              <Link to="/diet-plans" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-emerald-400">Diet Plans</Link>
              <Link to="/goals" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Goals</Link>
              <Link to="/progress" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Analytics</Link>
              <Link to="/assistant" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-cyan-400">AI Assistant</Link>
            </>
          )}
          {user?.role === 'coach' && (
            <>
              <Link to="/coach/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Coach Hub</Link>
              <Link to="/coach/clients" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-emerald-400">Assigned Clients</Link>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Admin Overview</Link>
              <Link to="/admin/foods" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Manage Foods</Link>
              <Link to="/admin/users" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Users</Link>
              <Link to="/admin/recommendation-rules" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-purple-400">Rule Weights</Link>
            </>
          )}
          {!user && (
            <>
              <Link to="/foods" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Explore Foods</Link>
              <Link to="/diet-plans" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-emerald-400">Diet Plans</Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300">Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-emerald-400">Register</Link>
            </>
          )}
        </div>
      )}

      {/* Public Website QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-md w-full space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    Public Website QR Code
                  </h3>
                  <p className="text-xs text-slate-400">
                    Scan with your mobile camera to open NutriFit AI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white text-xl p-1"
              >
                &times;
              </button>
            </div>

            {/* Public QR Code Card */}
            <div className="space-y-4 text-center">
              <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl mx-auto border-4 border-emerald-500/30">
                <img
                  src="/public_app_qr.png"
                  alt="Public Web App QR Code"
                  className="w-56 h-56 mx-auto object-contain"
                />
              </div>

              <div className="text-xs text-slate-300">
                <span className="font-bold text-white block text-sm mb-1.5">Public Live URL:</span>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-xs select-all">
                    https://nutrifit-hub.loca.lt
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy('https://nutrifit-hub.loca.lt', 'public-url')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copy URL"
                  >
                    {copiedText === 'public-url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href="https://nutrifit-hub.loca.lt"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Passcode Information */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">Localtunnel Passcode (Public IP):</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('106.195.34.131', 'public-pass')}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copiedText === 'public-pass' ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <code className="text-cyan-300 font-mono text-xs block">106.195.34.131</code>
                <p className="text-[11px] text-slate-400">
                  When prompted by localtunnel in the browser, paste this passcode to access the website.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </header>
  );
};

