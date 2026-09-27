import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    CLIENT = "client"
    COACH = "coach"
    ADMIN = "admin"

class DietType(str, enum.Enum):
    VEGAN = "Vegan"
    VEGETARIAN = "Vegetarian"
    EGGETARIAN = "Eggetarian"
    NON_VEGETARIAN = "Non-Vegetarian"
    OTHER = "Other"

class ActivityLevel(str, enum.Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"

class FitnessGoal(str, enum.Enum):
    GENERAL_FITNESS = "General fitness"
    STRENGTH_DEVELOPMENT = "Strength development"
    ENDURANCE = "Endurance"
    FITNESS_CONSISTENCY = "Fitness consistency"
    WELLNESS_HABIT = "Wellness habit improvement"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.CLIENT.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    client_profile = relationship("ClientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    coach_profile = relationship("CoachProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    client_preferences = relationship("ClientPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    client_allergies = relationship("ClientAllergy", back_populates="user", cascade="all, delete-orphan")
    client_food_avoidance = relationship("ClientFoodAvoidance", back_populates="user", cascade="all, delete-orphan")
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    nutrition_logs = relationship("NutritionLog", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", foreign_keys="[Goal.client_id]", back_populates="client", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="client", cascade="all, delete-orphan")
    favorite_foods = relationship("FavoriteFood", back_populates="user", cascade="all, delete-orphan")
    search_history = relationship("SearchHistory", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

class ClientProfile(Base):
    __tablename__ = "client_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    preferred_language = Column(String(50), default="English")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="client_profile")

class CoachProfile(Base):
    __tablename__ = "coach_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    specialization = Column(String(255), default="Sports Nutrition & Wellness")
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="coach_profile")

class CoachClient(Base):
    __tablename__ = "coach_clients"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="active")  # active, completed, inactive
    notes = Column(Text, nullable=True)

    coach = relationship("User", foreign_keys=[coach_id])
    client = relationship("User", foreign_keys=[client_id])

class ClientPreference(Base):
    __tablename__ = "client_preferences"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    fitness_goal = Column(String(100), default="General fitness")
    diet_type = Column(String(50), default="Vegetarian")
    custom_diet_exclusions = Column(Text, nullable=True)  # JSON or comma-separated list of exclusions for 'Other'
    preferred_cuisine = Column(String(100), default="Indian")  # Indian, South Indian, North Indian, Continental, Mixed, Custom
    activity_level = Column(String(50), default="Moderate")  # Low, Moderate, High
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="client_preferences")

class Allergy(Base):
    __tablename__ = "allergies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    food_allergens = relationship("FoodAllergen", back_populates="allergy")
    client_allergies = relationship("ClientAllergy", back_populates="allergy")

class ClientAllergy(Base):
    __tablename__ = "client_allergies"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    allergy_id = Column(Integer, ForeignKey("allergies.id"), nullable=False)
    severity = Column(String(50), default="moderate")

    user = relationship("User", back_populates="client_allergies")
    allergy = relationship("Allergy", back_populates="client_allergies")

class ClientFoodAvoidance(Base):
    __tablename__ = "client_food_avoidance"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    avoidance_item = Column(String(100), nullable=False)  # Food item or tag to avoid (e.g., 'mushroom', 'beef', 'ghee')

    user = relationship("User", back_populates="client_food_avoidance")

class FoodCategory(Base):
    __tablename__ = "food_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # Dairy, Legumes, Pulses, Soy, Nuts, Seeds, Eggs, Meat, Fish, Other
    description = Column(String(255), nullable=True)
    icon = Column(String(50), default="utensils")

    foods = relationship("FoodItem", back_populates="category")

class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("food_categories.id"), nullable=False)
    food_type = Column(String(100), default="Whole Food")  # Whole Food, Processed, Supplement
    diet_type = Column(String(50), default="Vegetarian")  # Vegan, Vegetarian, Eggetarian, Non-Vegetarian
    cuisine = Column(String(100), default="Indian")  # Indian, South Indian, North Indian, Continental, Mixed
    serving_description = Column(String(150), default="100g")
    serving_unit = Column(String(50), default="g")
    tags = Column(String(255), default="")  # comma-separated tags e.g. "high-protein,low-carb,calcium-rich"
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    category = relationship("FoodCategory", back_populates="foods")
    nutrition = relationship("FoodNutrition", back_populates="food", uselist=False, cascade="all, delete-orphan")
    allergens = relationship("FoodAllergen", back_populates="food", cascade="all, delete-orphan")
    favorites = relationship("FavoriteFood", back_populates="food", cascade="all, delete-orphan")
    recommendation_items = relationship("RecommendationItem", back_populates="food")

class FoodNutrition(Base):
    __tablename__ = "food_nutrition"

    id = Column(Integer, primary_key=True, index=True)
    food_id = Column(Integer, ForeignKey("food_items.id"), unique=True, nullable=False)
    protein_g = Column(Float, nullable=False)
    carbs_g = Column(Float, nullable=False)
    fat_g = Column(Float, nullable=False)
    calories = Column(Float, nullable=False)
    fiber_g = Column(Float, default=0.0)
    source = Column(String(100), default="IFCT")  # IFCT (Indian Food Composition Tables) or USDA FoodData Central
    verified = Column(Boolean, default=True)

    food = relationship("FoodItem", back_populates="nutrition")

class FoodAllergen(Base):
    __tablename__ = "food_allergens"

    id = Column(Integer, primary_key=True, index=True)
    food_id = Column(Integer, ForeignKey("food_items.id"), nullable=False, index=True)
    allergy_id = Column(Integer, ForeignKey("allergies.id"), nullable=False, index=True)

    food = relationship("FoodItem", back_populates="allergens")
    allergy = relationship("Allergy", back_populates="food_allergens")

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    category = Column(String(100), default="Strength")  # Strength, Cardio, Mobility, Flexibility, Core
    muscle_group = Column(String(100), default="Full Body")
    description = Column(Text, nullable=True)
    difficulty = Column(String(50), default="Medium")  # Beginner, Medium, Advanced

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    workout_type = Column(String(100), default="Strength")  # Strength, Running, Walking, Cycling, Yoga, Sports, Cardio, Mobility
    duration_minutes = Column(Integer, default=30)
    workout_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    difficulty = Column(String(50), default="Medium")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="workouts")
    exercises = relationship("WorkoutExercise", back_populates="workout", cascade="all, delete-orphan")

class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    sets = Column(Integer, default=3)
    reps = Column(Integer, default=10)
    weight_kg = Column(Float, default=0.0)
    duration_seconds = Column(Integer, nullable=True)

    workout = relationship("Workout", back_populates="exercises")
    exercise = relationship("Exercise")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    log_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    steps = Column(Integer, default=0)
    active_minutes = Column(Integer, default=0)
    activity_type = Column(String(100), default="Walking")  # Walking, Running, Cycling, General
    distance_km = Column(Float, default=0.0)
    calories_burned = Column(Float, default=0.0)
    notes = Column(String(255), nullable=True)

    user = relationship("User", back_populates="activity_logs")

class NutritionLog(Base):
    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    meal_type = Column(String(50), default="Lunch")  # Breakfast, Lunch, Dinner, Snack
    food_item_id = Column(Integer, ForeignKey("food_items.id"), nullable=True)
    custom_food_name = Column(String(150), nullable=True)
    serving_quantity = Column(Float, default=1.0)
    serving_unit = Column(String(50), default="serving")
    protein_g = Column(Float, default=0.0)
    calories = Column(Float, default=0.0)
    log_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    notes = Column(String(255), nullable=True)

    user = relationship("User", back_populates="nutrition_logs")
    food_item = relationship("FoodItem")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(100), default="workout_consistency")  # workout_consistency, activity_consistency, balanced_food, regular_habits
    target_value = Column(Float, default=100.0)
    current_value = Column(Float, default=0.0)
    unit = Column(String(50), default="%")
    start_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    target_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="in_progress")  # in_progress, completed, paused
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    client = relationship("User", foreign_keys=[client_id], back_populates="goals")
    creator = relationship("User", foreign_keys=[created_by_id])

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String(100), nullable=True)
    prompt_query = Column(String(255), nullable=True)
    context_snapshot = Column(Text, nullable=True)  # JSON representation of filters & weights applied
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    client = relationship("User", back_populates="recommendations")
    items = relationship("RecommendationItem", back_populates="recommendation", cascade="all, delete-orphan")

class RecommendationItem(Base):
    __tablename__ = "recommendation_items"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"), nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("food_items.id"), nullable=False)
    match_score = Column(Float, default=0.0)  # Total 0-100%
    diet_match_score = Column(Float, default=100.0)
    cuisine_match_score = Column(Float, default=0.0)
    preference_match_score = Column(Float, default=0.0)
    feedback_score = Column(Float, default=0.0)
    nutrition_score = Column(Float, default=0.0)
    explanation_points = Column(Text, nullable=True)  # JSON list of explanation points
    rank_order = Column(Integer, default=1)

    recommendation = relationship("Recommendation", back_populates="items")
    food = relationship("FoodItem", back_populates="recommendation_items")
    feedback = relationship("RecommendationFeedback", back_populates="recommendation_item", uselist=False, cascade="all, delete-orphan")

class RecommendationRule(Base):
    __tablename__ = "recommendation_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), unique=True, nullable=False)
    rule_key = Column(String(100), unique=True, nullable=False)  # diet_match_weight, cuisine_match_weight, preference_match_weight, feedback_weight, nutrition_relevance_weight
    weight = Column(Float, default=1.0)
    is_active = Column(Boolean, default=True)
    description = Column(String(255), nullable=True)

class RecommendationFeedback(Base):
    __tablename__ = "recommendation_feedback"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_item_id = Column(Integer, ForeignKey("recommendation_items.id"), nullable=False, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("food_items.id"), nullable=False)
    is_useful = Column(Boolean, nullable=False)  # True = Useful 👍, False = Not useful 👎
    feedback_text = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    recommendation_item = relationship("RecommendationItem", back_populates="feedback")
    user = relationship("User")
    food = relationship("FoodItem")

class FavoriteFood(Base):
    __tablename__ = "favorite_foods"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("food_items.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="favorite_foods")
    food = relationship("FoodItem", back_populates="favorites")

class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    query = Column(String(255), nullable=False)
    intent_extracted = Column(String(100), nullable=True)
    filters_used = Column(Text, nullable=True)  # JSON
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="search_history")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="info")  # recommendation, goal, reminder, system
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # e.g., UPDATE_RECOMMENDATION_RULE, ASSIGN_COACH_CLIENT, CREATE_FOOD
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(Integer, nullable=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")

class DietPlanTemplate(Base):
    __tablename__ = "diet_plan_templates"

    id = Column(Integer, primary_key=True, index=True)
    weight_range = Column(String(50), nullable=False, index=True)  # "50–60 kg", "60–70 kg", "70–80 kg", "80–90 kg"
    weight_min_kg = Column(Float, nullable=False)
    weight_max_kg = Column(Float, nullable=False)
    activity_type = Column(String(50), nullable=False, index=True)  # "Sports", "Bodybuilding"
    activity = Column(String(100), nullable=False, index=True)  # "Cricket", "Football", etc.
    activity_intensity = Column(String(100), nullable=False)  # "Moderate–high", "High", "Strength training"
    nutrition_priority = Column(String(255), nullable=False)  # "Carbohydrates + protein + hydration"
    main_food_groups = Column(Text, nullable=False)
    breakfast = Column(Text, nullable=False)
    mid_morning = Column(Text, nullable=False)
    lunch = Column(Text, nullable=False)
    pre_training = Column(Text, nullable=False)
    post_training = Column(Text, nullable=False)
    dinner = Column(Text, nullable=False)
    hydration = Column(Text, nullable=False)
    app_personalization = Column(Text, nullable=False)
    portion_logic = Column(Text, nullable=False)

    # Reference nutritional calibration per weight & goal
    calories_maintain = Column(Integer, default=2100)
    calories_gain = Column(Integer, default=2450)
    calories_loss = Column(Integer, default=1750)
    protein_target_g = Column(Float, default=120.0)
    carbs_target_g = Column(Float, default=250.0)
    fat_target_g = Column(Float, default=65.0)
    water_liters_min = Column(Float, default=2.8)
    water_liters_max = Column(Float, default=3.5)
    icon = Column(String(50), default="dumbbell")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
