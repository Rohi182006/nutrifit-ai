export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'client' | 'coach' | 'admin';
  has_completed_onboarding?: boolean;
}

export interface ClientProfile {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  age?: number;
  preferred_language: string;
  preferences?: ClientPreferences;
  allergies: string[];
  avoidances: string[];
  assigned_coach?: {
    id: number;
    name: string;
    email: string;
    specialization: string;
  };
}

export interface ClientPreferences {
  fitness_goal: string;
  diet_type: string;
  custom_diet_exclusions?: string;
  preferred_cuisine: string;
  activity_level: string;
  notes?: string;
}

export interface FoodNutrition {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories: number;
  fiber_g: number;
  source: string;
  verified: boolean;
}

export interface FoodItem {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  food_type: string;
  diet_type: string;
  cuisine: string;
  serving_description: string;
  serving_unit: string;
  tags: string;
  image_url?: string;
  is_active: boolean;
  nutrition?: FoodNutrition;
  allergens: string[];
  is_favorite?: boolean;
}

export interface FoodCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

export interface Allergy {
  id: number;
  name: string;
  description?: string;
}

export interface RecommendationItem {
  id: number;
  food_id: number;
  food_name: string;
  category: string;
  diet_type: string;
  cuisine: string;
  serving_description: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories: number;
  source: string;
  match_score: number;
  diet_match_score: number;
  cuisine_match_score: number;
  preference_match_score: number;
  feedback_score: number;
  nutrition_score: number;
  explanation_points: string[];
  rank_order: number;
  user_feedback?: boolean | null;
  is_favorite?: boolean;
}

export interface RecommendationResponse {
  recommendation_id: number;
  total_recommendations: number;
  items: RecommendationItem[];
  context_applied: Record<string, any>;
}

export interface RecommendationRule {
  id: number;
  rule_name: string;
  rule_key: string;
  weight: number;
  is_active: boolean;
  description?: string;
}

export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  description?: string;
  difficulty: string;
}

export interface BiomechanicsError {
  id: string;
  error_name: string;
  severity: 'High' | 'Medium' | 'Low';
  joint_affected: string;
  biomechanical_risk: string;
  muscle_imbalance: string;
  corrective_cue: string;
  remedial_exercise: string;
}

export interface BiomechanicsFood {
  name: string;
  protein_g: number;
  source: string;
  serving: string;
}

export interface BiomechanicsProfile {
  exercise_id: number;
  exercise_name: string;
  category: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  target_angles: Record<string, string>;
  tempo_guideline: string;
  errors: BiomechanicsError[];
  protein_recovery_tip: string;
  recommended_foods: BiomechanicsFood[];
}

export interface FormAnalysisResult {
  exercise_name: string;
  form_score: number;
  movement_quality: string;
  detected_errors: BiomechanicsError[];
  corrective_cues: string[];
  joint_metrics: Record<string, any>;
  protein_target_g: number;
  recommended_foods: BiomechanicsFood[];
  analyzed_at: string;
}

export interface WorkoutExercise {
  exercise_id: number;
  exercise_name?: string;
  sets: number;
  reps: number;
  weight_kg: number;
  duration_seconds?: number;
}

export interface Workout {
  id: number;
  workout_type: string;
  duration_minutes: number;
  workout_date: string;
  difficulty: string;
  notes?: string;
  exercises: WorkoutExercise[];
}

export interface ActivityLog {
  id: number;
  log_date: string;
  steps: number;
  active_minutes: number;
  activity_type: string;
  distance_km: number;
  calories_burned: number;
  notes?: string;
}

export interface NutritionLog {
  id: number;
  meal_type: string;
  food_item_id?: number;
  food_name: string;
  serving_quantity: number;
  serving_unit: string;
  protein_g: number;
  calories: number;
  log_date: string;
  notes?: string;
}

export interface Goal {
  id: number;
  client_id: number;
  title: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  progress_percentage: number;
  status: string;
  start_date: string;
  target_date?: string;
}

export interface DietPlan {
  id: number;
  weight_range: string;
  weight_min_kg: number;
  weight_max_kg: number;
  activity_type: string;
  activity: string;
  activity_intensity: string;
  nutrition_priority: string;
  main_food_groups: string;
  breakfast: string;
  mid_morning: string;
  lunch: string;
  pre_training: string;
  post_training: string;
  dinner: string;
  hydration: string;
  app_personalization: string;
  portion_logic: string;
  active_goal: string;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  water_liters_min: number;
  water_liters_max: number;
  goal_guidance?: string;
  icon: string;
}

export interface DietPlanWeightCategory {
  range: string;
  min_kg: number;
  max_kg: number;
  label: string;
  badge: string;
  baseline_calories: string;
}

export interface DietPlanActivity {
  name: string;
  type: string;
  intensity: string;
  icon: string;
  priority: string;
}

export interface DietPlanGoal {
  id: string;
  label: string;
  description: string;
}

export interface DietPlanCategoriesResponse {
  weight_categories: DietPlanWeightCategory[];
  activities: DietPlanActivity[];
  goals: DietPlanGoal[];
  dataset_meta: {
    title: string;
    logic: string;
    source: string;
  };
}

