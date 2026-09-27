import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/client';
import { Layers, AlertTriangle, ArrowUpDown, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export const FoodComparisonPage: React.FC = () => {
  const location = useLocation();
  const stateIds = (location.state as any)?.selectedIds;
  const [selectedIds, setSelectedIds] = useState<number[]>(stateIds || [1, 2, 7]); // Default Paneer, Chickpeas, Soya Chunks
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableFoods, setAvailableFoods] = useState<any[]>([]);
  const { showToast } = useStore();

  useEffect(() => {
    api.get('/foods/?limit=50').then(res => setAvailableFoods(res.data)).catch(console.error);
  }, []);

  const loadComparison = async (ids: number[]) => {
    if (ids.length < 2) return;
    setLoading(true);
    try {
      const { data } = await api.post('/foods/compare', { food_ids: ids });
      setComparisonData(data.comparison);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Comparison failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison(selectedIds);
  }, [selectedIds]);

  const handleSelectFood = (index: number, newId: number) => {
    const updated = [...selectedIds];
    updated[index] = newId;
    setSelectedIds(updated);
  };

  const chartData = comparisonData.map(f => ({
    name: f.name.split(' ')[0], // short name
    Protein: f.protein_g,
    Carbs: f.carbs_g,
    Fat: f.fat_g,
    Calories: f.calories,
  }));

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Layers className="w-3.5 h-3.5" />
          Side-by-Side Nutrition Matrix
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Food &amp; <span className="text-gradient">Macro Comparison</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-xl">
          Evaluate protein density, macro distribution, verified composition source, and allergen profiles across candidate foods.
        </p>

        {/* Food Selectors */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Comparing:
          </span>
          {selectedIds.map((id, idx) => (
            <select
              key={idx}
              value={id}
              onChange={(e) => handleSelectFood(idx, Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {availableFoods.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
        </div>
      ) : (
        <>
          {/* Comparison Matrix Table (Section 14) */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60">
                    <th className="p-4 font-semibold text-slate-400 uppercase text-xs">Attribute</th>
                    {comparisonData.map(f => (
                      <th key={f.id} className="p-4 font-bold text-white text-base">
                        {f.name}
                        <span className="block text-xs font-normal text-slate-400 mt-0.5">{f.category}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="p-4 font-semibold text-slate-400 text-xs">Food Type</td>
                    {comparisonData.map(f => <td key={f.id} className="p-4">{f.food_type}</td>)}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-400 text-xs">Diet Type</td>
                    {comparisonData.map(f => (
                      <td key={f.id} className="p-4 font-semibold text-emerald-400">{f.diet_type}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-400 text-xs">Cuisine</td>
                    {comparisonData.map(f => <td key={f.id} className="p-4">{f.cuisine}</td>)}
                  </tr>
                  <tr className="bg-emerald-500/5">
                    <td className="p-4 font-bold text-emerald-400 text-xs">Protein (g)</td>
                    {comparisonData.map(f => (
                      <td key={f.id} className="p-4 text-base font-extrabold text-emerald-400">
                        {f.protein_g}g
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-400 text-xs">Carbohydrates</td>
                    {comparisonData.map(f => <td key={f.id} className="p-4">{f.carbs_g}g</td>)}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-400 text-xs">Fat</td>
                    {comparisonData.map(f => <td key={f.id} className="p-4">{f.fat_g}g</td>)}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-400 text-xs">Energy (Calories)</td>
                    {comparisonData.map(f => <td key={f.id} className="p-4 font-bold text-amber-400">{f.calories} kcal</td>)}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-400 text-xs">Dietary Fiber</td>
                    {comparisonData.map(f => <td key={f.id} className="p-4">{f.fiber_g}g</td>)}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-400 text-xs">Serving Basis</td>
                    {comparisonData.map(f => <td key={f.id} className="p-4 text-xs text-slate-400">{f.serving_description}</td>)}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-400 text-xs">Verified Source</td>
                    {comparisonData.map(f => (
                      <td key={f.id} className="p-4 text-xs font-semibold text-cyan-400">{f.source}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-400 text-xs">Structured Allergens</td>
                    {comparisonData.map(f => (
                      <td key={f.id} className="p-4 text-xs">
                        {f.allergens && f.allergens.length > 0 ? (
                          <span className="text-amber-400 font-semibold">{f.allergens.join(', ')}</span>
                        ) : (
                          <span className="text-emerald-400">None detected</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Protein & Macro Chart */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Macronutrient Profile Comparison (Grams)
            </h3>
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }}
                  />
                  <Legend />
                  <Bar dataKey="Protein" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Carbs" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Fat" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
