import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { FoodItem, FoodCategory, Allergy } from '../types';
import { Utensils, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const AdminFoodsPage: React.FC = () => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [foodType, setFoodType] = useState('Whole Food');
  const [dietType, setDietType] = useState('Vegetarian');
  const [cuisine, setCuisine] = useState('Indian');
  const [servingDesc, setServingDesc] = useState('100g');
  const [servingUnit, setServingUnit] = useState('g');
  const [tags, setTags] = useState('high-protein');
  const [proteinG, setProteinG] = useState(20.0);
  const [carbsG, setCarbsG] = useState(5.0);
  const [fatG, setFatG] = useState(3.0);
  const [calories, setCalories] = useState(150.0);
  const [fiberG, setFiberG] = useState(2.0);
  const [source, setSource] = useState('IFCT (Indian Food Composition Tables)');
  const [selectedAllergies, setSelectedAllergies] = useState<number[]>([]);

  const { showToast } = useStore();

  const loadData = async () => {
    setLoading(true);
    try {
      const [fRes, cRes, aRes] = await Promise.all([
        api.get('/foods/?limit=100'),
        api.get('/foods/categories'),
        api.get('/foods/allergies')
      ]);
      setFoods(fRes.data);
      setCategories(cRes.data);
      setAllergies(aRes.data);
      if (cRes.data.length > 0) setCategoryId(cRes.data[0].id);
    } catch (err) {
      showToast('Could not load foods', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleAllergy = (id: number) => {
    setSelectedAllergies(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/foods', {
        name,
        category_id: Number(categoryId),
        food_type: foodType,
        diet_type: dietType,
        cuisine,
        serving_description: servingDesc,
        serving_unit: servingUnit,
        tags,
        protein_g: Number(proteinG),
        carbs_g: Number(carbsG),
        fat_g: Number(fatG),
        calories: Number(calories),
        fiber_g: Number(fiberG),
        source,
        allergy_ids: selectedAllergies
      });

      showToast(`Added "${name}" with verified nutrition!`, 'success');
      setShowAddModal(false);
      setName('');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to add food', 'error');
    }
  };

  const handleDeactivate = async (id: number, foodName: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${foodName}?`)) return;
    try {
      await api.delete(`/admin/foods/${id}`);
      setFoods(foods.filter(f => f.id !== id));
      showToast(`Deactivated ${foodName}`, 'info');
    } catch (err) {
      showToast('Could not deactivate food', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Utensils className="w-3.5 h-3.5" />
            Verified Nutrition Catalog Management
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Food Database <span className="text-gradient">Catalog</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Create and maintain verified protein sources referencing <strong>IFCT</strong> &amp; <strong>USDA</strong> datasets with structured allergen tags.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Verified Food Item
        </button>
      </div>

      {/* Food Items Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">Active Food Database ({foods.length} items)</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Diet &amp; Cuisine</th>
                  <th className="py-3 px-3">Protein</th>
                  <th className="py-3 px-3">Calories</th>
                  <th className="py-3 px-3">Verified Source</th>
                  <th className="py-3 px-3">Allergens</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {foods.map((food) => (
                  <tr key={food.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 font-bold text-white">{food.name}</td>
                    <td className="py-3 px-3 text-slate-400">{food.category_name}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-emerald-400">{food.diet_type}</span>
                      <span className="text-slate-400"> • {food.cuisine}</span>
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-400">
                      {food.nutrition?.protein_g}g
                    </td>
                    <td className="py-3 px-3 font-semibold text-amber-400">
                      {food.nutrition?.calories} kcal
                    </td>
                    <td className="py-3 px-3 text-cyan-300 font-medium">
                      {food.nutrition?.source}
                    </td>
                    <td className="py-3 px-3">
                      {food.allergens && food.allergens.length > 0 ? (
                        <span className="text-amber-400">{food.allergens.join(', ')}</span>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeactivate(food.id, food.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Deactivate item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-400" />
              Add Verified Nutrition Food Item
            </h3>

            <form onSubmit={handleCreateFood} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Food Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Edamame Bowl"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Diet Type</label>
                  <select
                    value={dietType}
                    onChange={(e) => setDietType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Vegan">Vegan</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Cuisine</label>
                  <select
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Indian">Indian</option>
                    <option value="South Indian">South Indian</option>
                    <option value="North Indian">North Indian</option>
                    <option value="Continental">Continental</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Serving</label>
                  <input
                    type="text"
                    value={servingDesc}
                    onChange={(e) => setServingDesc(e.target.value)}
                    placeholder="100g cooked"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={proteinG}
                    onChange={(e) => setProteinG(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={carbsG}
                    onChange={(e) => setCarbsG(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fatG}
                    onChange={(e) => setFatG(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Calories</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Verified Nutrition Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="IFCT (Indian Food Composition Tables)">IFCT (Indian Food Composition Tables)</option>
                  <option value="USDA FoodData Central">USDA FoodData Central</option>
                  <option value="Manual Composition Analysis">Manual Composition Analysis</option>
                </select>
              </div>

              {/* Structured Allergens Junction multi-select */}
              <div>
                <label className="block text-slate-300 mb-1">
                  Structured Allergens Junction (Select all matching)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map(a => {
                    const sel = selectedAllergies.includes(a.id);
                    return (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => toggleAllergy(a.id)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                          sel
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400"
                >
                  Save Food Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
