import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/client';
import {
  Check, ArrowRight, ArrowLeft, Sparkles, AlertCircle,
  Apple, Target, Globe, Shield, Flame, Activity
} from 'lucide-react';
import { Allergy } from '../types';

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableAllergies, setAvailableAllergies] = useState<Allergy[]>([]);

  // Step 1: Basic Profile
  const [age, setAge] = useState<number>(26);
  const [language, setLanguage] = useState<string>('English');

  // Step 2: Fitness Goal (Non-appearance based!)
  const [fitnessGoal, setFitnessGoal] = useState<string>('General fitness');

  // Step 3: Dietary Preference
  const [dietType, setDietType] = useState<string>('Vegetarian');
  const [customDietExclusions, setCustomDietExclusions] = useState<string>('');

  // Step 4: Cuisine / Food Preference
  const [preferredCuisine, setPreferredCuisine] = useState<string>('Indian');
  const [customCuisine, setCustomCuisine] = useState<string>('');

  // Step 5: Food Restrictions (Allergies & Avoidance)
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<number[]>([]);
  const [avoidanceInput, setAvoidanceInput] = useState<string>('');
  const [avoidanceList, setAvoidanceList] = useState<string[]>([]);
  const [personalNotes, setPersonalNotes] = useState<string>('');

  // Step 6: Activity Level (collected once only)
  const [activityLevel, setActivityLevel] = useState<string>('Moderate');

  const [initialLoading, setInitialLoading] = useState(false);
  const { showToast, loadProfile, checkAuth } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Default fallback allergens in case of network or proxy delay
    const fallbackAllergies: Allergy[] = [
      { id: 1, name: 'Milk/Dairy' },
      { id: 2, name: 'Eggs' },
      { id: 3, name: 'Fish' },
      { id: 4, name: 'Shellfish' },
      { id: 5, name: 'Tree Nuts' },
      { id: 6, name: 'Peanuts' },
      { id: 7, name: 'Wheat/Gluten' },
      { id: 8, name: 'Soy' },
      { id: 9, name: 'Sesame' },
      { id: 10, name: 'Mustard' },
      { id: 11, name: 'Sulfites' }
    ];

    // 1. Load controlled allergies list safely
    api.get('/foods/allergies')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setAvailableAllergies(res.data);
        } else {
          setAvailableAllergies(fallbackAllergies);
        }
      })
      .catch(err => {
        console.warn('Could not load dynamic allergies, using defaults:', err);
        setAvailableAllergies(fallbackAllergies);
      });

    // 2. Pre-populate existing client personalization profile if available
    setInitialLoading(true);
    api.get('/clients/profile')
      .then(res => {
        const p = res.data;
        if (p) {
          if (p.age) setAge(Number(p.age));
          if (p.preferred_language) setLanguage(p.preferred_language);
          if (p.preferences) {
            if (p.preferences.fitness_goal) setFitnessGoal(p.preferences.fitness_goal);
            if (p.preferences.diet_type) setDietType(p.preferences.diet_type);
            if (p.preferences.custom_diet_exclusions) setCustomDietExclusions(p.preferences.custom_diet_exclusions);
            if (p.preferences.preferred_cuisine) {
              const standardCuisines = ['Indian', 'South Indian', 'North Indian', 'Continental', 'Mixed'];
              if (standardCuisines.includes(p.preferences.preferred_cuisine)) {
                setPreferredCuisine(p.preferences.preferred_cuisine);
              } else {
                setPreferredCuisine('Custom');
                setCustomCuisine(p.preferences.preferred_cuisine);
              }
            }
            if (p.preferences.activity_level) setActivityLevel(p.preferences.activity_level);
            if (p.preferences.notes) setPersonalNotes(p.preferences.notes);
          }
          if (Array.isArray(p.allergy_ids) && p.allergy_ids.length > 0) {
            setSelectedAllergyIds(p.allergy_ids);
          }
          if (Array.isArray(p.avoidances) && p.avoidances.length > 0) {
            setAvoidanceList(p.avoidances);
          }
        }
      })
      .catch(() => {
        // Silent catch: new accounts do not have an existing profile yet
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, []);

  const toggleAllergy = (id: number) => {
    setSelectedAllergyIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addAvoidanceItem = () => {
    if (avoidanceInput.trim() && !avoidanceList.includes(avoidanceInput.trim())) {
      setAvoidanceList([...avoidanceList, avoidanceInput.trim()]);
      setAvoidanceInput('');
    }
  };

  const removeAvoidanceItem = (item: string) => {
    setAvoidanceList(avoidanceList.filter(x => x !== item));
  };

  const validateCurrentStep = (): boolean => {
    if (step === 1) {
      if (!age || isNaN(age) || age < 14 || age > 100) {
        showToast('Please enter a valid age between 14 and 100', 'error');
        return false;
      }
    }
    if (step === 3 && dietType === 'Other') {
      if (!customDietExclusions.trim()) {
        showToast('Please specify your custom diet exclusions', 'error');
        return false;
      }
    }
    if (step === 4 && preferredCuisine === 'Custom') {
      if (!customCuisine.trim()) {
        showToast('Please specify your custom cuisine name', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setLoading(true);
    try {
      const payload = {
        age: Number(age) || 26,
        preferred_language: language || 'English',
        fitness_goal: fitnessGoal,
        diet_type: dietType,
        custom_diet_exclusions: dietType === 'Other' ? customDietExclusions.trim() : null,
        preferred_cuisine: preferredCuisine === 'Custom' ? customCuisine.trim() : preferredCuisine,
        allergy_ids: selectedAllergyIds,
        avoidance_items: avoidanceList,
        personal_notes: personalNotes.trim() || null,
        activity_level: activityLevel,
      };

      await api.post('/clients/onboarding', payload);
      await checkAuth();
      await loadProfile();
      showToast('Personalization setup complete! Welcome to your dashboard.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Personalization setup submission failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const goals = [
    { title: 'General fitness', desc: 'Maintain vitality, balanced energy, and wholesome daily nutrition.' },
    { title: 'Strength development', desc: 'Optimize high-quality protein distribution for muscular recovery.' },
    { title: 'Endurance', desc: 'Sustain stamina and cardiovascular performance with balanced macros.' },
    { title: 'Fitness consistency', desc: 'Build steady workout routines and habitual healthy food choices.' },
    { title: 'Wellness habit improvement', desc: 'Focus on regular meal timing, hydration, and mindful eating.' },
  ];

  const dietOptions = [
    {
      type: 'Vegan',
      desc: 'Excludes all animal products (meat, fish, eggs, dairy, honey, ghee).',
      badge: 'Plant-Only'
    },
    {
      type: 'Vegetarian',
      desc: 'Plant-based foods plus dairy (milk, paneer, curd). Excludes meat, fish, and eggs.',
      badge: 'Dairy-Friendly'
    },
    {
      type: 'Eggetarian',
      desc: 'Vegetarian diet including eggs. Excludes meat and fish.',
      badge: 'Eggs + Dairy'
    },
    {
      type: 'Non-Vegetarian',
      desc: 'No category exclusions. All animal and plant protein sources available.',
      badge: 'All Sources'
    },
    {
      type: 'Other',
      desc: 'Specify custom food category or ingredient exclusions.',
      badge: 'Custom Rules'
    },
  ];

  const cuisines = ['Indian', 'South Indian', 'North Indian', 'Continental', 'Mixed', 'Custom'];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Step Header */}
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Step {step} of 6
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Client Personalization Setup</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          This data powers our 4-step recommendation engine and hard filters.
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
          <div
            className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Container */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl">
        {/* STEP 1: BASIC PROFILE */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                Step 1 — Basic Profile
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tell us about your age and language preference for localized food terms.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min={14}
                  max={99}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Preferred Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi / हिन्दी</option>
                  <option value="Telugu">Telugu / తెలుగు</option>
                  <option value="Tamil">Tamil / தமிழ்</option>
                  <option value="Kannada">Kannada / ಕನ್ನಡ</option>
                  <option value="Malayalam">Malayalam / മലയാളം</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: FITNESS GOAL */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Step 2 — Fitness &amp; Wellness Goal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select your functional wellness goal (appearance-focused goals excluded).
              </p>
            </div>

            <div className="space-y-2.5">
              {goals.map((g) => (
                <div
                  key={g.title}
                  onClick={() => setFitnessGoal(g.title)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    fitnessGoal === g.title
                      ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'glass-card border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{g.title}</h3>
                    {fitnessGoal === g.title && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{g.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: DIETARY PREFERENCE */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Apple className="w-5 h-5 text-emerald-400" />
                Step 3 — Dietary Preference
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Strict hard-filtering is applied based on this selection.
              </p>
            </div>

            <div className="space-y-2.5">
              {dietOptions.map((d) => (
                <div
                  key={d.type}
                  onClick={() => setDietType(d.type)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    dietType === d.type
                      ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'glass-card border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{d.type}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-800 text-slate-300">
                        {d.badge}
                      </span>
                    </div>
                    {dietType === d.type && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{d.desc}</p>
                </div>
              ))}
            </div>

            {dietType === 'Other' && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Define Category / Ingredient Exclusions (Comma Separated)
                </label>
                <input
                  type="text"
                  value={customDietExclusions}
                  onChange={(e) => setCustomDietExclusions(e.target.value)}
                  placeholder="e.g. dairy, gluten, red meat, shellfish"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 4: FOOD PREFERENCE / CUISINE */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Step 4 — Preferred Cuisine &amp; Taste
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Prioritizes recommendations matching your culinary palate.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cuisines.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setPreferredCuisine(c)}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                    preferredCuisine === c
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {preferredCuisine === 'Custom' && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Custom Cuisine Name / Tag
                </label>
                <input
                  type="text"
                  value={customCuisine}
                  onChange={(e) => setCustomCuisine(e.target.value)}
                  placeholder="e.g. Mediterranean, Gujarati, Fusion"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 5: FOOD RESTRICTIONS (ALLERGIES & AVOIDANCE) */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-400" />
                Step 5 — Allergies &amp; Food Avoidance
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Foods linked to these structured allergens will be completely eliminated.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Controlled Allergens &amp; Intolerances
              </label>
              <div className="flex flex-wrap gap-2">
                {(availableAllergies || []).map((a) => {
                  const selected = selectedAllergyIds.includes(a.id);
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => toggleAllergy(a.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selected
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Specific Foods or Ingredients You Avoid
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={avoidanceInput}
                  onChange={(e) => setAvoidanceInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAvoidanceItem())}
                  placeholder="e.g. mushroom, onion, garlic, ghee"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addAvoidanceItem}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white transition-colors"
                >
                  Add
                </button>
              </div>

              {avoidanceList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {avoidanceList.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeAvoidanceItem(item)}
                        className="text-slate-400 hover:text-rose-400 text-xs font-bold"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Personal Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="Any special notes or preferences for your coach/assistant..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* STEP 6: ACTIVITY LEVEL (COLLECTED ONCE ONLY) */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Step 6 — Activity Level
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Used strictly for general personalization ranking, not restrictive calorie deficits.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { level: 'Low', desc: 'Mostly sedentary work, light daily walking, 1-2 light workouts/week.' },
                { level: 'Moderate', desc: 'Consistent active routine, 3-4 workouts/week or 7,000+ daily steps.' },
                { level: 'High', desc: 'Intensive strength training, athletic conditioning, or high physical job.' },
              ].map((act) => (
                <div
                  key={act.level}
                  onClick={() => setActivityLevel(act.level)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    activityLevel === act.level
                      ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'glass-card border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{act.level} Activity</h3>
                    {activityLevel === act.level && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{act.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white glass-panel flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : <div />}

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? 'Finalizing Setup...' : 'Complete & Launch Dashboard'}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
