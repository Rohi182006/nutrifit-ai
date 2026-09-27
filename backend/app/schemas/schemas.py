from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- AUTH SCHEMAS ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: Optional[str] = "client"  # client, coach, admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    has_completed_onboarding: Optional[bool] = False

    class Config:
        from_attributes = True

# --- ONBOARDING & CLIENT PROFILE SCHEMAS ---
class ClientOnboardingStep1(BaseModel):
    age: int
    preferred_language: str = "English"

class ClientOnboardingStep2(BaseModel):
    fitness_goal: str  # General fitness, Strength development, Endurance, Fitness consistency, Wellness habit improvement

class ClientOnboardingStep3(BaseModel):
    diet_type: str  # Vegan, Vegetarian, Eggetarian, Non-Vegetarian, Other
    custom_diet_exclusions: Optional[str] = None

class ClientOnboardingStep4(BaseModel):
    preferred_cuisine: str  # Indian, South Indian, North Indian, Continental, Mixed, or custom

class ClientOnboardingStep5(BaseModel):
    allergy_ids: List[int] = []
    avoidance_items: List[str] = []
    personal_notes: Optional[str] = None

class ClientOnboardingStep6(BaseModel):
    activity_level: str  # Low, Moderate, High

class CompleteOnboardingRequest(BaseModel):
    age: int
    preferred_language: str = "English"
    fitness_goal: str
    diet_type: str
    custom_diet_exclusions: Optional[str] = None
    preferred_cuisine: str
    allergy_ids: List[int] = []
    avoidance_items: List[str] = []
    personal_notes: Optional[str] = None
    activity_level: str

class ClientPreferenceResponse(BaseModel):
    fitness_goal: str
    diet_type: str
    custom_diet_exclusions: Optional[str]
    preferred_cuisine: str
    activity_level: str
    notes: Optional[str]

    class Config:
        from_attributes = True

class ClientProfileDetailResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    age: Optional[int]
    preferred_language: str
    preferences: Optional[ClientPreferenceResponse]
    allergies: List[str] = []
    allergy_ids: List[int] = []
    avoidances: List[str] = []
    assigned_coach: Optional[Dict[str, Any]] = None

# --- FOOD & NUTRITION SCHEMAS ---
class AllergyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True

class FoodCategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    icon: Optional[str]

    class Config:
        from_attributes = True

class FoodNutritionResponse(BaseModel):
    protein_g: float
    carbs_g: float
    fat_g: float
    calories: float
    fiber_g: float
    source: str
    verified: bool

    class Config:
        from_attributes = True

class FoodItemResponse(BaseModel):
    id: int
    name: str
    category_id: int
    category_name: Optional[str] = None
    food_type: str
    diet_type: str
    cuisine: str
    serving_description: str
    serving_unit: str
    tags: str
    image_url: Optional[str] = None
    is_active: bool
    nutrition: Optional[FoodNutritionResponse] = None
    allergens: List[str] = []
    is_favorite: Optional[bool] = False

    class Config:
        from_attributes = True

class FoodItemCreate(BaseModel):
    name: str
    category_id: int
    food_type: str = "Whole Food"
    diet_type: str = "Vegetarian"
    cuisine: str = "Indian"
    serving_description: str = "100g"
    serving_unit: str = "g"
    tags: str = ""
    protein_g: float
    carbs_g: float
    fat_g: float
    calories: float
    fiber_g: float = 0.0
    source: str = "IFCT"
    allergy_ids: List[int] = []

class FoodComparisonRequest(BaseModel):
    food_ids: List[int]

# --- RECOMMENDATION SCHEMAS ---
class RecommendationItemResponse(BaseModel):
    id: int
    food_id: int
    food_name: str
    category: str
    diet_type: str
    cuisine: str
    serving_description: str
    protein_g: float
    carbs_g: float
    fat_g: float
    calories: float
    source: str
    match_score: float
    diet_match_score: float
    cuisine_match_score: float
    preference_match_score: float
    feedback_score: float
    nutrition_score: float
    explanation_points: List[str]
    rank_order: int
    user_feedback: Optional[bool] = None  # None, True (useful), False (not useful)
    is_favorite: bool = False

class RecommendationResponse(BaseModel):
    recommendation_id: int
    total_recommendations: int
    items: List[RecommendationItemResponse]
    context_applied: Dict[str, Any]

class RecommendationRuleResponse(BaseModel):
    id: int
    rule_name: str
    rule_key: str
    weight: float
    is_active: bool
    description: Optional[str]

    class Config:
        from_attributes = True

class RecommendationRuleUpdate(BaseModel):
    weight: float
    is_active: bool

class RecommendationFeedbackCreate(BaseModel):
    recommendation_item_id: int
    food_id: int
    is_useful: bool
    feedback_text: Optional[str] = None

# --- WORKOUT & EXERCISE SCHEMAS ---
class ExerciseResponse(BaseModel):
    id: int
    name: str
    category: str
    muscle_group: str
    description: Optional[str]
    difficulty: str

    class Config:
        from_attributes = True

class ExerciseCreate(BaseModel):
    name: str
    category: str
    muscle_group: str
    description: Optional[str] = None
    difficulty: str = "Medium"

class BiomechanicsErrorDetail(BaseModel):
    id: str
    error_name: str
    severity: str
    joint_affected: str
    biomechanical_risk: str
    muscle_imbalance: str
    corrective_cue: str
    remedial_exercise: str

class BiomechanicsProfileResponse(BaseModel):
    exercise_id: int
    exercise_name: str
    category: str
    primary_muscles: List[str]
    secondary_muscles: List[str]
    target_angles: Dict[str, str]
    tempo_guideline: str
    errors: List[BiomechanicsErrorDetail]
    protein_recovery_tip: str
    recommended_foods: List[Dict[str, Any]]

class FormAnalysisRequest(BaseModel):
    exercise_name: str
    joint_angles: Optional[Dict[str, float]] = None
    rep_count: Optional[int] = 1
    tempo_seconds: Optional[float] = 3.0
    simulated_fault: Optional[str] = None

class FormAnalysisResponse(BaseModel):
    exercise_name: str
    form_score: int
    movement_quality: str
    detected_errors: List[BiomechanicsErrorDetail]
    corrective_cues: List[str]
    joint_metrics: Dict[str, Any]
    protein_target_g: float
    recommended_foods: List[Dict[str, Any]]
    analyzed_at: datetime


class WorkoutExerciseItem(BaseModel):
    exercise_id: int
    sets: int = 3
    reps: int = 10
    weight_kg: float = 0.0
    duration_seconds: Optional[int] = None

class WorkoutCreate(BaseModel):
    workout_type: str
    duration_minutes: int
    difficulty: str = "Medium"
    notes: Optional[str] = None
    workout_date: Optional[datetime] = None
    exercises: List[WorkoutExerciseItem] = []

class WorkoutResponse(BaseModel):
    id: int
    workout_type: str
    duration_minutes: int
    workout_date: datetime
    difficulty: str
    notes: Optional[str]
    exercises: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

# --- ACTIVITY SCHEMAS ---
class ActivityLogCreate(BaseModel):
    steps: int = 0
    active_minutes: int = 0
    activity_type: str = "Walking"
    distance_km: float = 0.0
    calories_burned: float = 0.0
    notes: Optional[str] = None
    log_date: Optional[datetime] = None

class ActivityLogResponse(BaseModel):
    id: int
    log_date: datetime
    steps: int
    active_minutes: int
    activity_type: str
    distance_km: float
    calories_burned: float
    notes: Optional[str]

    class Config:
        from_attributes = True

# --- NUTRITION LOG SCHEMAS ---
class NutritionLogCreate(BaseModel):
    meal_type: str  # Breakfast, Lunch, Dinner, Snack
    food_item_id: Optional[int] = None
    custom_food_name: Optional[str] = None
    serving_quantity: float = 1.0
    serving_unit: str = "serving"
    protein_g: float = 0.0
    calories: float = 0.0
    notes: Optional[str] = None
    log_date: Optional[datetime] = None

class NutritionLogResponse(BaseModel):
    id: int
    meal_type: str
    food_item_id: Optional[int]
    food_name: str
    serving_quantity: float
    serving_unit: str
    protein_g: float
    calories: float
    log_date: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True

# --- GOALS SCHEMAS ---
class GoalCreate(BaseModel):
    title: str
    category: str = "workout_consistency"
    target_value: float = 100.0
    current_value: float = 0.0
    unit: str = "%"
    target_date: Optional[datetime] = None

class GoalUpdate(BaseModel):
    current_value: Optional[float] = None
    status: Optional[str] = None
    title: Optional[str] = None
    target_value: Optional[float] = None

class GoalResponse(BaseModel):
    id: int
    client_id: int
    title: str
    category: str
    target_value: float
    current_value: float
    unit: str
    progress_percentage: float
    status: str
    start_date: datetime
    target_date: Optional[datetime]

# --- COACH & ADMIN SCHEMAS ---
class CoachClientAssignRequest(BaseModel):
    coach_id: int
    client_id: int
    notes: Optional[str] = None

class CoachClientResponse(BaseModel):
    id: int
    coach_id: int
    client_id: int
    client_name: str
    client_email: str
    diet_type: str
    fitness_goal: str
    activity_level: str
    assigned_at: datetime
    status: str
    notes: Optional[str]

class SystemAnalyticsResponse(BaseModel):
    total_users: int
    total_clients: int
    total_coaches: int
    total_food_items: int
    recommendations_generated: int
    recommendation_acceptance_rate: float
    active_users: int
    top_categories: List[Dict[str, Any]]
    preference_distribution: Dict[str, Any]

class ChatQueryRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []

class ChatQueryResponse(BaseModel):
    reply: str
    recommended_foods: List[Dict[str, Any]] = []
    disclaimer: str

class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10

# --- DIET PLAN SCHEMAS (WEIGHT CATEGORY & ACTIVITY REFERENCE DATASET) ---
class DietPlanResponse(BaseModel):
    id: int
    weight_range: str
    weight_min_kg: float
    weight_max_kg: float
    activity_type: str
    activity: str
    activity_intensity: str
    nutrition_priority: str
    main_food_groups: str
    breakfast: str
    mid_morning: str
    lunch: str
    pre_training: str
    post_training: str
    dinner: str
    hydration: str
    app_personalization: str
    portion_logic: str
    active_goal: Optional[str] = "Maintain"
    target_calories: int
    target_protein_g: float
    target_carbs_g: float
    target_fat_g: float
    water_liters_min: float
    water_liters_max: float
    goal_guidance: Optional[str] = None
    icon: str = "dumbbell"

    class Config:
        from_attributes = True

class DietPlanLogMealRequest(BaseModel):
    plan_id: int
    meal_type: str  # Breakfast, Mid-morning, Lunch, Pre-training, Post-training, Dinner
    custom_food_name: Optional[str] = None
    serving_quantity: float = 1.0
    serving_unit: str = "portion"
    protein_g: float
    calories: float
    notes: Optional[str] = None
