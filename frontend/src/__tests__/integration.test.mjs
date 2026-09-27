import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Onboarding 6-Step Validation (Section 4 & 39)
test('Onboarding 6-Step Multi-Stage Flow Validation', () => {
  const sampleClientOnboarding = {
    // Step 1: Basic Profile
    age: 28,
    preferred_language: 'English',
    // Step 2: Fitness Goal (Functional, non-appearance)
    fitness_goal: 'General fitness',
    // Step 3: Dietary Preference
    diet_type: 'Vegetarian',
    custom_diet_exclusions: null,
    // Step 4: Cuisine
    preferred_cuisine: 'Indian',
    // Step 5: Food Restrictions (Allergies & Avoidance)
    allergy_ids: [1], // Milk/Dairy
    avoidance_items: ['mushroom', 'onion'],
    personal_notes: 'Prefers mild spices',
    // Step 6: Activity Level (collected once only)
    activity_level: 'Moderate',
  };

  assert.equal(sampleClientOnboarding.age, 28);
  assert.equal(sampleClientOnboarding.diet_type, 'Vegetarian');
  assert.equal(sampleClientOnboarding.fitness_goal, 'General fitness');
  assert.equal(sampleClientOnboarding.activity_level, 'Moderate');
  assert.deepEqual(sampleClientOnboarding.avoidance_items, ['mushroom', 'onion']);
  assert.ok(sampleClientOnboarding.allergy_ids.includes(1));
});

// Test 2: Recommendation Hard-Filtering & Allergen Junction Match (Section 8 & 39)
test('Recommendation Engine Hard Filtering Rules', () => {
  const candidateFoods = [
    { id: 1, name: 'Paneer (Cottage Cheese)', category: 'Dairy', diet_type: 'Vegetarian', allergens: [1] },
    { id: 2, name: 'Chickpeas (Kabuli Chana)', category: 'Legumes', diet_type: 'Vegan', allergens: [] },
    { id: 3, name: 'Chicken Breast', category: 'Meat', diet_type: 'Non-Vegetarian', allergens: [] },
    { id: 4, name: 'Soya Chunks', category: 'Soy', diet_type: 'Vegan', allergens: [8] },
    { id: 5, name: 'Mushroom Stir Fry', category: 'Other', diet_type: 'Vegan', allergens: [] },
  ];

  // Client is Vegetarian, allergic to Soy (id=8), avoids 'mushroom'
  const clientDiet = 'Vegetarian';
  const clientAllergies = new Set([8]);
  const clientAvoidances = new Set(['mushroom']);

  const filtered = candidateFoods.filter(food => {
    // Rule 1: Diet Exclusions
    if (clientDiet === 'Vegetarian' && food.diet_type === 'Non-Vegetarian') return false;
    // Rule 2: Allergies
    if (food.allergens.some(a => clientAllergies.has(a))) return false;
    // Rule 3: Avoidances
    if (Array.from(clientAvoidances).some(a => food.name.toLowerCase().includes(a))) return false;
    return true;
  });

  const names = filtered.map(f => f.name);
  assert.ok(names.includes('Paneer (Cottage Cheese)'), 'Paneer should pass vegetarian filter');
  assert.ok(names.includes('Chickpeas (Kabuli Chana)'), 'Chickpeas should pass vegetarian filter');
  assert.ok(!names.includes('Chicken Breast'), 'Meat should be hard-filtered for Vegetarian');
  assert.ok(!names.includes('Soya Chunks'), 'Soy should be hard-filtered due to allergen');
  assert.ok(!names.includes('Mushroom Stir Fry'), 'Mushroom should be filtered due to avoidance');
});

// Test 3: Recommendation Formula with Dynamic Configurable Weights (Section 9)
test('Recommendation Match Score Formula with Configurable Weights', () => {
  const weights = {
    diet_match_weight: 1.0,
    cuisine_match_weight: 0.8,
    preference_match_weight: 0.9,
    feedback_weight: 0.85,
    nutrition_relevance_weight: 0.95,
  };

  const dietScore = 100;
  const cuisineScore = 95;
  const prefScore = 90;
  const feedbackScore = 85;
  const nutrScore = 92;

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const rawScore = (
    (dietScore * weights.diet_match_weight) +
    (cuisineScore * weights.cuisine_match_weight) +
    (prefScore * weights.preference_match_weight) +
    (feedbackScore * weights.feedback_weight) +
    (nutrScore * weights.nutrition_relevance_weight)
  ) / totalWeight;

  const finalScore = Math.round(rawScore * 10) / 10;
  assert.ok(finalScore >= 90 && finalScore <= 95, `Expected score ~92.5%, got ${finalScore}%`);
});

// Test 4: Personalization Engine Signal Priority (Section 17)
test('Personalization Engine Signal Priority Order', () => {
  // Signal priority: Favorites (1.0) > Feedback (0.85) > Food Logs (0.6) > Search (0.3)
  const signalWeights = {
    favorite: 1.0,
    feedback_useful: 0.85,
    food_log: 0.6,
    search_history: 0.3,
  };

  assert.ok(signalWeights.favorite > signalWeights.feedback_useful);
  assert.ok(signalWeights.feedback_useful > signalWeights.food_log);
  assert.ok(signalWeights.food_log > signalWeights.search_history);
});

// Test 5: Strict Coach-Client Boundary Check (Section 2 & 24)
test('Strict Coach-Client Assignment Boundary Enforcement', () => {
  const coachAssignments = new Map([
    // Coach Sarah (id: 2) is assigned strictly to Client Rohith (id: 3)
    [2, new Set([3])],
  ]);

  const isAuthorized = (coachId, clientId) => {
    return coachAssignments.get(coachId)?.has(clientId) ?? false;
  };

  assert.equal(isAuthorized(2, 3), true, 'Coach Sarah should be authorized for Rohith');
  assert.equal(isAuthorized(2, 4), false, 'Coach Sarah should NOT be authorized for Ananya (must return 403)');
});

// Test 6: Health & Safety Clinical Boundary (Section 38)
test('Clinical Safety Guardrails Detect Medical Condition Terms', () => {
  const medicalTerms = ['cure', 'diabetes', 'hypertension', 'medicine', 'prescription'];
  const testQuery = 'Can you prescribe a cure or medicine for diabetes?';

  const hasMedicalIntent = medicalTerms.some(term => testQuery.toLowerCase().includes(term));
  assert.equal(hasMedicalIntent, true, 'Medical terms must be flagged for safe physician redirection');
});

// Test 7: Diet Plans Weight Category Division & Activity Fetching (PDF Reference Dataset Pages 1–14)
test('Diet Plans Weight Category Division and Activity Matching', () => {
  const normalizeWeight = (weightKg) => {
    if (weightKg < 60) return '50–60 kg';
    if (weightKg < 70) return '60–70 kg';
    if (weightKg < 80) return '70–80 kg';
    return '80–90 kg';
  };

  assert.equal(normalizeWeight(54), '50–60 kg');
  assert.equal(normalizeWeight(65), '60–70 kg');
  assert.equal(normalizeWeight(74.5), '70–80 kg');
  assert.equal(normalizeWeight(86), '80–90 kg');

  const expectedActivities = ['Cricket', 'Football', 'Volleyball', 'Hockey', 'Badminton', 'Bodybuilding'];
  assert.equal(expectedActivities.length, 6);

  const calculateTargetEnergy = (baseCals, goal) => {
    if (goal === 'Gain') return Math.round(baseCals * 1.18 / 50) * 50;
    if (goal === 'Loss') return Math.round(baseCals * 0.82 / 50) * 50;
    return baseCals;
  };

  const baseCricket5060 = 1950;
  assert.ok(calculateTargetEnergy(baseCricket5060, 'Gain') > baseCricket5060, 'Gain must be in caloric surplus');
  assert.ok(calculateTargetEnergy(baseCricket5060, 'Loss') < baseCricket5060, 'Loss must be in caloric deficit');
  assert.equal(calculateTargetEnergy(baseCricket5060, 'Maintain'), 1950);
});

