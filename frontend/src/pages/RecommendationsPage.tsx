import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { RecommendationItem } from '../types';
import {
  Sparkles, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck,
  Info, Award, Shield, CheckCircle2, X, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalItem, setActiveModalItem] = useState<RecommendationItem | null>(null);
  const [expandedScoreId, setExpandedScoreId] = useState<number | null>(null);
  const { showToast } = useStore();

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/recommendations/?limit=16');
      setRecommendations(data.items);
    } catch (err: any) {
      showToast('Failed to fetch recommendations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleFeedback = async (item: RecommendationItem, isUseful: boolean) => {
    try {
      await api.post('/recommendations/feedback', {
        recommendation_item_id: item.id,
        food_id: item.food_id,
        is_useful: isUseful,
      });

      // Update local state
      setRecommendations(prev =>
        prev.map(r => r.id === item.id ? { ...r, user_feedback: isUseful } : r)
      );
      showToast(
        isUseful
          ? `Marked "${item.food_name}" as useful. Personalization updated!`
          : `Feedback noted for "${item.food_name}". We'll de-prioritize similar items.`,
        'success'
      );
    } catch (err) {
      showToast('Could not record feedback', 'error');
    }
  };

  const handleToggleFavorite = async (item: RecommendationItem) => {
    try {
      if (item.is_favorite) {
        await api.delete(`/foods/favorites/${item.food_id}`);
        setRecommendations(prev =>
          prev.map(r => r.id === item.id ? { ...r, is_favorite: false } : r)
        );
        showToast(`Removed "${item.food_name}" from favorites`, 'info');
      } else {
        await api.post(`/foods/favorites/${item.food_id}`);
        setRecommendations(prev =>
          prev.map(r => r.id === item.id ? { ...r, is_favorite: true } : r)
        );
        showToast(`Saved "${item.food_name}" to your favorites!`, 'success');
      }
    } catch (err) {
      showToast('Could not update favorite', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Hybrid AI Recommendation Engine
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Personalized <span className="text-gradient">Protein Suggestions</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Filtered through your dietary rules &amp; allergen junction table, then ranked by preference matching, cuisine relevance, and protein density.
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 glass-card hover:bg-slate-800 flex items-center gap-2 border border-slate-700 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Suggestions
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-500/5"
            >
              <div>
                {/* Header tags & match badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-md">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <Award className="w-3.5 h-3.5" />
                    {item.match_score}% Match
                  </div>
                </div>

                {/* Food Name & Badges */}
                <h2 className="text-lg font-bold text-white leading-tight">{item.food_name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                    {item.protein_g}g Protein
                  </span>
                  <span className="text-xs text-slate-400">/ {item.serving_description}</span>
                  <span className="text-xs text-slate-400">• {item.calories} kcal</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                  <span>{item.diet_type}</span>
                  <span>•</span>
                  <span>{item.cuisine}</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-medium">Source: {item.source}</span>
                </div>

                {/* "Why This Food?" preview snippet */}
                <div className="mt-3.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Why Recommended:
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(item)}
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                    >
                      Full Details
                    </button>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1 pt-1">
                    {item.explanation_points.slice(0, 2).map((point, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point.replace(/^✓\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expandable Match Score Breakdown (Section 9) */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setExpandedScoreId(expandedScoreId === item.id ? null : item.id)}
                    className="w-full flex items-center justify-between text-[11px] font-medium text-slate-400 hover:text-slate-200 py-1"
                  >
                    <span>View Match Score Breakdown</span>
                    {expandedScoreId === item.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {expandedScoreId === item.id && (
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 mt-1 space-y-1.5 text-xs text-slate-300 animate-fade-in">
                      <div className="flex justify-between">
                        <span>Diet Match:</span>
                        <span className="font-semibold text-emerald-400">{item.diet_match_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cuisine Match:</span>
                        <span className="font-semibold text-cyan-400">{item.cuisine_match_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Preference Match:</span>
                        <span className="font-semibold text-purple-400">{item.preference_match_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Feedback Score:</span>
                        <span className="font-semibold text-amber-400">{item.feedback_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nutrition Relevance:</span>
                        <span className="font-semibold text-emerald-400">{item.nutrition_score}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: 👍 Useful, 👎 Not useful, Save Favorite */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFeedback(item, true)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                      item.user_feedback === true
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                    Useful
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedback(item, false)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                      item.user_feedback === false
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
                    Not for me
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFavorite(item)}
                  className={`p-2 rounded-lg border transition-colors ${
                    item.is_favorite
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={item.is_favorite ? 'Saved to Favorites' : 'Save Food'}
                >
                  {item.is_favorite ? <BookmarkCheck className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* "WHY THIS FOOD?" DETAILED MODAL (Section 11) */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-lg w-full space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Why We Recommend This Food</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider">{activeModalItem.category}</span>
              <h4 className="text-xl font-bold text-white">{activeModalItem.food_name}</h4>
              <p className="text-xs text-slate-400">
                {activeModalItem.protein_g}g Protein • {activeModalItem.calories} kcal • {activeModalItem.serving_description}
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Explainability Checklist:
              </h5>
              <div className="space-y-2">
                {activeModalItem.explanation_points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{pt.replace(/^✓\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
              <span>Overall Recommendation Match Score:</span>
              <span className="text-base font-extrabold">{activeModalItem.match_score}%</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveModalItem(null)}
              className="w-full py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs transition-colors"
            >
              Close Explanation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
