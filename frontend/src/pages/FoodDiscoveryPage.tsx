import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { FoodItem, FoodCategory } from '../types';
import {
  Search, Filter, Bookmark, BookmarkCheck, Sparkles,
  Utensils, AlertTriangle, ArrowUpDown, Layers
} from 'lucide-react';

export const FoodDiscoveryPage: React.FC = () => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedDiet, setSelectedDiet] = useState<string>('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [minProtein, setMinProtein] = useState<number>(0);

  // Comparison selection
  const [compareIds, setCompareIds] = useState<number[]>([]);

  const { showToast } = useStore();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [foodsRes, catsRes] = await Promise.all([
        api.get('/foods/', {
          params: {
            query: searchQuery || undefined,
            category_id: selectedCategory || undefined,
            diet_type: selectedDiet || undefined,
            cuisine: selectedCuisine || undefined,
            min_protein: minProtein > 0 ? minProtein : undefined,
            limit: 50
          }
        }),
        api.get('/foods/categories')
      ]);

      setFoods(foodsRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      showToast('Could not load food database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedDiet, selectedCuisine, minProtein]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleFavorite = async (food: FoodItem) => {
    try {
      if (food.is_favorite) {
        await api.delete(`/foods/favorites/${food.id}`);
        setFoods(prev => prev.map(f => f.id === food.id ? { ...f, is_favorite: false } : f));
        showToast(`Removed "${food.name}" from favorites`, 'info');
      } else {
        await api.post(`/foods/favorites/${food.id}`);
        setFoods(prev => prev.map(f => f.id === food.id ? { ...f, is_favorite: true } : f));
        showToast(`Saved "${food.name}" to favorites!`, 'success');
      }
    } catch (err) {
      showToast('Error updating favorite', 'error');
    }
  };

  const toggleCompare = (id: number) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(x => x !== id));
    } else {
      if (compareIds.length >= 4) {
        showToast('You can compare a maximum of 4 foods at a time', 'info');
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  const launchComparison = () => {
    if (compareIds.length < 2) {
      showToast('Select at least 2 foods to compare', 'info');
      return;
    }
    navigate('/food-comparison', { state: { selectedIds: compareIds } });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Utensils className="w-3.5 h-3.5" />
            Verified Nutrition Database
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Explore <span className="text-gradient">Protein Foods</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Browse our scientifically validated nutrition catalog sourced from <strong>IFCT</strong> &amp; <strong>USDA</strong>.
          </p>
        </div>

        {compareIds.length > 0 && (
          <div className="glass-card p-3 rounded-2xl border border-cyan-500/40 flex items-center gap-3">
            <span className="text-xs font-semibold text-cyan-300">
              {compareIds.length} foods selected
            </span>
            <button
              onClick={launchComparison}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-md shadow-cyan-500/20"
            >
              Compare Side-by-Side &rarr;
            </button>
            <button
              onClick={() => setCompareIds([])}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food by name, keyword, or tags (e.g. paneer, chana, sprouts, lentils)..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-24 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Diet Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Diet Type
            </label>
            <select
              value={selectedDiet}
              onChange={(e) => setSelectedDiet(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Diets</option>
              <option value="Vegan">Vegan</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Eggetarian">Eggetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
            </select>
          </div>

          {/* Cuisine Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Cuisine
            </label>
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Cuisines</option>
              <option value="Indian">Indian</option>
              <option value="South Indian">South Indian</option>
              <option value="North Indian">North Indian</option>
              <option value="Continental">Continental</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          {/* Min Protein Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Min Protein ({minProtein}g)
            </label>
            <input
              type="range"
              min={0}
              max={40}
              step={5}
              value={minProtein}
              onChange={(e) => setMinProtein(Number(e.target.value))}
              className="w-full accent-emerald-400 mt-2"
            />
          </div>
        </div>
      </div>

      {/* Food Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
        </div>
      ) : foods.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 space-y-2">
          <Utensils className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No food items found</h3>
          <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foods.map((food) => {
            const isComparing = compareIds.includes(food.id);
            return (
              <div
                key={food.id}
                className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-md">
                      {food.category_name}
                    </span>
                    <span className="text-[11px] font-medium text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded">
                      {food.nutrition?.source}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug">{food.name}</h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>{food.diet_type}</span>
                    <span>•</span>
                    <span>{food.cuisine} cuisine</span>
                    <span>•</span>
                    <span>{food.serving_description}</span>
                  </div>

                  {/* Macro Badges Grid */}
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

                  {/* Structured Allergens Warning */}
                  {food.allergens && food.allergens.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 text-[11px] text-amber-400/90">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Contains: {food.allergens.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCompare(food.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      isComparing
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {isComparing ? 'Comparing' : 'Compare'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(food)}
                    className={`p-2 rounded-lg border transition-colors ${
                      food.is_favorite
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    title={food.is_favorite ? 'Remove Favorite' : 'Save Food'}
                  >
                    {food.is_favorite ? (
                      <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
