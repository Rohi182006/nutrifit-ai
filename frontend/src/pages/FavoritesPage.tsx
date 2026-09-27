import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { FoodItem } from '../types';
import { Bookmark, Trash2, Sparkles, Utensils, AlertTriangle, ArrowRight } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useStore();

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/foods/favorites');
      setFavorites(data);
    } catch (err) {
      showToast('Could not load favorites', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemove = async (foodId: number, foodName: string) => {
    try {
      await api.delete(`/foods/favorites/${foodId}`);
      setFavorites(favorites.filter(f => f.id !== foodId));
      showToast(`Removed "${foodName}" from favorites`, 'info');
    } catch (err) {
      showToast('Could not remove favorite', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Bookmark className="w-3.5 h-3.5" />
            Highest Priority Signal (Weight: 1.0)
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            My <span className="text-gradient">Favorite Foods</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Saved foods carry the strongest personalization weight in the algorithm to continuously refine your recommendations.
          </p>
        </div>

        <Link
          to="/foods"
          className="px-5 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0"
        >
          Explore More Foods &rarr;
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 space-y-3">
          <Bookmark className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No favorite foods saved yet</h3>
          <p className="text-xs text-slate-400">
            Browse the food catalog or AI recommendations and click the bookmark icon to save foods here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((food) => (
            <div
              key={food.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-md">
                    {food.category_name}
                  </span>
                  <span className="text-[11px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                    {food.nutrition?.source}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white leading-snug">{food.name}</h3>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{food.diet_type}</span>
                  <span>•</span>
                  <span>{food.cuisine} cuisine</span>
                </div>

                {/* Macro Chips */}
                <div className="grid grid-cols-4 gap-2 mt-4 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Protein</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {food.nutrition?.protein_g || 0}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Carbs</span>
                    <span className="text-xs font-bold text-slate-300">
                      {food.nutrition?.carbs_g || 0}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Fat</span>
                    <span className="text-xs font-bold text-slate-300">
                      {food.nutrition?.fat_g || 0}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Calories</span>
                    <span className="text-xs font-bold text-amber-400">
                      {food.nutrition?.calories || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">{food.serving_description}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(food.id, food.name)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
