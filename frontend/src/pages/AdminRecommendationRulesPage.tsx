import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { RecommendationRule } from '../types';
import { Sliders, Save, CheckCircle2, RotateCcw, Sparkles, Shield } from 'lucide-react';

export const AdminRecommendationRulesPage: React.FC = () => {
  const [rules, setRules] = useState<RecommendationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const { showToast } = useStore();

  const loadRules = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/recommendation-rules');
      setRules(data);
    } catch (err) {
      showToast('Could not load recommendation rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleWeightChange = (id: number, newWeight: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, weight: newWeight } : r));
  };

  const handleActiveToggle = (id: number, current: boolean) => {
    setRules(rules.map(r => r.id === id ? { ...r, is_active: !current } : r));
  };

  const handleSaveRule = async (rule: RecommendationRule) => {
    setSavingId(rule.id);
    try {
      await api.put(`/admin/recommendation-rules/${rule.id}`, {
        weight: Number(rule.weight),
        is_active: rule.is_active,
      });
      showToast(`Updated weight for "${rule.rule_name}" to ${rule.weight}!`, 'success');
    } catch (err) {
      showToast('Failed to update rule', 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Live Formula Simulation Preview
  const sampleDietScore = 100;
  const sampleCuisineScore = 95;
  const samplePrefScore = 85;
  const sampleFeedbackScore = 80;
  const sampleNutrScore = 95;

  const dietWeight = rules.find(r => r.rule_key === 'diet_match_weight')?.weight || 1.0;
  const cuisineWeight = rules.find(r => r.rule_key === 'cuisine_match_weight')?.weight || 0.8;
  const prefWeight = rules.find(r => r.rule_key === 'preference_match_weight')?.weight || 0.9;
  const fbWeight = rules.find(r => r.rule_key === 'feedback_weight')?.weight || 0.85;
  const nutrWeight = rules.find(r => r.rule_key === 'nutrition_relevance_weight')?.weight || 0.95;

  const totalW = dietWeight + cuisineWeight + prefWeight + fbWeight + nutrWeight;
  const simulatedScore = Math.round(
    ((sampleDietScore * dietWeight) +
     (sampleCuisineScore * cuisineWeight) +
     (samplePrefScore * prefWeight) +
     (sampleFeedbackScore * fbWeight) +
     (sampleNutrScore * nutrWeight)) / totalW
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sliders className="w-3.5 h-3.5" />
            Configurable Scoring Weights (Section 9)
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Recommendation <span className="text-gradient">Rules Engine</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Tweak coefficient weights dynamically without code redeployment. Changes take effect on all client recommendation computations immediately.
          </p>
        </div>

        <button
          onClick={loadRules}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 glass-card hover:bg-slate-800 border border-slate-700 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Sliders
        </button>
      </div>

      {/* Live Formula Preview Box */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Live Scoring Formula Simulation (Sample Food: Paneer / Tofu)
          </span>
          <span className="text-sm font-extrabold text-emerald-400">
            Simulated Match Score: {simulatedScore}%
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-mono">
          Recommendation Score = (Diet × {dietWeight}) + (Cuisine × {cuisineWeight}) + (Preference × {prefWeight}) + (Feedback × {fbWeight}) + (Nutrition × {nutrWeight}) ÷ Total Weight ({totalW.toFixed(2)})
        </p>
      </div>

      {/* Rules Tuning Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1 max-w-lg">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{rule.rule_name}</h3>
                  <code className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-slate-800">
                    {rule.rule_key}
                  </code>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{rule.description}</p>
              </div>

              {/* Slider & Action */}
              <div className="flex items-center gap-6">
                <div className="w-48 space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Coefficient:</span>
                    <span className="text-purple-400 font-bold">{rule.weight.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.05"
                    value={rule.weight}
                    onChange={(e) => handleWeightChange(rule.id, Number(e.target.value))}
                    className="w-full accent-purple-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0.1 (Low)</span>
                    <span>1.0 (Normal)</span>
                    <span>2.0 (High)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleActiveToggle(rule.id, rule.is_active)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    rule.is_active
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {rule.is_active ? 'Active' : 'Disabled'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveRule(rule)}
                  disabled={savingId === rule.id}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingId === rule.id ? 'Saving...' : 'Apply Weight'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
