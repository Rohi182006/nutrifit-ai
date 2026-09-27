import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useStore } from '../store/useStore';
import { ShieldAlert, Info, CheckCircle2, X } from 'lucide-react';

export const Layout: React.FC = () => {
  const { toast, clearToast } = useStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl glass-panel border border-slate-700/80 animate-fade-in">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toast.type === 'error' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
          <span className="text-sm font-medium text-white">{toast.message}</span>
          <button onClick={clearToast} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Non-Medical Disclaimer & Safety Boundary Footer (Section 38) */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 max-w-2xl">
            <Info className="w-4 h-4 text-amber-400/90 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Health & Wellness Boundary:</strong> NutriFit AI is an intelligent fitness, wellness, and protein food recommendation system. It is designed for general nutritional information and habit consistency only. The platform does not provide medical diagnoses, treatment plans, or clinical prescriptions. Always consult a licensed physician or registered clinical dietitian for medical conditions or specialized dietary needs.
            </p>
          </div>
          <div className="text-xs text-slate-400 whitespace-nowrap text-right">
            Verified Data: <span className="text-emerald-400 font-medium">IFCT</span> &amp; <span className="text-cyan-400 font-medium">USDA</span> Composition Tables
            <br />
            &copy; {new Date().getFullYear()} NutriFit AI Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
